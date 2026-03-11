from pathlib import Path
import re
import subprocess
import sys


PATTERNS = {
    "openai_like": re.compile(r"sk-[A-Za-z0-9]{20,}"),
    "aws_access_key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "google_api_key": re.compile(r"AIza[0-9A-Za-z\-_]{20,}"),
    "github_pat": re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    "slack_token": re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
    "inline_api_key": re.compile(r"api[_-]?key\s*[:=]\s*['\"][^'\"]+['\"]", re.IGNORECASE),
    "inline_token": re.compile(r"token\s*[:=]\s*['\"][^'\"]+['\"]", re.IGNORECASE),
}

IGNORE_PARTS = {
    ".git",
    "node_modules",
    ".playwright-cli",
    "output",
    "__pycache__",
    ".venv",
    "venv",
}


def should_skip(path: Path) -> bool:
    return any(part in IGNORE_PARTS for part in path.parts)


def git_candidate_files() -> list[Path]:
    names = set()
    for command in (["git", "ls-files"], ["git", "diff", "--cached", "--name-only"]):
        try:
            output = subprocess.check_output(command, text=True, encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for line in output.splitlines():
            if line.strip():
                names.add(line.strip())
    return [Path(name) for name in sorted(names)]


def main() -> int:
    matches: list[tuple[str, str]] = []
    for path in git_candidate_files():
        if not path.is_file() or should_skip(path):
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for name, pattern in PATTERNS.items():
            if pattern.search(text):
                matches.append((path.as_posix(), name))
                break

    if matches:
        print("Potential secrets detected:")
        for file_path, pattern_name in matches:
            print(f"- {file_path} ({pattern_name})")
        return 1

    print("No obvious secrets found in repo files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
