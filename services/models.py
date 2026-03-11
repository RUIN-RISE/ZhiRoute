from pydantic import BaseModel
from typing import Dict, List, Optional


class JobRequest(BaseModel):
    raw_requirement: str


class ClarificationOption(BaseModel):
    text: str
    requires_input: bool = False


class ClarificationQuestion(BaseModel):
    id: str
    question: str
    multi_select: bool = False
    options: Optional[List[ClarificationOption]] = None


class ClarificationResponse(BaseModel):
    questions: List[ClarificationQuestion]


class SalaryConfig(BaseModel):
    range: str = "面议"
    tax_type: str = "税前"
    has_bonus: bool = False
    description: Optional[str] = None


class JobDefinition(BaseModel):
    title: str
    key_responsibilities: List[str] = []
    required_skills: List[str] = []
    experience_level: str
    education: str = "未指定"
    salary: SalaryConfig = SalaryConfig()
    work_location: str = "杭州"
    bonus_skills: List[str] = []
    culture_fit: List[str] = []


class Resume(BaseModel):
    id: str
    name: str
    content: str
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
    evidence_quotes: List[str] = []


class ActionRequest(BaseModel):
    candidate_name: str
    action_type: str
    job_title: str


class ActionResponse(BaseModel):
    content: str
    interview_questions: List[str] = []


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    is_complete: bool = False
    collected_info: Dict = {}
    quick_replies: List[str] = []
