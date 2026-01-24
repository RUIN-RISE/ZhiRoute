from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
import os

from services.models import JobRequest, ClarificationResponse, ClarificationAnswer, JobDefinition, Resume, CandidateRank, ActionRequest, ActionResponse, ChatRequest, ChatResponse
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
CHAT_HISTORY = []  # Store chat history for clarification
COLLECTED_INFO = {}  # Store collected requirement info

@app.get("/")
async def read_root():
    return FileResponse('templates/index.html')

@app.post("/api/chat", response_model=ChatResponse)
async def chat_clarify_endpoint(req: ChatRequest):
    """Multi-turn dialogue endpoint for requirement clarification"""
    global CHAT_HISTORY, COLLECTED_INFO
    
    # Use provided history or stored history
    history = [{"role": m.role, "content": m.content} for m in req.history] if req.history else CHAT_HISTORY
    
    # Call LLM
    response = llm.chat_clarify(history, req.message)
    
    # Store updated history
    if req.message:
        CHAT_HISTORY.append({"role": "user", "content": req.message})
    CHAT_HISTORY.append({"role": "assistant", "content": response.reply})
    
    # Store collected info
    if response.collected_info:
        COLLECTED_INFO.update(response.collected_info)
    
    return response

@app.post("/api/reset_chat")
async def reset_chat():
    """Reset chat history for a new conversation"""
    global CHAT_HISTORY, COLLECTED_INFO
    CHAT_HISTORY = []
    COLLECTED_INFO = {}
    return {"status": "ok"}

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
    pdf_queue = []  # Queue for batch PDF processing: [(name_str, raw_text), ...]
    
    content = await file.read()
    
    def extract_pdf_text(pdf_bytes: bytes) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""
    
    def process_pdf_batch(batch: list) -> list:
        """Process a batch of PDFs with one LLM call"""
        if not batch:
            return []
        raw_texts = [item[1] for item in batch]
        from services.llm import batch_structure_resumes
        return batch_structure_resumes(raw_texts)
    
    BATCH_SIZE = 5
    
    if file.filename.endswith('.zip'):
        with zipfile.ZipFile(io.BytesIO(content), 'r') as zip_ref:
            for filename in zip_ref.namelist():
                if filename.startswith('__MACOSX') or filename.startswith('.'):
                    continue
                    
                # Fix Chinese encoding in Zip
                try:
                    name_str = filename.encode('cp437').decode('gbk')
                except:
                    name_str = filename
                
                if filename.lower().endswith('.pdf'):
                    # Queue PDF for batch processing
                    with zip_ref.open(filename) as f:
                        raw_bytes = f.read()
                        raw_text = extract_pdf_text(raw_bytes)
                        if raw_text:
                            pdf_queue.append((name_str, raw_text))
                            
                elif filename.lower().endswith('.txt') or filename.lower().endswith('.md'):
                    # Process text files directly
                    with zip_ref.open(filename) as f:
                        text = f.read().decode('utf-8', errors='ignore')
                        if text:
                            resumes.append(Resume(
                                id=name_str,
                                name=os.path.basename(name_str).split('.')[0],
                                content=text,
                                parsed_skills=[],
                                years_experience=3
                            ))
        
        # Process PDF queue in batches
        for i in range(0, len(pdf_queue), BATCH_SIZE):
            batch = pdf_queue[i:i + BATCH_SIZE]
            print(f"Processing PDF batch {i//BATCH_SIZE + 1}: {len(batch)} files")
            structured_texts = process_pdf_batch(batch)
            
            for j, (name_str, _) in enumerate(batch):
                text = structured_texts[j] if j < len(structured_texts) else batch[j][1]
                resumes.append(Resume(
                    id=name_str,
                    name=os.path.basename(name_str).split('.')[0],
                    content=text,
                    parsed_skills=[],
                    years_experience=3
                ))
                            
    elif file.filename.lower().endswith('.pdf'):
        # Single PDF file
        raw_text = extract_pdf_text(content)
        if raw_text:
            from services.llm import structure_resume
            text = structure_resume(raw_text)
            resumes.append(Resume(
                id=file.filename,
                name=file.filename.split('.')[0],
                content=text,
                parsed_skills=[],
                years_experience=3
            ))
    else:
        # Single text file
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
    print(f"DEBUG API: Returning {len(ranks)} candidates to frontend")
    return ranks

@app.post("/api/generate_action", response_model=ActionResponse)
async def gen_action(req: ActionRequest):
    return llm.generate_action(req.candidate_name, req.action_type, req.job_title)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
