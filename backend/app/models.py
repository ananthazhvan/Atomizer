from datetime import datetime
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    business_domain: str = ""


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    business_domain: str
    created_at: datetime


class ChatRequest(BaseModel):
    project_id: str
    message: str
    session_id: str


class ChatResponse(BaseModel):
    response: str
    agent_type: str
    confidence: float


class KnowledgeUpload(BaseModel):
    title: str
    project_id: str


class AnalyticsOverview(BaseModel):
    total_conversations: int
    avg_response_time: float
    resolution_rate: float
    active_sessions: int


class AgentBreakdownItem(BaseModel):
    agent_type: str
    count: int
    avg_confidence: float
    resolution_rate: float


class ConversationSummary(BaseModel):
    id: str
    message: str
    agent_type: str
    confidence: float
    status: str
    time: str
