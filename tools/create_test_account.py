import httpx
import asyncio
import json
import time

CLOUD_SERVER_URL = "http://163.7.10.125:80"

async def seed_test_account():
    print("Seeding test account data...")
    session_id = "test_admin"
    
    # 模拟 JD 数据
    sample_jd = {
        "title": "高级端智能异构计算研发工程师",
        "key_responsibilities": [
            "负责大模型在端侧部署与推理加速",
            "设计多模态信息融合与处理管线"
        ],
        "required_skills": ["C++", "CUDA", "PyTorch", "ONNXRuntime"],
        "experience_level": "3-5年",
        "salary": {
            "range": "30k-50k",
            "tax_type": "税前",
            "has_bonus": True,
            "description": "16薪"
        },
        "work_location": "杭州",
        "bonus_skills": ["Rust", "TVM", "MLIR"]
    }

    # 要发往云端的数据包
    payload = {
        "account_name": session_id,
        "record_type": "jd",
        "content": sample_jd
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{CLOUD_SERVER_URL}/api/cloud/save_record",
                json=payload
            )
            print(f"Server response for seeding: {resp.status_code}")
            if resp.status_code == 200:
                print("Test account 'test_admin' seeded successfully!")
                print("=========================================")
                print("您现在可以到前端页面输入 'test_admin' 登录，")
                print("并点击【历史记录】-> 选择最新的JD -> 再点击 [确认并继续]")
                print("此时您就可以跨过配置步骤，直接对这个JD进行候选人匹配了！")
            else:
                print(f"Failed to seed: {resp.text}")
    except Exception as e:
        print(f"Error connecting to cloud server: {e}")

if __name__ == "__main__":
    asyncio.run(seed_test_account())
