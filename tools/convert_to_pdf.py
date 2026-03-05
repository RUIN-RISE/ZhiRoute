"""
Convert TXT resumes to PDF format
Uses fpdf2 which supports Unicode/Chinese
"""
import os
from fpdf import FPDF

# Get script's directory and calculate paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# output_resumes is in ZJU folder (parent of Hackathon, which is parent of tools)
ZJU_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
INPUT_DIR = os.path.join(ZJU_DIR, "output_resumes")
OUTPUT_DIR = os.path.join(ZJU_DIR, "output_resumes_pdf")


class PDF(FPDF):
    def __init__(self):
        super().__init__()
        # Use built-in font that supports Chinese
        self.add_font('NotoSansSC', '', 'C:/Windows/Fonts/msyh.ttc', uni=True)
        self.set_font('NotoSansSC', '', 10)
    
    def header(self):
        pass
    
    def footer(self):
        self.set_y(-15)
        self.set_font('NotoSansSC', '', 8)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')


def convert_txt_to_pdf(txt_path: str, pdf_path: str):
    """Convert a single TXT file to PDF"""
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        pdf = PDF()
        pdf.add_page()
        # Use A4 page with wide margins
        pdf.set_left_margin(20)
        pdf.set_right_margin(20)
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Calculate effective width
        effective_width = pdf.w - pdf.l_margin - pdf.r_margin
        
        def safe_write_line(text, is_header=False):
            """Write a line safely, splitting if needed"""
            if not text.strip():
                pdf.ln(4)
                return
            
            font_size = 14 if is_header else 10
            pdf.set_font('NotoSansSC', '', font_size)
            
            # Split text into smaller chunks (30 chars max for safety)
            chunk_size = 30
            pos = 0
            while pos < len(text):
                chunk = text[pos:pos + chunk_size]
                try:
                    # Use write instead of multi_cell for better control
                    pdf.write(6, chunk)
                except Exception:
                    # If still fails, skip problematic characters
                    safe_chunk = ''.join(c if ord(c) < 65535 else '?' for c in chunk)
                    try:
                        pdf.write(6, safe_chunk)
                    except Exception:
                        pass  # Skip entirely if still fails
                pos += chunk_size
            pdf.ln(6 if is_header else 5)
        
        # Process content line by line
        for line in content.split('\n'):
            is_header = line.startswith('Role:') or line.startswith('姓名:') or \
                       line.startswith('工作经历') or line.startswith('教育背景') or \
                       line.startswith('---')
            safe_write_line(line, is_header)
        
        pdf.output(pdf_path)
        return True
    except Exception as e:
        print(f"Error converting {txt_path}: {e}")
        return False


def batch_convert():
    """Convert all TXT files in INPUT_DIR to PDF"""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    txt_files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.txt')]
    print(f"Found {len(txt_files)} TXT files to convert...")
    
    success = 0
    for i, filename in enumerate(txt_files):
        txt_path = os.path.join(INPUT_DIR, filename)
        pdf_filename = filename.replace('.txt', '.pdf')
        pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
        
        print(f"[{i+1}/{len(txt_files)}] Converting {filename}...")
        
        if convert_txt_to_pdf(txt_path, pdf_path):
            success += 1
        
    print(f"\n✅ Converted {success}/{len(txt_files)} files")
    print(f"PDFs saved to: {os.path.abspath(OUTPUT_DIR)}")


if __name__ == "__main__":
    batch_convert()
