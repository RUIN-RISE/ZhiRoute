import sys

try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        print("MISSING_LIB: Please install pypdf or PyPDF2")
        sys.exit(1)

try:
    reader = PdfReader("AI 招聘 Copilot PRD.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)
except Exception as e:
    print(f"ERROR: {e}")
