import asyncio
import sys
import os
import uuid

# Add project root to path
sys.path.append(os.getcwd())

from services.radar_service import analyze_ai_talent, generate_ai_interview_questions
from services.radar_db import init_db

async def test_radar_sla():
    print("Testing Radar SLA and Partial Results...")
    # Use a random resume_id to bypass cache reliably
    resume_id = f"test_resume_{uuid.uuid4().hex[:8]}"
    # Note: This depends on network connectivity to real APIs
    result = await analyze_ai_talent(resume_id, github_username="torvalds", hf_username="osanseviero")
    
    print(f"Total Score: {result.get('total_score')}")
    print(f"Dimensions: {result.get('dimensions')}")
    print(f"Errors: {result.get('errors')}")
    print(f"Degraded: {result.get('degraded')}")
    
    if result.get('degraded'):
        print("PASS: System correctly identified degradation.")
    else:
        print("INFO: System returned full results (no timeout/error).")

async def test_async_questions():
    print("\nTesting Async Question Generation...")
    radar_data = {
        "evidence": [
            {"dimension": "github_commits", "original_text": "Has 50 public repos.", "source_link": "https://github.com/test", "analysis": "Experienced dev."}
        ]
    }
    questions = await generate_ai_interview_questions("test_resume", radar_data)
    print(f"Generated Questions: {questions}")
    if len(questions) > 0:
        print("PASS: Questions generated successfully (Async).")
    else:
        print("FAIL: No questions generated.")

def test_db_migration():
    print("\nTesting DB Migration...")
    try:
        init_db()
        print("PASS: DB initialized/migrated successfully.")
    except Exception as e:
        print(f"FAIL: DB migration error: {e}")

async def main():
    test_db_migration()
    await test_radar_sla()
    await test_async_questions()

if __name__ == "__main__":
    asyncio.run(main())
