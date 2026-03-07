from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Header, Depends
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
import httpx
import json

app = FastAPI(title="Recruitment Copilot")

# --- Cloud Storage Helper ---
def save_dict_to_cloud_bg(account_name: str, session_id: str, record_type: str, content_dict: dict):
    from dotenv import load_dotenv
    load_dotenv(override=True)
    import os
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80") 
    url = f"{cloud_api}/api/cloud/save_record"
    print(f"Saving {record_type} to cloud: {url}")
    payload = {
        "account_name": account_name,
        "session_id": session_id,
        "record_type": record_type,
        "content": content_dict
    }
    try:
        import requests
        resp = requests.post(url, json=payload, timeout=5.0)
        resp.raise_for_status()
    except Exception as e:
        print(f"Failed to save record to cloud: {e}")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC FILES FOR FRONTEND ---
# Mount the "dist" directory (built frontend)
# We assume the frontend is built into 'temp_frontend/dist' and copied or available
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(APP_ROOT, "temp_frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "JobOS-Backend"}

from fastapi import Header, Depends

# State (Session-based)
class UserState:
    def __init__(self):
        self.current_jd = None
        self.resumes = []
        self.chat_history = []
        self.collected_info = {}
        self.account_name = ""
        self.session_id = ""

# In-memory session store: session_id -> UserState
SESSIONS: Dict[str, UserState] = {}

def get_current_user(x_session_id: str = Header(None)) -> UserState:
    from fastapi import HTTPException
    if not x_session_id:
        raise HTTPException(status_code=401, detail="未提供有效会话，请先登录")
    user = SESSIONS.get(x_session_id)
    if not user:
        # Implicitly create a guest session for unregistered users
        user = UserState()
        user.session_id = x_session_id
        user.account_name = "guest"
        SESSIONS[x_session_id] = user
    return user

import time

# Load invites
INVITES_FILE = os.path.join(APP_ROOT, "invites.json")
try:
    with open(INVITES_FILE, "r", encoding="utf-8") as f:
        INVITES_MAP = json.load(f)
except Exception as e:
    print(f"Failed to load invites: {e}")
    print("CRITICAL: invites.json not found or invalid! System started in fail-closed mode.")
    INVITES_MAP = {}

# ACTIVE_SESSIONS is now managed globally by 163 cloud server
# We no longer need local ACTIVE_SESSIONS or HEARTBEAT_TIMEOUT

class LoginRequest(BaseModel):
    invite_code: str
    
@app.post("/api/login")
async def login(req: LoginRequest, x_session_id: str = Header(None)):
    import os
    import httpx
    from dotenv import load_dotenv
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID")
        
    code = req.invite_code.strip()
    
    # Delegate to global cloud server
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    url = f"{cloud_api}/api/cloud/auth/login"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json={"invite_code": code, "session_id": x_session_id})
            resp.raise_for_status()
            account_name = resp.json().get("account_name")
    except httpx.HTTPStatusError as e:
        if e.response.status_code in [401, 403]:
            detail = e.response.json().get("detail", "Auth failed")
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        raise HTTPException(status_code=500, detail="Cloud auth failed")
    except Exception as e:
        # For resilience, if cloud server is down, fallback to local file logic.
        if code not in INVITES_MAP:
            raise HTTPException(status_code=401, detail="云服务未响应且无效的内测码")
        account_name = INVITES_MAP[code]
        print(f"Fallback to local auth: {e}")
        
    # Ensure UserState exists
    if x_session_id not in SESSIONS:
        SESSIONS[x_session_id] = UserState()
    
    SESSIONS[x_session_id].account_name = account_name
    SESSIONS[x_session_id].session_id = x_session_id
        
    return {"status": "success", "account_name": account_name}

@app.post("/api/heartbeat")
async def heartbeat(x_session_id: str = Header(None), x_account_name: str = Header(None)):
    if not x_account_name or not x_session_id:
        return {"status": "ignored"}
        
    import os
    import httpx
    from dotenv import load_dotenv
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    url = f"{cloud_api}/api/cloud/auth/heartbeat"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, json={"account_name": x_account_name, "session_id": x_session_id})
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            raise HTTPException(status_code=403, detail="账号已被其他终端挤占")
    except Exception:
        pass
        
    return {"status": "ok"}

@app.post("/api/logout")
async def logout(x_session_id: str = Header(None), user: UserState = Depends(get_current_user)):
    import os
    import httpx
    from dotenv import load_dotenv
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    if user.account_name and x_session_id:
        url = f"{cloud_api}/api/cloud/auth/logout"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(url, json={"account_name": user.account_name, "session_id": x_session_id})
        except Exception as e:
            print(f"Cloud logout failed: {e}")
            
    if x_session_id in SESSIONS:
        del SESSIONS[x_session_id]
        
    return {"status": "success"}


# Clean up globals
# CURRENT_JD = None
# GENERATED_RESUMES = []
# CHAT_HISTORY = []
# COLLECTED_INFO = {}

async def read_root():
    return FileResponse('templates/index.html')

@app.post("/api/chat", response_model=ChatResponse)
async def chat_clarify_endpoint(req: ChatRequest, user: UserState = Depends(get_current_user)):
    """Multi-turn dialogue endpoint for requirement clarification"""
    
    # Use provided history or stored history
    history = [{"role": m.role, "content": m.content} for m in req.history] if req.history else user.chat_history
    
    # Call LLM
    response = llm.chat_clarify(history, req.message)
    
    # Store updated history
    if req.message:
        user.chat_history.append({"role": "user", "content": req.message})
    user.chat_history.append({"role": "assistant", "content": response.reply})
    
    # Store collected info
    if response.collected_info:
        user.collected_info.update(response.collected_info)
    
    return response

@app.post("/api/reset_chat")
async def reset_chat(user: UserState = Depends(get_current_user)):
    """Reset chat history for a new conversation"""
    user.chat_history = []
    user.collected_info = {}
    return {"status": "ok"}

@app.post("/api/clarify", response_model=ClarificationResponse)
async def clarify_req(req: JobRequest):
    return llm.clarify_requirements(req.raw_requirement)

class GenerateJdRequest(BaseModel):
    answers: List[ClarificationAnswer]
    raw_req: str

@app.post("/api/generate_jd", response_model=JobDefinition)
async def generate_jd_endpoint(req: GenerateJdRequest, bg_tasks: BackgroundTasks, user: UserState = Depends(get_current_user)):
    # Convert list to dict for LLM
    answers_dict = {a.question_id: a.answer for a in req.answers}
    jd = llm.generate_jd(answers_dict, req.raw_req)
    
    user.current_jd = jd
    
    # Save to cloud only if not a guest
    if getattr(user, "account_name", "") != "guest":
        bg_tasks.add_task(save_dict_to_cloud_bg, user.account_name, user.session_id, "jd", jd.dict())
    
    return jd

@app.post("/api/clear_resumes")
async def clear_resumes_endpoint(user: UserState = Depends(get_current_user)):
    user.resumes.clear()
    return {"status": "ok", "message": "Resumes cleared"}

@app.post("/api/upload_resumes", response_model=List[Resume])
async def upload_resumes(file: UploadFile = File(...), user: UserState = Depends(get_current_user)):
    content = await file.read()
    filename = file.filename
    return await process_resume_content(content, filename, user)

async def process_resume_content(content: bytes, filename: str, user: UserState) -> List[Resume]:
    import zipfile
    import io

    resumes = []
    pdf_queue = []  # Queue for batch PDF processing: [(name_str, raw_text), ...]
    
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
    
    if filename.endswith('.zip'):
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
                            
    elif filename.lower().endswith('.pdf'):
        # Single PDF file
        raw_text = extract_pdf_text(content)
        if raw_text:
            from services.llm import structure_resume
            text = structure_resume(raw_text)
            resumes.append(Resume(
                id=filename,
                name=filename.split('.')[0],
                content=text,
                parsed_skills=[],
                years_experience=3
            ))
    else:
        # Single text file
        text = content.decode('utf-8', errors='ignore')
        resumes.append(Resume(
            id=filename,
            name=filename.split('.')[0],
            content=text,
            parsed_skills=[],
            years_experience=3
        ))
    
    # Append to user session instead of overwriting!
    user.resumes.extend(resumes)
    
    # Return ALL resumes for this user so frontend count is accurate
    return user.resumes

@app.post("/api/fetch_resumes_from_cloud", response_model=List[Resume])
async def fetch_resumes_from_cloud(user: UserState = Depends(get_current_user)):
    import httpx
    import os
    from dotenv import load_dotenv

    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    url = f"{cloud_api}/api/cloud/download_public_resume"
    print(f"Fetching public resume from: {url}")
    
    try:
        # 增加超时限制和重定向追随
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # 使用提取出的核心解析逻辑来处理下载到的字节流
            return await process_resume_content(response.content, "output_resume.zip", user)
    except Exception as e:
        print(f"Error fetching from cloud: {e}")
        raise HTTPException(status_code=500, detail=f"无法从云端获取简历数据: {e}")

@app.get("/api/generate_fake_resumes", response_model=List[Resume])
async def get_fake_resumes(user: UserState = Depends(get_current_user)):
    role_hint = "python"
    if user.current_jd:
        role_hint = user.current_jd.title
    
    resumes = fake_data.generate_fake_resumes(count=5, role_hint=role_hint)
    user.resumes.extend(resumes)
    return user.resumes

@app.post("/api/set_current_jd")
async def set_current_jd(jd: JobDefinition, user: UserState = Depends(get_current_user)):
    user.current_jd = jd
    return {"status": "success"}

@app.post("/api/analyze_resumes", response_model=List[CandidateRank])
async def analyze_resumes(user: UserState = Depends(get_current_user)):
    if not user.current_jd:
        raise HTTPException(status_code=400, detail="No JD generated yet")
    if not user.resumes:
        raise HTTPException(status_code=400, detail="No resumes loaded")
    
    # Convert Pydantic models to dicts for the service
    resume_dicts = [r.dict() for r in user.resumes]
    ranks = llm.rank_candidates(user.current_jd, resume_dicts)
    print(f"DEBUG API: Returning {len(ranks)} candidates to frontend")
    return ranks

@app.post("/api/generate_action", response_model=ActionResponse)
async def gen_action(req: ActionRequest, user: UserState = Depends(get_current_user)):
    # 将当前会话的 JD 上下文（含薪资等）注入生成逻辑
    action_resp = llm.generate_action(req.candidate_name, req.action_type, req.job_title, user.current_jd)
    return action_resp

@app.post("/api/generate_jd_markdown")
async def generate_jd_markdown_api(user: UserState = Depends(get_current_user)):
    """使用 LLM 生成可对外发布的完整 JD 文档（Markdown 格式）"""
    if not user.current_jd:
        raise HTTPException(status_code=400, detail="No JD in session. Please generate a JD first.")
    md_text = llm.generate_jd_markdown(user.current_jd)
    return {"markdown": md_text}

# --- Cloud Storage Proxies ---
@app.get("/api/account_history")
async def get_history(record_type: str = None, user: UserState = Depends(get_current_user)):
    if getattr(user, "account_name", "") == "guest":
        raise HTTPException(status_code=403, detail="游客无此操作权限，请登录使用正式账号体验历史与私有库")
    
    import os
    from dotenv import load_dotenv
    import httpx
    
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    url = f"{cloud_api}/api/cloud/get_records/{user.account_name}?session_id={user.session_id}"
    print(f"Fetching history from: {url}")
    params = {"record_type": record_type} if record_type else {}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []

@app.delete("/api/delete_history/{record_id}")
async def delete_history(record_id: int, user: UserState = Depends(get_current_user)):
    """代理删除云端历史记录（按主键 id + 账号验权）"""
    import os, httpx
    from dotenv import load_dotenv
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    url = f"{cloud_api}/api/cloud/delete_record/{record_id}?account_name={user.account_name}&session_id={user.session_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url)   # 使用 POST 兼容不支持 DELETE 方法的反代环境
            resp.raise_for_status()
            return {"status": "success"}
    except Exception as e:
        print(f"Error deleting history: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete record")

@app.post("/api/upload_private_resume")
async def upload_private(file: UploadFile = File(...), user: UserState = Depends(get_current_user)):
    if getattr(user, "account_name", "") == "guest":
        raise HTTPException(status_code=403, detail="游客无此操作权限，请登录使用正式账号体验历史与私有库")
    
    import os
    from dotenv import load_dotenv
    import httpx
    
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    url = f"{cloud_api}/api/cloud/upload_private_resume"
    print(f"Uploading private format to: {url}")
    
    content_bytes = await file.read()
    filename = file.filename
    content_type = file.content_type
    
    if filename.lower().endswith('.pdf'):
        try:
            import fitz
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            text = "".join([page.get_text() for page in doc]).strip()
            doc.close()
            if text:
                content_bytes = text.encode('utf-8')
                filename = filename[:-4] + '.txt'
                content_type = 'text/plain'
        except Exception as e:
            print(f"Failed to convert PDF to TXT during upload: {e}")
            pass # fallback to uploading raw PDF
            
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {'file': (filename, content_bytes, content_type)}
            data = {'account_name': user.account_name, 'session_id': user.session_id}
            resp = await client.post(url, data=data, files=files)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"Error uploading private resume: {e}")
        raise HTTPException(500, detail="Failed to upload to cloud")

@app.get("/api/list_private_resumes")
async def list_private_resumes_api(user: UserState = Depends(get_current_user)):
    if getattr(user, "account_name", "") == "guest":
        raise HTTPException(status_code=403, detail="游客无此操作权限，请登录使用正式账号体验历史与私有库")
    
    import os
    from dotenv import load_dotenv
    import httpx
    
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    url = f"{cloud_api}/api/cloud/list_private_resumes/{user.account_name}?session_id={user.session_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"Error listing private resumes: {e}")
        return []

@app.delete("/api/delete_private_resume/{filename}")
async def delete_private_resume_api(filename: str, user: UserState = Depends(get_current_user)):
    if getattr(user, "account_name", "") == "guest":
        raise HTTPException(status_code=403, detail="游客无此操作权限，请登录使用正式账号体验历史与私有库")
    
    import os
    import urllib.parse
    from dotenv import load_dotenv
    import httpx
    
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    safe_filename = urllib.parse.quote(filename)
    url = f"{cloud_api}/api/cloud/delete_private_resume/{user.account_name}/{safe_filename}?session_id={user.session_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url) # Using POST to avoid proxy DELETE blocking
            resp.raise_for_status()
            return {"status": "success"}
    except Exception as e:
        print(f"Error deleting private resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete resume")

@app.post("/api/fetch_private_resumes", response_model=List[Resume])
async def fetch_private_resumes(filename: str, user: UserState = Depends(get_current_user)):
    if getattr(user, "account_name", "") == "guest":
        raise HTTPException(status_code=403, detail="游客无此操作权限，请登录使用正式账号体验历史与私有库")
    
    import os
    import urllib.parse
    from dotenv import load_dotenv
    import httpx
    
    load_dotenv(override=True)
    cloud_api = os.getenv("CLOUD_STORAGE_API", "http://163.7.10.125:80")
    
    safe_filename = urllib.parse.quote(filename)
    url = f"{cloud_api}/api/cloud/download_private_resume/{user.account_name}/{safe_filename}?session_id={user.session_id}"
    print(f"Fetching private user resumes from: {url}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            
            # 使用现有逻辑解析拉取下来的私有专属 PDF/ZIP
            return await process_resume_content(resp.content, filename, user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pull private resume: {e}")

class WorkspaceSnapshotRequest(BaseModel):
    jd_data: dict
    candidates: list
    interview_cache: dict
    processed_count: int = 0

@app.post("/api/save_workspace")
async def save_workspace(req: WorkspaceSnapshotRequest, bg_tasks: BackgroundTasks, user: UserState = Depends(get_current_user)):
    if getattr(user, "account_name", "") == "guest":
        return {"status": "ignored"}
    
    content = {
        "jd_data": req.jd_data,
        "candidates": req.candidates,
        "interview_cache": req.interview_cache,
        "processed_count": req.processed_count
    }
    bg_tasks.add_task(save_dict_to_cloud_bg, user.account_name, user.session_id, "workspace", content)
    return {"status": "success"}

# Catch-all route for SPA (React)
# Any route not matched by API or static files serves index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If it's an API call that fell through, 404
    if full_path.startswith("api/"):
        return {"error": "API route not found"}, 404
    
    if os.path.exists(FRONTEND_DIST):
        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    return {"message": "Frontend not built or not found. Run 'npm run build' and ensure 'temp_frontend/dist' exists."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
