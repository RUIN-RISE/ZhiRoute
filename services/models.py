from pydantic import BaseModel
from typing import List, Optional, Dict

class JobRequest(BaseModel):
    raw_requirement: str

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: Optional[List[str]] = None

class ClarificationResponse(BaseModel):
    questions: List[ClarificationQuestion]

class SalaryConfig(BaseModel):
    range: str = "面议"
    tax_type: str = "税前" # 税前/税后
    has_bonus: bool = False # 是否含绩效
    description: Optional[str] = None

class JobDefinition(BaseModel):
    title: str
    key_responsibilities: List[str]
    required_skills: List[str]
    experience_level: str
    salary: SalaryConfig
    work_location: str = "公司现场"
    bonus_skills: List[str]

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

class ActionRequest(BaseModel):
    candidate_name: str
    action_type: str # 'offer', 'reject', 'interview'
    job_title: str

class ActionResponse(BaseModel):
    content: str
