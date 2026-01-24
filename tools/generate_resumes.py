import os
from faker import Faker
import random

fake = Faker('zh_CN')
OUTPUT_DIR = "../output_resumes"

def generate_resumes(count=50):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    skills_pool = ['Python', 'Java', 'Go', 'React', 'Vue', 'Spring Boot', 'FastAPI', 'MySQL', 'Redis', 'Docker', 'K8s']
    
    for i in range(count):
        name = fake.name()
        filename = os.path.join(OUTPUT_DIR, f"{name}_{i}.txt")
        
        years = random.randint(1, 15)
        current_year = 2026
        start_year = current_year - years
        # Avoid future dates or unrealistically old dates for young roles
        if start_year < 1990: start_year = 1990
        
        my_skills = random.sample(skills_pool, k=random.randint(3, 8))
        
        content = f"""
姓名: {name}
工作年限: {years}年
邮箱: {fake.email()}
电话: {fake.phone_number()}
期望薪资: {random.randint(15, 50)}k

技能:
{', '.join(my_skills)}

工作经历:
{start_year}-至今: {fake.company()}
- 职位: 高级工程师
- 负责核心业务开发
- 在职期间绩效优秀

教育背景:
{fake.company()} - 计算机科学 -本科
        """
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content.strip())
            
    print(f"Generated {count} resumes in {OUTPUT_DIR}")

if __name__ == "__main__":
    generate_resumes()
