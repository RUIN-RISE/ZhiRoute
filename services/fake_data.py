from faker import Faker
import random
from typing import List
from .models import Resume

fake = Faker('zh_CN')

SKILLS_POOL = {
    'python': ['Python', 'Django', 'FastAPI', 'Flask', 'Pandas', 'NumPy'],
    'java': ['Java', 'Spring Boot', 'MyBatis', 'JVM', 'Kafka'],
    'frontend': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'TypeScript'],
    'ops': ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Aliyun']
}

def generate_fake_resumes(count: int = 5, role_hint: str = "python") -> List[Resume]:
    resumes = []
    
    # Determine skill set based on hint
    base_skills = SKILLS_POOL.get('python') # Default
    for key, skills in SKILLS_POOL.items():
        if key in role_hint.lower():
            base_skills = skills
            break
            
    for _ in range(count):
        profile = fake.profile()
        name = profile['name']
        
        # Randomize experience
        years = random.randint(1, 10)
        
        # Pick some skills
        candidate_skills = random.sample(base_skills, k=random.randint(3, len(base_skills)))
        
        # Generate a fake resume text
        content = f"""
姓名: {name}
工作年限: {years}年
邮箱: {profile['mail']}
电话: {fake.phone_number()}

个人简介:
热爱技术，有{years}年相关开发经验。

技能:
{', '.join(candidate_skills)}

工作经历:
2020-至今: {fake.company()} - 高级开发工程师
- 负责核心系统设计与开发
- 使用 {candidate_skills[0]} 提升了系统性能 20%
- 带领团队完成项目重构

2018-2020: {fake.company()} - 初级工程师
- 参与 {candidate_skills[1] if len(candidate_skills) > 1 else '项目'} 模块开发
- 维护现有代码库

教育背景:
{fake.university_name()} - 计算机科学与技术 - 本科
        """
        
        resumes.append(Resume(
            id=fake.uuid4(),
            name=name,
            content=content.strip(),
            parsed_skills=candidate_skills,
            years_experience=years
        ))
        
    return resumes
