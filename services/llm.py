from openai import OpenAI
import os
import re
from typing import List, Dict
import json
from .models import ClarificationQuestion, ClarificationResponse, JobDefinition, CandidateRank, Evidence, ActionResponse

# Configuration
API_KEY = "ms-45e447b6-6011-42e3-bc04-6de20f7fd4f1"
BASE_URL = "https://api-inference.modelscope.cn/v1"
MODEL_ID = "Qwen/Qwen3-VL-235B-A22B-Instruct"

client = OpenAI(
    base_url=BASE_URL,
    api_key=API_KEY
)

SYSTEM_PROMPT = """你是一个专业的招聘专家助手 Copilot。你的任务是帮助没有专业HR的小公司进行招聘流程。
输出必须严格遵守 JSON 格式，不要包含Markdown代码块标记（如 ```json ... ```），直接输出纯JSON字符串。
"""

def _call_llm(messages: List[Dict]) -> str:
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=MODEL_ID,
                messages=messages,
                stream=False,
                timeout=60.0
            )
            content = response.choices[0].message.content
            if content.startswith("```"):
                content = content.replace("```json", "").replace("```", "")
            return content.strip()
        except Exception as e:
            print(f"LLM Call Error (Attempt {attempt+1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                return "{}"
            import time
            time.sleep(2)
    return "{}"

def clarify_requirements(raw_req: str) -> ClarificationResponse:
    prompt = f"""
    用户想要招聘，但他给出的需求很模糊："{raw_req}"。
    请生成 5-8 个关键的澄清问题，帮助用户明确岗位职责、技能要求、薪资范围等。
    
    输出格式示例：
    {{
        "questions": [
            {{ "id": "q1", "question": "这个岗位的核心编程语言是什么？", "options": ["Python", "Java", "Go"] }},
            {{ "id": "q2", "question": "期望的工作经验年限？", "options": ["1-3年", "3-5年", "5年以上"] }}
        ]
    }}
    """
    conn = _call_llm([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ])
    try:
        idx_dict = conn.find('{')
        if idx_dict != -1:
            end_idx = conn.rfind('}')
            if end_idx != -1:
                conn = conn[idx_dict:end_idx+1]
        data = json.loads(conn)
        return ClarificationResponse(**data)
    except Exception as e:
        print(f"Clarification JSON Error: {e}")
        return ClarificationResponse(questions=[
            ClarificationQuestion(id="q_fallback", question="请描述您需要的核心技能？", options=["Java", "Python", "C++", "其他"])
        ])

def generate_jd(answers: Dict[str, str], raw_req: str = "") -> JobDefinition:
    prompt = f"""
    根据用户的回答和初始需求，生成一个结构化的职位描述（JD）。
    初始需求："{raw_req}"
    用户的回答：{json.dumps(answers, ensure_ascii=False)}

    特别重要：
    1. 提取"薪资"信息到 `salary` 对象。
    2. 提取"工作地点"到 `work_location`。
    
    输出格式示例：
    {{
        "title": "高级 Python 工程师",
        "key_responsibilities": ["负责后端API开发", "优化数据库性能"],
        "required_skills": ["Python", "FastAPI", "MySQL"],
        "experience_level": "3-5年",
        "salary": {{
            "range": "25k-35k",
            "tax_type": "税前",
            "has_bonus": true,
            "description": "14薪"
        }},
        "work_location": "远程办公",
        "bonus_skills": ["Docker", "K8s"]
    }}
    """
    conn = _call_llm([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ])
    try:
        data = json.loads(conn)
        return JobDefinition(**data)
    except:
        return JobDefinition(title="生成失败", key_responsibilities=[], required_skills=[], experience_level="", bonus_skills=[])


def _parse_resume_fields(content: str) -> Dict:
    """Extract structured fields from resume content"""
    fields = {"exp_years": 0, "education": "", "hard_skills": []}
    for line in content.split('\n'):
        line_stripped = line.strip()
        if line_stripped.startswith("Exp_Years:") or line_stripped.startswith("工作年限:"):
            try:
                fields["exp_years"] = int(''.join(filter(str.isdigit, line.split(':')[1][:5])))
            except: pass
        elif line_stripped.startswith("Education:") or line_stripped.startswith("学历:"):
            fields["education"] = line.split(':')[1].strip() if ':' in line else ""
        elif line_stripped.startswith("Hard_Skills:") or line_stripped.startswith("技能:"):
            skills_str = line.split(':')[1] if ':' in line else ""
            fields["hard_skills"] = [s.strip() for s in skills_str.split(',')]
    return fields


def rank_candidates(jd: JobDefinition, resumes: List[Dict]) -> List[CandidateRank]:
    """Ranking with hard filter + semantic match + evidence quotes"""
    print(f"DEBUG: Starting ranking for {len(resumes)} candidates")
    
    # Parse min experience from JD
    min_exp = 0
    exp_level = jd.experience_level.lower()
    for c in ['1','2','3','5']:
        if c in exp_level:
            min_exp = int(c)
            break
    
    # Hard filter
    filtered = []
    for r in resumes:
        fields = _parse_resume_fields(r['content'])
        if fields["exp_years"] > 0 and fields["exp_years"] < min_exp - 1:
            print(f"  FILTERED: {r['name']} (Exp {fields['exp_years']} < {min_exp})")
            continue
        r['parsed'] = fields
        filtered.append(r)
    
    print(f"DEBUG: {len(filtered)} passed hard filter")
    if not filtered:
        return []
    
    # Prepare for LLM (limit to 20 for context)
    resumes_text = "\n\n---\n".join([f"【ID: {r['id']}】\n{r['content'][:800]}" for r in filtered[:20]])
    
    prompt = f"""
你是招聘匹配专家。评估候选人与职位的匹配度。

【职位】{jd.title}
【技能要求】{', '.join(jd.required_skills)}
【经验要求】{jd.experience_level}

【候选人列表】
{resumes_text}

【你的任务】
1. 从上述候选人中选出匹配度最高的5人
2. 对每人评分(0-100)，给出理由和简历原文引用

【输出要求 - 非常重要！】
- 必须输出一个JSON数组，以 [ 开头，以 ] 结尾
- 数组中必须包含恰好5个对象
- 每个对象格式如下：

[
  {{"resume_id": "xxx.txt", "name": "姓名", "score": 90, "summary": "理由", "evidence_quotes": ["引用1"], "top_evidence": [{{"criteria": "技能", "quote": "原文", "reasoning": "理由"}}]}},
  {{"resume_id": "xxx.txt", "name": "姓名", "score": 85, "summary": "理由", "evidence_quotes": ["引用1"], "top_evidence": [{{"criteria": "技能", "quote": "原文", "reasoning": "理由"}}]}},
  {{"resume_id": "xxx.txt", "name": "姓名", "score": 80, "summary": "理由", "evidence_quotes": ["引用1"], "top_evidence": [{{"criteria": "技能", "quote": "原文", "reasoning": "理由"}}]}},
  {{"resume_id": "xxx.txt", "name": "姓名", "score": 75, "summary": "理由", "evidence_quotes": ["引用1"], "top_evidence": [{{"criteria": "技能", "quote": "原文", "reasoning": "理由"}}]}},
  {{"resume_id": "xxx.txt", "name": "姓名", "score": 70, "summary": "理由", "evidence_quotes": ["引用1"], "top_evidence": [{{"criteria": "技能", "quote": "原文", "reasoning": "理由"}}]}}
]

严禁只返回1个对象！必须返回5个！以 [ 开头！
"""
    
    print("DEBUG: Sending to LLM for ranking...")
    conn = _call_llm([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ])
    print("DEBUG: LLM Response (first 1000 chars):\n", conn[:1000])
    
    try:
        # Extract JSON
        idx_list = conn.find('[')
        idx_dict = conn.find('{')
        
        if idx_list != -1 and (idx_dict == -1 or idx_list < idx_dict):
            start_idx = idx_list
            end_idx = conn.rfind(']')
        elif idx_dict != -1:
            start_idx = idx_dict
            end_idx = conn.rfind('}')
        else:
            start_idx, end_idx = 0, len(conn)
            
        json_str = conn[start_idx:end_idx+1] if start_idx != -1 and end_idx != -1 else conn
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}. Attempting repair...")
            fixed_str = re.sub(r'}\s*{', '}, {', json_str)
            if not fixed_str.strip().startswith('['):
                fixed_str = f"[{fixed_str}]"
            data = json.loads(fixed_str)
        
        if isinstance(data, dict):
            if "error" in data:
                print(f"LLM Refused: {data['error']}")
                return []
            data = [data]
        
        print(f"DEBUG: Parsed data type={type(data)}, length={len(data) if isinstance(data, list) else 'N/A'}")
        if isinstance(data, list) and len(data) > 0:
            print(f"DEBUG: First item keys: {data[0].keys() if isinstance(data[0], dict) else 'not a dict'}")
        
        # Clean and normalize
        cleaned = []
        for item in data:
            if isinstance(item, str):
                try: item = json.loads(item)
                except: continue
            if not isinstance(item, dict):
                continue
                
            # Auto-fill missing fields
            if "rank" not in item: item["rank"] = 0
            if "name" not in item:
                item["name"] = item.get("resume_id", "Unknown").replace(".txt", "").split("_")[0]
            if "summary" not in item:
                item["summary"] = "AI匹配评分"
            if "evidence_quotes" not in item:
                item["evidence_quotes"] = []
            if "top_evidence" not in item:
                item["top_evidence"] = []
            elif isinstance(item["top_evidence"], list) and item["top_evidence"]:
                if isinstance(item["top_evidence"][0], str):
                    item["top_evidence"] = [{"criteria": t, "quote": "", "reasoning": ""} for t in item["top_evidence"]]
            
            cleaned.append(item)
        
        # Sort and rank
        cleaned.sort(key=lambda x: x.get("score", 0), reverse=True)
        for i, item in enumerate(cleaned):
            item["rank"] = i + 1
        
        print(f"DEBUG: Parsed {len(cleaned)} candidates from LLM response")
        return [CandidateRank(**item) for item in cleaned[:5]]
    
    except Exception as e:
        print(f"Ranking Error: {e}")
        print(f"Full content: {conn[:500]}")
        return []


def generate_action(candidate_name: str, action_type: str, job_title: str) -> ActionResponse:
    action_desc = {
        "offer": "录用通知书 (Offer Letter)，表达公司对候选人的强烈兴趣，提及职位、薪资期望等",
        "interview": "面试邀请邮件，包含面试时间安排建议和2个针对性的面试问题",
        "reject": "婉拒邮件，委婉且专业地表达不予录用"
    }
    
    prompt = f"""
请为候选人 "{candidate_name}" 生成一份【{action_desc.get(action_type, action_type)}】。
职位：{job_title}

【重要】你要生成的是：{action_type.upper()} 类型邮件
- 如果是 offer：要表达录用意向，欢迎加入
- 如果是 interview：要邀请面试，附带问题
- 如果是 reject：要委婉拒绝

输出格式：
{{
    "content": "邮件正文..."
}}
"""
    conn = _call_llm([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ])
    try:
        data = json.loads(conn)
        return ActionResponse(**data)
    except:
        return ActionResponse(content="生成失败")
