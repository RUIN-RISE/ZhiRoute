from openai import OpenAI
import os
from typing import List, Dict
import json
from .models import ClarificationQuestion, ClarificationResponse, JobDefinition, CandidateRank, Evidence, ActionResponse

# Configuration
API_KEY = "ms-45e447b6-6011-42e3-bc04-6de20f7fd4f1" # Hardcoded for hackathon speed as requested, usually env var
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
                timeout=60.0 # Increase timeout to 60s
            )
            content = response.choices[0].message.content
            # Clean up markdown code blocks if present
            if content.startswith("```"):
                content = content.replace("```json", "").replace("```", "")
            return content.strip()
        except Exception as e:
            print(f"LLM Call Error (Attempt {attempt+1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                return "{}"
            import time
            time.sleep(2) # Wait 2s before retry
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
    msg_content = conn
    try:
        # Robust JSON extraction
        idx_dict = conn.find('{')
        if idx_dict != -1:
             # Try to find the matching closing brace
             end_idx = conn.rfind('}')
             if end_idx != -1:
                 msg_content = conn[idx_dict:end_idx+1]
        
        data = json.loads(msg_content)
        return ClarificationResponse(**data)
    except Exception as e:
        print(f"Clarification JSON Error: {e}. Content: {conn[:100]}...")
        # Fallback: try repair
        try:
            import re
            fixed_str = re.sub(r'```json\s*', '', conn)
            fixed_str = re.sub(r'```', '', fixed_str)
            start = fixed_str.find('{')
            end = fixed_str.rfind('}')
            if start != -1 and end != -1:
                fixed_str = fixed_str[start:end+1]
            data = json.loads(fixed_str)
            return ClarificationResponse(**data)
        except:
            pass
            
        # Return a default question if all else fails so UI isn't empty
        return ClarificationResponse(questions=[
            ClarificationQuestion(id="q_fallback", question="请具体描述一下您希望招聘的这位候选人需要具备哪些核心技能？", options=["Java", "Python", "C++", "其他"])
        ])

def generate_jd(answers: Dict[str, str], raw_req: str = "") -> JobDefinition:
    prompt = f"""
    根据用户的回答和初始需求，生成一个结构化的职位描述（JD）。
    初始需求："{raw_req}"
    用户的回答：{json.dumps(answers, ensure_ascii=False)}

    特别重要：
    1. 提取“薪资”信息到 `salary` 对象。优先从“初始需求”或“用户回答”中提取！ 
    2. 如果用户在初始需求里写了 "20k", "15-25k" 等，必须提取！
       - `range`: 必须提取数字！如 "10k-20k", "25000". 如果用户说 "一万到两万", 转换为 "10-20k". 
       - `tax_type`: "税前" 或 "税后"
       - `has_bonus`: detect keywords like "年终奖", "绩效", "14薪".
    2. 提取“工作地点”到 `work_location`.
    
    用户的回答：{json.dumps(answers, ensure_ascii=False)}
    
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

def rank_candidates(jd: JobDefinition, resumes: List[Dict]) -> List[CandidateRank]:
    # Simplify resumes for context window
    # Limit to top 15 resumes to prevent LLM overload/refusal
    if len(resumes) > 15:
        print(f"DEBUG: Truncating {len(resumes)} resumes to 15 for LLM stability.")
        resumes = resumes[:15]
        
    resumes_text = "\n\n".join([f"ID: {r['id']}, Name: {r['name']}, Content: {r['content'][:500]}..." for r in resumes])
    
    prompt = f"""
    职位描述：
    职位：{jd.title}
    职责：{', '.join(jd.key_responsibilities)}
    技能：{', '.join(jd.required_skills)}
    
    候选人列表：
    {resumes_text}
    
    请根据以下【硬性规则】计算每位候选人的匹配分（Score），并按分数从高到低排序。
    
    【评分规则】：
    1. 技能匹配（60分）：JD中的“必备技能”每匹配一个关键词得 10 分。
    2. 经验匹配（20分）：工作年限符合得 20 分，否则 0 分。
    3. 职责匹配（20分）：候选人经历中包含JD职责关键词得 20 分。
    
    【岗位关键信息 (再次确认)】：
    - 职位：{jd.title}
    - 必需技能：{', '.join(jd.required_skills)}
    - 职责关键词：{', '.join(jd.key_responsibilities)}

    【重要指令】：
    1. 你是一个【无情的计算器】，不是HR。只根据上述规则加分。
    2. 【严禁】检查候选人是否合格！即使0分也要返回！
    3. 【严禁】返回错误信息或 "error" 对象！
    4. 【必须】返回得分最高的 前10名 候选人！必须是 JSON 列表！
    5. ID 使用文件名。
    
    输出格式示例：
    [
        {{
            "resume_id": "张三_0.txt",
            ...
        }}
    ]
    """
    print("DEBUG: Sending to LLM for ranking...", len(resumes_text))
    conn = _call_llm([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ])
    print("DEBUG: LLM Response:", conn[:200] + "...") # Print first 200 chars
    try:
        # Robust JSON extraction - Respect order of [ vs {
        idx_list = conn.find('[')
        idx_dict = conn.find('{')
        
        start_idx = -1
        is_dict = False
        
        # Determine which comes first
        if idx_list != -1 and idx_dict != -1:
            if idx_list < idx_dict:
                start_idx = idx_list
                end_idx = conn.rfind(']')
                is_dict = False
            else:
                start_idx = idx_dict
                end_idx = conn.rfind('}')
                is_dict = True
        elif idx_list != -1:
            start_idx = idx_list
            end_idx = conn.rfind(']')
            is_dict = False
        elif idx_dict != -1:
            start_idx = idx_dict
            end_idx = conn.rfind('}')
            is_dict = True
            
        if start_idx != -1 and end_idx != -1:
            json_str = conn[start_idx:end_idx+1]
        else:
            json_str = conn
            
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            # Handle "Extra data": concatenated JSON objects like {...}\n{...}
            import re
            print(f"JSON Decode Error: {e}. Attempting to repair concatenated objects...")
            # Replace "} {" or "}\n{" with "}, {"
            fixed_str = re.sub(r'}\s*{', '}, {', json_str)
            # Wrap in list if not already
            if not fixed_str.strip().startswith('['):
                fixed_str = f"[{fixed_str}]"
            try:
                data = json.loads(fixed_str)
            except:
                 # Fallback: try to split by newline and parse each line
                 items = []
                 for line in json_str.splitlines():
                     try:
                         if line.strip(): items.append(json.loads(line))
                     except: pass
                 if items: data = items
                 else: raise e

        # Handle case where LLM returns a single object instead of a list
        if isinstance(data, dict):
            if "error" in data:
                print(f"LLM Refused to Rank: {data['error']}")
                return []
            data = [data]
        
        # Normalize data (Auto-repair LLM shortcuts)
        cleaned_data = []
        for item in data:
            # Safety check: item must be a dict
            if isinstance(item, str):
                try:
                    # formatting error where LLM returns ["{...}", "{...}"]
                    item = json.loads(item)
                except:
                    print(f"Skipping invalid item string: {item[:50]}...")
                    continue
            
            if not isinstance(item, dict):
                print(f"Skipping non-dict item: {type(item)}")
                continue

            # Fix top_evidence if it's a list of strings
            if "top_evidence" in item and isinstance(item["top_evidence"], list):
                if item["top_evidence"] and isinstance(item["top_evidence"][0], str):
                    # Convert ["Vue", "JS"] -> [{"criteria": "Vue", ...}, ...]
                    item["top_evidence"] = [
                        {"criteria": text, "quote": "技能/经验匹配", "reasoning": "根据简历内容匹配"} 
                        for text in item["top_evidence"]
                    ]
            # Auto-fill missing fields if LLM acted as a "Calculator" and only returned scores
            if "rank" not in item:
                item["rank"] = 0 # Will sort later
            if "name" not in item:
                 # Fallback: derive name from resume_id (e.g. "Name_123.txt" -> "Name")
                 if "resume_id" in item:
                     item["name"] = item["resume_id"].replace(".txt", "").split("_")[0]
                 else:
                     item["name"] = "Unknown Candidate"
            if "summary" not in item:
                item["summary"] = "AI根据硬性规则计算得分，无详细总结。"
            if "top_evidence" not in item:
                item["top_evidence"] = [{"criteria": "规则计算", "quote": "自动评分", "reasoning": "基于关键词和年限的硬性规则匹配"}]
                
            cleaned_data.append(item)
            
        # Re-sort and re-rank
        cleaned_data.sort(key=lambda x: x.get("score", 0), reverse=True)
        for i, item in enumerate(cleaned_data):
            item["rank"] = i + 1
            
        ranks = [CandidateRank(**item) for item in cleaned_data]
        return ranks
    except Exception as e:
        print(f"Ranking Error: {e}")
        # Fallback dump for debugging
        print(f"Full content was: {conn}")
        return []

def generate_action(candidate_name: str, action_type: str, job_title: str) -> ActionResponse:
    prompt = f"""
    请为候选人 "{candidate_name}" 生成一份 "{action_type}" (offer, reject, interview)。
    职位是：{job_title}。
    
    如果是面试邀请，可以附带2个针对性的面试题。
    如果是拒信，要委婉且专业。
    
    输出格式：
    {{
        "content": "邮件内容..."
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
