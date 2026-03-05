from openai import OpenAI
import os
import re
from typing import List, Dict
import json
from .models import ClarificationQuestion, ClarificationResponse, JobDefinition, CandidateRank, Evidence, ActionResponse, ChatMessage, ChatResponse

# Multi-model configuration with automatic fallback
# Multi-model configuration with automatic fallback
# API Key should be set in environment variables
API_KEY = os.environ.get("MS_API_KEY") 
if not API_KEY:
    print("Warning: MS_API_KEY not found in environment variables.")
    # Fallback/Placeholder if needed, or keep empty to fail fast
    # API_KEY = "ms-..." 

BASE_URL = "https://api-inference.modelscope.cn/v1"

# Available models in order of preference (GLM first)
MODEL_CONFIGS = [
    {"id": "ZhipuAI/GLM-4.7", "name": "GLM-4.7"},
    {"id": "deepseek-ai/DeepSeek-V3.2", "name": "DeepSeek-V3.2"},
    {"id": "Qwen/Qwen3-235B-A22B-Instruct-2507", "name": "Qwen3"},
]

# Track current model index (starts with first = MiniMax)
current_model_idx = 0

client = OpenAI(
    base_url=BASE_URL,
    api_key=API_KEY
)

SYSTEM_PROMPT = """你是一个专业的招聘专家助手 Copilot。你的任务是帮助没有专业HR的小公司进行招聘流程。
输出必须严格遵守 JSON 格式，不要包含Markdown代码块标记（如 ```json ... ```），直接输出纯JSON字符串。
"""

def _call_llm(messages: List[Dict], timeout: float = 60.0) -> str:
    global current_model_idx
    
    # Try each model starting from current
    for attempt in range(len(MODEL_CONFIGS)):
        model_idx = (current_model_idx + attempt) % len(MODEL_CONFIGS)
        model = MODEL_CONFIGS[model_idx]
        
        print(f"[LLM] Using {model['name']} (timeout={timeout}s)...")
        
        try:
            response = client.chat.completions.create(
                model=model["id"],
                messages=messages,
                stream=False,
                timeout=timeout
            )
            content = response.choices[0].message.content
            print(f"[LLM] {model['name']} responded: {len(content)} chars")
            
            if content.startswith("```"):
                content = content.replace("```json", "").replace("```", "")
            return content.strip()
            
        except Exception as e:
            error_msg = str(e).lower()
            print(f"[LLM] {model['name']} Error: {e}")
            
            # Check if it's a rate limit / quota error
            if "limit" in error_msg or "quota" in error_msg or "429" in error_msg:
                print(f"[LLM] {model['name']} reached limit, switching to next model...")
                current_model_idx = (model_idx + 1) % len(MODEL_CONFIGS)
                continue
            
            # For other errors, also try next model
            continue
    
    print("[LLM] All models failed!")
    return "{}"


def structure_resume(raw_text: str) -> str:
    """Use LLM to structure raw text extracted from PDF into expected format (single resume)"""
    results = batch_structure_resumes([raw_text])
    return results[0] if results else raw_text


def batch_structure_resumes(raw_texts: list) -> list:
    """
    Batch process multiple PDF texts in one LLM call.
    Uses separators to distinguish between resumes.
    Returns a list of structured resume texts.
    """
    if not raw_texts:
        return []
    
    SEPARATOR = "\n===== 简历分隔符 #{}号 =====\n"
    
    # Combine all texts with separators
    combined = ""
    for i, text in enumerate(raw_texts):
        combined += SEPARATOR.format(i + 1)
        combined += text[:1500]  # Limit each resume to 1500 chars
    
    prompt = f"""
请将以下多份从PDF中提取的简历原文分别整理成结构化格式。
每份简历用"===== 简历分隔符 #N号 ====="分隔。

【原始文本】
{combined}

【输出格式】对于每份简历，请按以下格式输出，用同样的分隔符区分：

===== 简历分隔符 #1号 =====
Role: [职位名称]
Hard_Skills: [技能1, 技能2, ...]
Exp_Years: [工作年限数字]
Education: [学历]
Soft_Skills: [软技能1, 软技能2, ...]

姓名: [姓名]
邮箱: [邮箱]
电话: [电话]

工作经历:
[公司名] | [职位] | [时间段]
- [项目/职责描述]

教育背景:
[学校] | [专业] | [学历] | [时间]

===== 简历分隔符 #2号 =====
...（下一份简历）

【注意】
1. 必须保持分隔符格式一致
2. 每份简历独立输出
3. 如果某项信息缺失，用"未注明"代替
4. 共有{len(raw_texts)}份简历需要处理
"""
    
    result = _call_llm([
        {"role": "system", "content": "你是一个简历解析助手。你需要同时处理多份简历，用分隔符区分输出。"},
        {"role": "user", "content": prompt}
    ], timeout=120.0)  # Longer timeout for batch processing
    
    # Parse the result back into individual resumes
    if not result or result == "{}":
        return raw_texts  # Return originals if failed
    
    # Split by separator pattern
    import re
    parts = re.split(r'={3,}\s*简历分隔符\s*#\d+号\s*={3,}', result)
    # Filter out empty parts
    structured = [p.strip() for p in parts if p.strip()]
    
    # Ensure we have the right number of results
    if len(structured) < len(raw_texts):
        # Pad with original texts if LLM returned fewer
        structured.extend(raw_texts[len(structured):])
    
    return structured[:len(raw_texts)]


# Chat conversation system prompt
CHAT_SYSTEM_PROMPT = """你是一个专业的招聘需求澄清助手。你的任务是通过自然的对话，帮助用户明确招聘需求。
请不要像机器人一样按固定顺序机械发问，而是像真人 HRBP 一样进行互动。

【对话目标】你需要确保(但不限于)收集以下核心信息，顺序不限，视对话情况自然引导：
- 核心职责与职位名称
- 关键技能要求 (Must-have)
- 经验与学历要求
- 薪资
- 团队文化与软技能
- **加分项 (Bonus Points / Nice-to-have)**：候选人如果具备会更好，但不是必须的技能（例如：有高并发经验、熟悉 AWS 等）。

【规则】
1. 每次尽量只问 1-2 个最关键的问题，保持对话轻量。
2. 即使信息不完整，也要在 collected_info 中尽可能提取并更新【所有】已知信息。
3. reply 字段不仅要回复用户，还要引导下一个话题。
4. 如果用户对某些要求说"不限"，请在 collected_info 中对应字段填入"不限"或合适的值。
5. 当你认为核心信息已经足够生成一份 JD 时，且用户没有新的补充，将 is_complete 设为 true，并给出一个简短的总结。
6. 【绝对禁止】在 reply 字段中使用任何 Markdown 格式（如 **粗体**、- 列表等）。必须是纯文本。
7. **必须**在 quick_replies 中提供 2-3 个合理的快捷回复候选项，帮助用户快速回答。

【输出格式】必须是严格的 JSON 格式 (不要使用 Markdown 代码块):
{
  "reply": "你的回复内容 (纯文本，禁止Markdown)",
  "is_complete": false,
  "collected_info": {
    "role": "职位名称",
    "core_skills": ["技能1", "技能2"],
    "exp_years": "3-5年",
    "education": "本科",
    "salary": "15-25k",
    "soft_skills": ["沟通能力"],
    "bonus": ["相关证书", "大厂背景"]
  },
  "quick_replies": ["3-5年经验", "应届生亦可", "需要统招本科"]
}

【重要】
- "collected_info" 必须是累积的！每次都要返回当前已知的所有信息。**不要只返回最新的一条！**
- 如果某项信息没提到，不要包含在 collected_info 的 key 中，或者留空。
"""


def chat_clarify(history: List[Dict], user_message: str) -> ChatResponse:
    """Multi-turn dialogue for requirement clarification"""
    
    # Build conversation messages
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    
    # Add conversation history
    for msg in history:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    
    # Add current user message
    if user_message:
        messages.append({"role": "user", "content": user_message})
    else:
        # Start conversation
        messages.append({"role": "user", "content": "开始"})
    
    result = _call_llm(messages, timeout=15.0)
    print(f"DEBUG: Chat Result Raw:\n{result}\n----------------")
    
    # Parse JSON response
    try:
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', result)
        if json_match:
            data = json.loads(json_match.group())
        else:
            data = {"reply": result, "is_complete": False}
    except json.JSONDecodeError:
        data = {"reply": result, "is_complete": False}
    
    return ChatResponse(
        reply=data.get("reply", "抱歉，我没有理解您的意思，能再说一遍吗？"),
        is_complete=data.get("is_complete", False),
        collected_info=data.get("collected_info", {}),
        quick_replies=data.get("quick_replies", [])
    )


def clarify_requirements(raw_req: str) -> ClarificationResponse:
    prompt = f"""
用户想要招聘，需求描述："{raw_req}"
请生成 5-8 个澄清问题，帮助明确岗位要求。

【输出格式】(严格JSON)
{{
  "questions": [
    {{
      "id": "q1",
      "question": "这个岗位需要掌握哪些编程语言？(可多选)",
      "multi_select": true,
      "options": [
        {{"text": "Python", "requires_input": false}},
        {{"text": "Java", "requires_input": false}},
        {{"text": "其他", "requires_input": true}}
      ]
    }},
    {{
      "id": "q2", 
      "question": "期望的工作经验年限？",
      "multi_select": false,
      "options": [
        {{"text": "1-3年", "requires_input": false}},
        {{"text": "3-5年", "requires_input": false}},
        {{"text": "具体说明", "requires_input": true}}
      ]
    }}
  ]
}}

【规则】
1. multi_select: true表示可多选，false表示单选
2. requires_input: true表示选中该选项后需要额外输入框
3. 问题要涵盖：技能要求、经验年限、薪资期望、团队规模（不要问工作地点，默认同一城市）
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
        from .models import ClarificationOption
        return ClarificationResponse(questions=[
            ClarificationQuestion(
                id="q_fallback", 
                question="请描述您需要的核心技能？（可多选）", 
                multi_select=True,
                options=[
                    ClarificationOption(text="Python", requires_input=False),
                    ClarificationOption(text="Java", requires_input=False),
                    ClarificationOption(text="其他", requires_input=True)
                ]
            )
        ])

def generate_jd(answers: Dict[str, str], raw_req: str = "") -> JobDefinition:
    prompt = f"""
    根据用户的回答和初始需求，生成一个结构化的职位描述（JD）。
    初始需求："{raw_req}"
    用户的回答：{json.dumps(answers, ensure_ascii=False)}

    特别重要：
    1. 提取"薪资"信息到 `salary` 对象。
    2. "工作地点" (`work_location`) **必须默认为 "杭州"** (除非用户强行指定其他城市，否则一律填 "杭州")。
    
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
        "work_location": "杭州",
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
        "interview": "面试邀请邮件",
        "reject": "婉拒邮件，委婉且专业地表达不予录用"
    }
    
    if action_type == "interview":
        prompt = f"""
请为候选人 "{candidate_name}" 生成一份面试邀请邮件。
职位：{job_title}

【任务】
1. 生成专业的面试邀请邮件正文
2. 生成5个针对该职位的技术面试问题

【输出格式】(严格JSON)
{{
    "content": "面试邀请邮件正文...",
    "interview_questions": [
        "问题1：请描述您在XX方面的项目经验",
        "问题2：如何解决XX问题",
        "问题3：...",
        "问题4：...",
        "问题5：..."
    ]
}}
"""
    else:
        prompt = f"""
请为候选人 "{candidate_name}" 生成一份【{action_desc.get(action_type, action_type)}】。
职位：{job_title}

【重要】你要生成的是：{action_type.upper()} 类型邮件
- 如果是 offer：要表达录用意向，欢迎加入
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
        # Extract JSON
        idx = conn.find('{')
        end = conn.rfind('}')
        if idx != -1 and end != -1:
            conn = conn[idx:end+1]
        data = json.loads(conn)
        return ActionResponse(**data)
    except Exception as e:
        print(f"Action Generation Error: {e}")
        return ActionResponse(content="生成失败", interview_questions=[])
