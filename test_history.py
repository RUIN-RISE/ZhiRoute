import httpx
import asyncio

async def test_history_proxy():
    print("Testing History Proxy...")
    url = "http://127.0.0.1:7860/api/account_history"
    headers = {"x-session-id": "test_account"}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            print(f"History Fetch Check: {resp.status_code}")
            if resp.status_code == 200:
                print("Data:", resp.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_history_proxy())
