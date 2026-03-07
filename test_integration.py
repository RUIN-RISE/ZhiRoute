import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def get_valid_invite_code():
    try:
        with open("invites.json", "r", encoding="utf-8") as f:
            invites = json.load(f)
            if invites:
                return list(invites.keys())[0]
    except:
        pass
    return None

def main():
    invite_code = get_valid_invite_code()
    if not invite_code:
        print("No valid invite code found.")
        return

    print("Using Invite Code:", invite_code)
    
    session_id = "test-session-uuid-12345"
    headers = {
        "X-Session-ID": session_id
    }
    
    # 1. Login
    res = client.post("/api/login", json={"invite_code": invite_code}, headers=headers)
    print("Login:", res.status_code, res.text)
    if res.status_code != 200:
        return
        
    data = res.json()
    account_name = data["account_name"]
    
    headers["X-Account-Name"] = account_name
    
    # 2. Simulate Upload/Generate Fake Resumes
    res = client.get("/api/generate_fake_resumes", headers=headers)
    print("Generate Fake:", res.status_code, res.text[:200])
    
    # 3. Set JD
    jd_payload = {
        "title": "Python Developer",
        "key_responsibilities": ["Write code"],
        "required_skills": ["Python", "FastAPI"],
        "experience_level": "3-5 years",
        "education": "Bachelor",
        "salary": {"range": "10k-20k", "tax_type": "Pre-tax", "has_bonus": False, "description": ""},
        "work_location": "Remote",
        "bonus_skills": ["Docker"],
        "culture_fit": ["Team player"]
    }
    res = client.post("/api/set_current_jd", json=jd_payload, headers=headers)
    print("Set JD:", res.status_code, res.text)
    
    # 4. Save Workspace (History restoration target)
    workspace_payload = {
        "jd_data": jd_payload,
        "candidates": [],
        "interview_cache": {}
    }
    res = client.post("/api/save_workspace", json=workspace_payload, headers=headers)
    print("Save Workspace:", res.status_code, res.text)

    # 5. Get History
    res = client.get("/api/account_history", headers=headers)
    print("Get History:", res.status_code, str(res.text)[:100])

    # 6. Logout
    res = client.post("/api/logout", headers=headers)
    print("Logout:", res.status_code, res.text)

if __name__ == "__main__":
    main()
