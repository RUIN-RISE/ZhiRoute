import os
import sqlite3
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime

# 基础目录与数据库路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# 存放私有简历的地方，按用户区分
UPLOAD_DIR = os.path.join(BASE_DIR, "private_resumes")
os.makedirs(UPLOAD_DIR, exist_ok=True)
DB_PATH = os.path.join(BASE_DIR, "cloud_storage.db")

app = FastAPI(title="JobOS Cloud Storage Node")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ACTIVE_SESSIONS = {} # { account_name: { "session_id": str, "last_active": timestamp } }

# 初始化 SQLite 数据库
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # 历史记录表：存储每个账户最近生成的 JD 和相关信息
    # type: "jd", "email", etc.
    c.execute('''
        CREATE TABLE IF NOT EXISTS history_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,
            record_type TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- 接口模型 ---
class LoginRequest(BaseModel):
    invite_code: str
    session_id: str

class HeartbeatRequest(BaseModel):
    account_name: str
    session_id: str

class SaveRecordRequest(BaseModel):
    account_name: str
    record_type: str
    content: dict

class HistoryRecord(BaseModel):
    id: int
    account_name: str
    record_type: str
    content: dict
    created_at: str

# --- 路由 ---

@app.post("/api/cloud/auth/login")
async def cloud_login(req: LoginRequest):
    import time
    import json
    
    # 尝试读取真实的内测邀请名单
    invites_path = os.path.join(os.path.dirname(BASE_DIR), "invites.json")
    if not os.path.exists(invites_path):
        invites_path = os.path.join(BASE_DIR, "invites.json")
        
    try:
        with open(invites_path, "r", encoding="utf-8") as f:
            invites_map = json.load(f)
    except Exception as e:
        print(f"Failed to load invites on cloud: {e}")
        invites_map = {"ADMIN-TEST-CODE": "test_admin"}
        
    code = req.invite_code.strip()
    if code not in invites_map:
        raise HTTPException(status_code=401, detail="无效的内测邀请码。")
        
    account_name = invites_map[code]
    current_time = time.time()
    
    if account_name in ACTIVE_SESSIONS:
        last_active = ACTIVE_SESSIONS[account_name]["last_active"]
        # Timeout is 120 seconds
        if (current_time - last_active) < 120:
            if ACTIVE_SESSIONS[account_name]["session_id"] != req.session_id:
                raise HTTPException(status_code=403, detail=f"账号 '{account_name}' 正在别处使用中，请稍后再试或换个内测码！")
                
    ACTIVE_SESSIONS[account_name] = {"session_id": req.session_id, "last_active": current_time}
    return {"status": "success", "account_name": account_name}

@app.post("/api/cloud/auth/heartbeat")
async def cloud_heartbeat(req: HeartbeatRequest):
    import time
    if req.account_name in ACTIVE_SESSIONS:
        if ACTIVE_SESSIONS[req.account_name]["session_id"] == req.session_id:
            ACTIVE_SESSIONS[req.account_name]["last_active"] = time.time()
            return {"status": "ok"}
        else:
            raise HTTPException(status_code=403, detail="账号已被其他终端挤占")
            
    # Session expired but beating
    ACTIVE_SESSIONS[req.account_name] = {"session_id": req.session_id, "last_active": time.time()}
    return {"status": "ok"}

@app.post("/api/cloud/auth/logout")
async def cloud_logout(req: HeartbeatRequest):
    if req.account_name in ACTIVE_SESSIONS:
        if ACTIVE_SESSIONS[req.account_name]["session_id"] == req.session_id:
            del ACTIVE_SESSIONS[req.account_name]
    return {"status": "success"}

@app.post("/api/cloud/save_record")
async def save_record(req: SaveRecordRequest):
    """保存生成的 JD 或信件到云端 (保留最近10条)"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 存入新记录
    json_content = json.dumps(req.content, ensure_ascii=False)
    c.execute(
        "INSERT INTO history_records (account_name, record_type, content) VALUES (?, ?, ?)",
        (req.account_name, req.record_type, json_content)
    )
    
    # 清理多余记录，只保留该账号该类型的最近 10 条
    c.execute('''
        DELETE FROM history_records 
        WHERE id NOT IN (
            SELECT id FROM history_records 
            WHERE account_name = ? AND record_type = ? 
            ORDER BY created_at DESC LIMIT 10
        ) AND account_name = ? AND record_type = ?
    ''', (req.account_name, req.record_type, req.account_name, req.record_type))
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Record saved globally."}

@app.get("/api/cloud/get_records/{account_name}", response_model=List[HistoryRecord])
async def get_records(account_name: str, record_type: Optional[str] = None):
    """获取某个账号的历史记录"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    if record_type:
        c.execute("SELECT id, account_name, record_type, content, created_at FROM history_records WHERE account_name = ? AND record_type = ? ORDER BY created_at DESC", (account_name, record_type))
    else:
        c.execute("SELECT id, account_name, record_type, content, created_at FROM history_records WHERE account_name = ? ORDER BY created_at DESC", (account_name,))
        
    rows = c.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        results.append(HistoryRecord(
            id=row[0],
            account_name=row[1],
            record_type=row[2],
            content=json.loads(row[3]),
            created_at=row[4]
        ))
    return results

@app.get("/api/cloud/download_public_resume")
async def download_public_resume():
    """供拉取公有简历池使用"""
    from fastapi.responses import FileResponse
    # 尝试多种可能的路径寻找 output_resume.zip
    file_paths = [
        os.path.join(BASE_DIR, "output_resume.zip"),
        os.path.join(os.path.dirname(BASE_DIR), "output_resume.zip"),
        "/root/JOBOS/output_resume.zip",
        "/root/output_resume.zip"
    ]
    for p in file_paths:
        if os.path.exists(p):
            return FileResponse(p)
            
    raise HTTPException(404, "Public resume (output_resume.zip) not found on the cloud server.")

@app.post("/api/cloud/upload_private_resume")
async def upload_private_resume(account_name: str = Form(...), file: UploadFile = File(...)):
    """上传私有简历压缩包或PDF到对应的账号隔离目录下"""
    if not file.filename.endswith(('.zip', '.pdf')):
        raise HTTPException(400, "Only .zip or .pdf allowed for private resumes.")
        
    account_dir = os.path.join(UPLOAD_DIR, account_name)
    os.makedirs(account_dir, exist_ok=True)
    
    # 覆盖式保存，如果传新的 output_resume.zip 就覆盖旧的
    safe_filename = file.filename.replace("..", "")
    file_path = os.path.join(account_dir, safe_filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    return {"status": "success", "path": f"/private/{account_name}/{safe_filename}"}

@app.get("/api/cloud/download_private_resume/{account_name}/{filename}")
async def download_private_resume(account_name: str, filename: str):
    """供 Windows/Docker 端拉取某账号的私有简历池"""
    from fastapi.responses import FileResponse
    safe_filename = filename.replace("..", "")
    file_path = os.path.join(UPLOAD_DIR, account_name, safe_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(404, "Private resume not found for this account.")
        
    return FileResponse(file_path)

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 80
    print(f"Starting JobOS Cloud Node on port {port}...")
    # 注意：在云服务器上，可能需要 sudo 才能跑 80 端口
    uvicorn.run(app, host="0.0.0.0", port=port)
