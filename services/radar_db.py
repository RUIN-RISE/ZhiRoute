import sqlite3
import os
import json
import time

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "jobos.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_radar_cache_v2 (
            cache_key TEXT PRIMARY KEY,
            total_score INTEGER,
            radar_data_json TEXT,
            evidence_json TEXT,
            errors_json TEXT,
            degraded INTEGER,
            cache_timestamp REAL
        )
    ''')
    
    # Robust migration: Check and add columns individually
    cursor.execute("PRAGMA table_info(ai_radar_cache_v2)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    if "errors_json" not in existing_columns:
        try:
            cursor.execute("ALTER TABLE ai_radar_cache_v2 ADD COLUMN errors_json TEXT")
            print("Added errors_json column.")
        except sqlite3.OperationalError as e:
            print(f"Failed to add errors_json: {e}")

    if "degraded" not in existing_columns:
        try:
            cursor.execute("ALTER TABLE ai_radar_cache_v2 ADD COLUMN degraded INTEGER DEFAULT 0")
            print("Added degraded column.")
        except sqlite3.OperationalError as e:
            print(f"Failed to add degraded: {e}")

    conn.commit()
    conn.close()
    print("Database initialized and robustly migrated.")

def get_radar_cache(cache_key: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT total_score, radar_data_json, evidence_json, cache_timestamp, errors_json, degraded FROM ai_radar_cache_v2 WHERE cache_key=?', (cache_key,))
    row = cursor.fetchone()
    conn.close()

    if row:
        if bool(row[5]):
            return None
        # Check TTL (7 days)
        if time.time() - row[3] < 7 * 24 * 3600:
            return {
                "total_score": row[0],
                "dimensions": json.loads(row[1]),
                "evidence": json.loads(row[2]),
                "errors": json.loads(row[4] or "[]"),
                "degraded": bool(row[5])
            }
    return None

def save_radar_cache(cache_key: str, total_score: int, dimensions: dict, evidence: list, errors: list, degraded: bool):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO ai_radar_cache_v2 (cache_key, total_score, radar_data_json, evidence_json, errors_json, degraded, cache_timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (cache_key, total_score, json.dumps(dimensions), json.dumps(evidence), json.dumps(errors), 1 if degraded else 0, time.time()))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
