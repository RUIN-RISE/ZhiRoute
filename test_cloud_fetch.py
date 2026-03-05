import httpx
import asyncio

async def test_fetch():
    print("Testing cloud fetch API...")
    url = "http://127.0.0.1:7860/api/fetch_resumes_from_cloud"
    
    # Needs a session header since the API depends on it (even if it has a fallback)
    headers = {"x-session-id": "test_session_123"}
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            print(f"Success! Fetched {len(data)} resumes.")
            if data:
                print(f"First resume name: {data[0]['name']}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP Error: {e}")
        print(f"Details: {e.response.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_fetch())
