import httpx

def test_conn():
    try:
        r1 = httpx.get('http://163.7.10.125:80/api/cloud/download_public_resume', timeout=5)
        print("Port 80:", r1.status_code)
    except Exception as e:
        print("Port 80 Error:", e)
        
    try:
        r2 = httpx.get('http://163.7.10.125:8000/output_resume.zip', timeout=5)
        print("Port 8000:", r2.status_code)
    except Exception as e:
        print("Port 8000 Error:", e)

    try:
        r3 = httpx.get('http://163.7.10.125:80/api/account_history', timeout=5)
        print("Port 80 history API:", r3.status_code)
    except Exception as e:
        print("Port 80 history API:", e)

test_conn()
