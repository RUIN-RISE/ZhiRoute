import os
import subprocess
import sys
import threading
import time
from pathlib import Path

import requests
import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app


OUTPUT_DIR = Path("output/playwright")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def run_cli(*args: str) -> str:
    env = os.environ.copy()
    env["PLAYWRIGHT_CLI_SESSION"] = "jobos-audit"
    command = [
        "cmd.exe",
        "/c",
        "npx",
        "--yes",
        "--package",
        "@playwright/cli",
        "playwright-cli",
        *args,
    ]
    completed = subprocess.run(command, env=env, capture_output=True)
    stdout = completed.stdout.decode("utf-8", errors="ignore").strip()
    stderr = completed.stderr.decode("utf-8", errors="ignore").strip()
    output = "\n".join(part for part in [stdout, stderr] if part)
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(command)}\n{output}")
    return output


def wait_for_server(url: str, timeout_seconds: float = 20.0) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            response = requests.get(url, timeout=1.0)
            if response.ok:
                return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"Server did not start in time: {url}")


def main() -> None:
    config = uvicorn.Config(app, host="127.0.0.1", port=7860, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    try:
        wait_for_server("http://127.0.0.1:7860/api/health")

        print(">>> open")
        print(run_cli("open", "http://127.0.0.1:7860"))
        print(">>> snapshot")
        print(run_cli("snapshot"))
        print(">>> screenshot")
        print(run_cli("screenshot", "--filename", str(OUTPUT_DIR / "homepage.png"), "--full-page"))
        print(">>> open import modal")
        print(run_cli("click", "e48"))
        print(">>> snapshot modal")
        print(run_cli("snapshot"))
        print(">>> screenshot modal")
        print(run_cli("screenshot", "--filename", str(OUTPUT_DIR / "import-modal.png"), "--full-page"))
        print(">>> close")
        print(run_cli("close"))
    finally:
        server.should_exit = True
        thread.join(timeout=5)


if __name__ == "__main__":
    main()
