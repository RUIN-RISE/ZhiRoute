"""
AI-Powered Resume Generator
Generates realistic resumes using LLM with structured schema
"""
import os
import sys
import json
import random
from faker import Faker

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.llm import _call_llm

fake = Faker('zh_CN')
OUTPUT_DIR = "../output_resumes"

# Skill pools for variety
TECH_STACKS = {
    "backend": ["Python", "Java", "Go", "Node.js", "FastAPI", "Spring Boot", "Django", "Flask"],
    "frontend": ["Vue", "React", "TypeScript", "JavaScript", "CSS", "HTML5", "Webpack", "Vite"],
    "database": ["MySQL", "PostgreSQL", "Redis", "MongoDB", "Elasticsearch"],
    "devops": ["Docker", "K8s", "Jenkins", "Git", "Linux", "AWS", "Nginx"],
    "ai_ml": ["PyTorch", "TensorFlow", "Pandas", "Numpy", "Scikit-learn", "LLM"],
}

ROLES = [
    "后端开发工程师", "前端开发工程师", "全栈工程师", 
    "数据工程师", "算法工程师", "DevOps工程师", "架构师"
]

EDUCATIONS = ["本科", "硕士", "博士", "大专"]
SOFT_SKILLS = ["团队协作", "沟通能力", "项目管理", "快速学习", "问题解决", "抗压能力", "创新思维"]


def generate_resume_via_llm(name: str, role: str, skills: list, exp_years: int, education: str, soft_skills: list) -> str:
    """Use LLM to generate detailed resume content"""
    prompt = f"""
请生成一份虚构但真实感的中文简历。基本信息如下：
- 姓名: {name}
- 目标职位: {role}
- 硬技能: {', '.join(skills)}
- 工作年限: {exp_years}年
- 学历: {education}
- 软技能: {', '.join(soft_skills)}

请按以下格式输出（纯文本，不要Markdown）：

Role: [职位]
Hard_Skills: [技能1, 技能2, ...]
Exp_Years: [N]
Education: [学历]
Soft_Skills: [软技能1, 软技能2, ...]

姓名: [姓名]
邮箱: [邮箱]
电话: [电话]
期望薪资: [N]k

工作经历:
[公司1] | [职位] | [开始年份]-[结束年份]
- [具体项目描述，使用了哪些技术，取得了什么成果]
- [另一个项目描述]

[公司2] | [职位] | [开始年份]-[结束年份]
- [项目描述]

教育背景:
[大学名称] | [专业] | [学历] | [毕业年份]

自我评价:
[2-3句话总结]
"""
    
    result = _call_llm([
        {"role": "system", "content": "你是一个帮助生成测试数据的助手。请生成真实感的中国IT从业者简历。"},
        {"role": "user", "content": prompt}
    ])
    
    return result if result and result != "{}" else None


def generate_fallback_resume(name: str, role: str, skills: list, exp_years: int, education: str, soft_skills: list) -> str:
    """Fallback template if LLM fails"""
    current_year = 2026
    start_year = current_year - exp_years
    
    return f"""Role: {role}
Hard_Skills: {', '.join(skills)}
Exp_Years: {exp_years}
Education: {education}
Soft_Skills: {', '.join(soft_skills)}

姓名: {name}
邮箱: {fake.email()}
电话: {fake.phone_number()}
期望薪资: {random.randint(15, 50)}k

工作经历:
{fake.company()} | {role} | {start_year}-至今
- 负责核心业务系统开发，使用 {skills[0]} 和 {skills[1] if len(skills) > 1 else skills[0]}
- 参与系统架构设计和代码评审
- 独立完成多个重要模块的开发和优化

教育背景:
{fake.company().replace('公司', '大学')} | 计算机科学与技术 | {education} | {start_year - 4}

自我评价:
具有{exp_years}年开发经验，熟练掌握{skills[0]}等技术，具备良好的{soft_skills[0]}能力。
"""


def generate_resumes(count=30):
    """Generate resumes using LLM with fallback"""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    print(f"Starting to generate {count} resumes...")
    
    for i in range(count):
        name = fake.name()
        role = random.choice(ROLES)
        
        # Select skills based on role
        if "后端" in role:
            primary = TECH_STACKS["backend"]
            secondary = TECH_STACKS["database"]
        elif "前端" in role:
            primary = TECH_STACKS["frontend"]
            secondary = TECH_STACKS["devops"]
        elif "算法" in role or "数据" in role:
            primary = TECH_STACKS["ai_ml"]
            secondary = TECH_STACKS["database"]
        else:
            primary = TECH_STACKS["backend"] + TECH_STACKS["frontend"]
            secondary = TECH_STACKS["devops"]
        
        skills = random.sample(primary, min(4, len(primary))) + random.sample(secondary, min(2, len(secondary)))
        exp_years = random.randint(1, 12)
        education = random.choice(EDUCATIONS)
        soft_skills = random.sample(SOFT_SKILLS, 3)
        
        print(f"[{i+1}/{count}] Generating resume for {name} ({role})...")
        
        # Try LLM first
        content = generate_resume_via_llm(name, role, skills, exp_years, education, soft_skills)
        
        # Fallback if LLM fails
        if not content:
            print(f"  -> LLM failed, using fallback template")
            content = generate_fallback_resume(name, role, skills, exp_years, education, soft_skills)
        
        # Save to file
        filename = os.path.join(OUTPUT_DIR, f"{name}_{i}.txt")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content.strip())
        
        print(f"  -> Saved: {filename}")
    
    print(f"\n✅ Generated {count} resumes in {OUTPUT_DIR}")


if __name__ == "__main__":
    generate_resumes(30)
