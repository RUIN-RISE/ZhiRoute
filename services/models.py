from pydantic import BaseModel
from typing import List, Optional, Dict

class JobRequest(BaseModel):
    raw_requirement: str

class ClarificationOption(BaseModel):
    text: str
    requires_input: bool = False  # Whether this option needs additional text input

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    multi_select: bool = False  # True = checkboxes, False = radio
    options: Optional[List[ClarificationOption]] = None

class ClarificationResponse(BaseModel):
    questions: List[ClarificationQuestion]

class SalaryConfig(BaseModel):
    range: str = "面议"
    tax_type: str = "税前" # 税前/税后
    has_bonus: bool = False # 是否含绩效
    description: Optional[str] = None

class JobDefinition(BaseModel):
    title: str
    key_responsibilities: List[str] = []
    required_skills: List[str] = []
    experience_level: str
    education: str = "未指定"
    salary: SalaryConfig = SalaryConfig()
    work_location: str = "杭州"  # Fixed, not editable
    bonus_skills: List[str] = []
    culture_fit: List[str] = []

class Resume(BaseModel):
    id: str
    name: str
    content: str  # Raw text content for now
    parsed_skills: Optional[List[str]] = None
    years_experience: Optional[int] = None

class ClarificationAnswer(BaseModel):
    question_id: str
    answer: str

class Evidence(BaseModel):
    criteria: str
    quote: str
    reasoning: str

class CandidateRank(BaseModel):
    resume_id: str
    name: str
    rank: int
    score: int
    summary: str
    top_evidence: List[Evidence]
    evidence_quotes: List[str] = []  # Direct quotes from resume

class ActionRequest(BaseModel):
    candidate_name: str
    action_type: str # 'offer', 'reject', 'interview'
    job_title: str

class ActionResponse(BaseModel):
    content: str
    interview_questions: List[str] = []  # For interview type

# Multi-turn chat models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    is_complete: bool = False  # True when all info is collected
    collected_info: Dict = {}  # Collected requirement info
    quick_replies: List[str] = []  # Optional quick reply buttons

