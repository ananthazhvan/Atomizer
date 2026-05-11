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
    handoff_from: str | None = None
    handoff_to: str | None = None


class DailyStats(BaseModel):
    day: str
    conversations: int


class StreamEvent(BaseModel):
    event: str
    data: str | None = None


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


class ConversationStatusUpdate(BaseModel):
    status: str


class ConversationDetail(BaseModel):
    id: str
    project_id: str
    session_id: str
    status: str
    escalated_at: datetime | None = None
    escalation_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    messages: list["MessageDetail"] = []


class MessageDetail(BaseModel):
    id: str
    role: str
    content: str
    agent_type: str | None = None
    confidence: float | None = None
    created_at: datetime


class EscalatedConversation(BaseModel):
    id: str
    session_id: str
    first_message: str
    agent_type: str
    escalated_at: datetime
    escalation_reason: str | None = None
    status: str
