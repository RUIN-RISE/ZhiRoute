import sqlite3
import json
import os

db_path = os.path.join('tools', 'cloud_storage.db')
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id, content FROM history_records WHERE record_type='jd' ORDER BY id DESC LIMIT 5")
for row in c.fetchall():
    print(f"ID: {row[0]}")
    try:
        content = json.loads(row[1])
        print(json.dumps(content, indent=2, ensure_ascii=False))
    except Exception as e:
        print(row[1])
    print("-" * 50)
