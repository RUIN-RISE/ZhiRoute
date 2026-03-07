import sqlite3
import json
import os

db_path = os.path.join('tools', 'cloud_storage.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id, content FROM history_records WHERE record_type='jd' ORDER BY id DESC")
for row in c.fetchall():
    try:
        content = json.loads(row[1])
        print(f"ID: {row[0]}")
        print(json.dumps(content, indent=2, ensure_ascii=False))
        print("-" * 50)
    except:
        pass
