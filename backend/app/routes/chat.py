from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import anthropic

from app.config import ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL
from app.database import get_db, Conversation, Message
from app.models import ChatRequest, ChatResponse
from app.agents.router import RouterAgent
from app.agents.sales import SalesAgent
from app.agents.support import SupportAgent
from app.agents.care import CustomerCareAgent

router = APIRouter(tags=["chat"])


def _get_client() -> anthropic.AsyncAnthropic:
    kwargs = {"api_key": ANTHROPIC_API_KEY}
    if ANTHROPIC_BASE_URL:
        kwargs["base_url"] = ANTHROPIC_BASE_URL
    return anthropic.AsyncAnthropic(**kwargs)


async def _get_knowledge_context(query: str, project_id: str) -> str:
    try:
        from app.knowledge.retrieve import retrieve_context
        return await retrieve_context(query, project_id) or ""
    except Exception:
        return ""


AGENT_MAP = {
    "SALES": SalesAgent,
    "SUPPORT": SupportAgent,
    "CUSTOMER_CARE": CustomerCareAgent,
}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    client = _get_client()

    router = RouterAgent(client)
    classification = await router.classify(request.message)
    category = classification["category"]
    confidence = classification["confidence"]

    agent_cls = AGENT_MAP.get(category)
    if agent_cls is None:
        return ChatResponse(
            response="Thanks for your message. How can I help you today?",
            agent_type="GENERAL",
            confidence=confidence,
        )

    history = await _load_history(db, request.session_id)

    agent = agent_cls(client)
    knowledge = await _get_knowledge_context(request.message, request.project_id)
    result = await agent.run(request.message, history, knowledge)

    await _store_conversation(
        db,
        project_id=request.project_id,
        session_id=request.session_id,
        user_message=request.message,
        response=result["response"],
        agent_type=category,
        confidence=confidence,
    )

    return ChatResponse(
        response=result["response"],
        agent_type=category,
        confidence=confidence,
    )


async def _load_history(db: AsyncSession, session_id: str) -> list[dict]:
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalars().first()
    if not conversation:
        return []
    return [
        {"role": m.role, "content": m.content}
        for m in conversation.messages
    ]


async def _store_conversation(
    db: AsyncSession,
    project_id: str,
    session_id: str,
    user_message: str,
    response: str,
    agent_type: str,
    confidence: float,
):
    from sqlalchemy import select
    import uuid
    from datetime import datetime

    result = await db.execute(
        select(Conversation).where(Conversation.session_id == session_id)
    )
    conversation = result.scalars().first()

    if not conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            project_id=project_id,
            session_id=session_id,
        )
        db.add(conversation)
    else:
        conversation.updated_at = datetime.utcnow()

    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)

    ai_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="assistant",
        content=response,
        agent_type=agent_type,
        confidence=confidence,
    )
    db.add(ai_msg)

    await db.commit()
