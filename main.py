from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
import os

from services.models import JobRequest, ClarificationResponse, ClarificationAnswer, JobDefinition, Resume, CandidateRank, ActionRequest, ActionResponse
from services import llm
from services import fake_data

app = FastAPI(title="Recruitment Copilot")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# State (In-memory for MVP)
CURRENT_JD = None
GENERATED_RESUMES = []

@app.get("/")
async def read_root():
    return FileResponse('templates/index.html')

@app.post("/api/clarify", response_model=ClarificationResponse)
async def clarify_req(req: JobRequest):
    return llm.clarify_requirements(req.raw_requirement)

class GenerateJdRequest(BaseModel):
    answers: List[ClarificationAnswer]
    raw_req: str

@app.post("/api/generate_jd", response_model=JobDefinition)
async def generate_jd_endpoint(req: GenerateJdRequest):
    global CURRENT_JD
    # Convert list to dict for LLM
    answers_dict = {a.question_id: a.answer for a in req.answers}
    jd = llm.generate_jd(answers_dict, req.raw_req)
    CURRENT_JD = jd
    return jd

@app.post("/api/upload_resumes", response_model=List[Resume])
async def upload_resumes(file: UploadFile = File(...)):
    global GENERATED_RESUMES
    import zipfile
    import io
    
    resumes = []
    
    content = await file.read()
    
    if file.filename.endswith('.zip'):
        with zipfile.ZipFile(io.BytesIO(content), 'r') as zip_ref:
            for filename in zip_ref.namelist():
                if filename.startswith('__MACOSX') or filename.startswith('.'):
                    continue
                if filename.endswith('.txt') or filename.endswith('.md'):
                    # Fix Chinese encoding in Zip
                    try:
                        name_str = filename.encode('cp437').decode('gbk')
                    except:
                        name_str = filename
                        
                    with zip_ref.open(filename) as f:
                        text = f.read().decode('utf-8', errors='ignore')
                        resumes.append(Resume(
                            id=name_str,
                            name=os.path.basename(name_str).split('.')[0],
                            content=text,
                            parsed_skills=[], # To be filled by analysis if needed
                            years_experience=3 # Placeholder or extract later
                        ))
    else:
        # Single file
        text = content.decode('utf-8', errors='ignore')
        resumes.append(Resume(
            id=file.filename,
            name=file.filename.split('.')[0],
            content=text,
            parsed_skills=[],
            years_experience=3
        ))
    
    GENERATED_RESUMES = resumes
    return resumes

@app.get("/api/generate_fake_resumes", response_model=List[Resume])
async def get_fake_resumes():
    global GENERATED_RESUMES
    role_hint = "python"
    if CURRENT_JD:
        role_hint = CURRENT_JD.title
    
    resumes = fake_data.generate_fake_resumes(count=5, role_hint=role_hint)
    GENERATED_RESUMES = resumes
    return resumes

@app.post("/api/analyze_resumes", response_model=List[CandidateRank])
async def analyze_resumes():
    global CURRENT_JD, GENERATED_RESUMES
    if not CURRENT_JD:
        raise HTTPException(status_code=400, detail="No JD generated yet")
    if not GENERATED_RESUMES:
        raise HTTPException(status_code=400, detail="No resumes loaded")
    
    # Convert Pydantic models to dicts for the service
    resume_dicts = [r.dict() for r in GENERATED_RESUMES]
    ranks = llm.rank_candidates(CURRENT_JD, resume_dicts)
    return ranks

@app.post("/api/generate_action", response_model=ActionResponse)
async def gen_action(req: ActionRequest):
    return llm.generate_action(req.candidate_name, req.action_type, req.job_title)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
