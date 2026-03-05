import pdfplumber

def convert_pdf_to_md(pdf_path, md_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            content = []
            for i, page in enumerate(pdf.pages):
                # Using 'layout=True' improves spacing for tables and columns
                text = page.extract_text(layout=True, x_tolerance=2, y_tolerance=3)
                if text:
                    content.append(text)
                
            full_text = "\n\n".join(content)
            
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(full_text)
                
            print(f"Successfully converted {pdf_path} to {md_path}")
            
    except Exception as e:
        print(f"Error converting PDF: {e}")

if __name__ == "__main__":
    convert_pdf_to_md("AI 招聘 Copilot PRD.pdf", "AI_Recruiting_Copilot_PRD.md")
