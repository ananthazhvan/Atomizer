from datetime import datetime
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import anthropic

from app.config import ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL
from app.database import get_db, Conversation, Message
from app.models import (
    ChatRequest,
    ChatResponse,
    ConversationStatusUpdate,
    ConversationDetail,
    MessageDetail,
)
from app.agents.router import RouterAgent
from app.agents.sales import SalesAgent
from app.agents.support import SupportAgent
from app.agents.care import CustomerCareAgent
from app.agents.supervisor import SupervisorAgent

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


async def _check_handoff(
    client: anthropic.AsyncAnthropic,
    agent_response: str,
    agent_type: str,
    history: list[dict],
) -> dict | None:
    """Detect if the agent's response suggests a handoff is needed, or if we should reclassify."""
    handoff_signals = [
        "i think", "would be better", "support team", "sales team",
        "billing department", "transfer you", "connect you", "not my area",
        "outside my", "not qualified", "escalate",
    ]
    response_lower = agent_response.lower()
    signals_found = [s for s in handoff_signals if s in response_lower]

    if signals_found:
        router = RouterAgent(client)
        reclassification = await router.reclassify(history)
        if reclassification.get("should_handoff") and reclassification["category"] != agent_type:
            return {
                "handoff_from": agent_type,
                "handoff_to": reclassification["category"],
                "confidence": reclassification["confidence"],
            }

    # Also reclassify if agent confidence has been trending low
    recent_confidences = [
        m.get("confidence", 0.5) for m in history[-4:]
        if m.get("role") == "assistant"
    ]
    if len(recent_confidences) >= 2 and sum(recent_confidences) / len(recent_confidences) < 0.6:
        router = RouterAgent(client)
        reclassification = await router.reclassify(history)
        if reclassification.get("should_handoff") and reclassification["category"] != agent_type:
            return {
                "handoff_from": agent_type,
                "handoff_to": reclassification["category"],
                "confidence": reclassification["confidence"],
            }

    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
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

        agent_response = result["response"]
        final_confidence = confidence

        # Agent handoff detection
        handoff = await _check_handoff(
            client, agent_response, category,
            history + [{"role": "user", "content": request.message}],
        )

        if handoff:
            # Re-route to the new agent
            new_agent_cls = AGENT_MAP.get(handoff["handoff_to"])
            if new_agent_cls:
                new_agent = new_agent_cls(client)
                new_result = await new_agent.run(request.message, history, knowledge)
                agent_response = new_result["response"]
                final_confidence = handoff["confidence"]

                await _store_conversation(
                    db,
                    project_id=request.project_id,
                    session_id=request.session_id,
                    user_message=request.message,
                    response=agent_response,
                    agent_type=handoff["handoff_to"],
                    confidence=final_confidence,
                )

                return ChatResponse(
                    response=agent_response,
                    agent_type=handoff["handoff_to"],
                    confidence=final_confidence,
                    handoff_from=handoff["handoff_from"],
                    handoff_to=handoff["handoff_to"],
                )

        # Supervisor review
        supervisor = SupervisorAgent(client)
        review = await supervisor.review(
            user_message=request.message,
            agent_response=agent_response,
            agent_type=category,
        )

        if not review["pass"]:
            if review["score"] < 0.6:
                final_response = review.get("corrected_response") or (
                    "I apologise, but I need to escalate your query to a team member "
                    "who can give it the attention it deserves. Someone will follow up shortly."
                )
                await _store_conversation(
                    db,
                    project_id=request.project_id,
                    session_id=request.session_id,
                    user_message=request.message,
                    response=final_response,
                    agent_type=category,
                    confidence=confidence,
                    status="escalated",
                    escalation_reason=review.get("issues", "Supervisor flagged for escalation"),
                )
                return ChatResponse(
                    response=final_response,
                    agent_type=category,
                    confidence=confidence,
                )
            elif review.get("corrected_response"):
                agent_response = review["corrected_response"]
                final_confidence = review["score"]

        await _store_conversation(
            db,
            project_id=request.project_id,
            session_id=request.session_id,
            user_message=request.message,
            response=agent_response,
            agent_type=category,
            confidence=final_confidence,
        )

        return ChatResponse(
            response=agent_response,
            agent_type=category,
            confidence=final_confidence,
        )
    except Exception:
        return ChatResponse(
            response="I'm having trouble right now. Please try again in a moment.",
            agent_type="GENERAL",
            confidence=0.0,
        )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """SSE streaming endpoint. Router classifies first, then specialist streams."""
    async def event_stream():
        try:
            client = _get_client()

            # Phase 1: Classify (non-streamed)
            router = RouterAgent(client)
            classification = await router.classify(request.message)
            category = classification["category"]
            confidence = classification["confidence"]

            agent_cls = AGENT_MAP.get(category)
            if agent_cls is None:
                yield f"event: agent\ndata: {json.dumps({'agent_type': 'GENERAL', 'confidence': confidence})}\n\n"
                yield f"event: chunk\ndata: {json.dumps({'text': 'Thanks for your message. How can I help you today?'})}\n\n"
                yield f"event: done\ndata: {json.dumps({'confidence': confidence})}\n\n"
                return

            yield f"event: agent\ndata: {json.dumps({'agent_type': category, 'confidence': confidence})}\n\n"

            # Phase 2: Stream specialist response
            history = await _load_history(db, request.session_id)
            agent = agent_cls(client)
            knowledge = await _get_knowledge_context(request.message, request.project_id)

            full_response = ""
            async for chunk in agent.run_stream(request.message, history, knowledge):
                full_response += chunk
                yield f"event: chunk\ndata: {json.dumps({'text': chunk})}\n\n"

            # Phase 3: Supervisor review (non-streamed)
            supervisor = SupervisorAgent(client)
            review = await supervisor.review(request.message, full_response, category)

            if not review["pass"] and review["score"] < 0.6:
                status = "escalated"
                escalation_reason = review.get("issues", "Supervisor flagged for escalation")
            else:
                status = "active"
                escalation_reason = None

            # Store conversation
            await _store_conversation(
                db,
                project_id=request.project_id,
                session_id=request.session_id,
                user_message=request.message,
                response=full_response,
                agent_type=category,
                confidence=confidence,
                status=status,
                escalation_reason=escalation_reason,
            )

            yield f"event: done\ndata: {json.dumps({'confidence': confidence, 'status': status})}\n\n"

        except Exception:
            yield f"event: error\ndata: {json.dumps({'text': 'Something went wrong. Please try again.'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetail(
        id=conversation.id,
        project_id=conversation.project_id,
        session_id=conversation.session_id,
        status=conversation.status,
        escalated_at=conversation.escalated_at,
        escalation_reason=conversation.escalation_reason,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageDetail(
                id=m.id,
                role=m.role,
                content=m.content,
                agent_type=m.agent_type,
                confidence=m.confidence,
                created_at=m.created_at,
            )
            for m in conversation.messages
        ],
    )


@router.patch("/conversations/{conversation_id}/status")
async def update_conversation_status(
    conversation_id: str,
    body: ConversationStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    if body.status not in ("active", "resolved", "escalated", "pending_human"):
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be one of: active, resolved, escalated, pending_human",
        )

    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.status = body.status
    conversation.updated_at = datetime.utcnow()

    if body.status == "escalated":
        conversation.escalated_at = datetime.utcnow()
    elif body.status == "resolved":
        conversation.escalated_at = None
        conversation.escalation_reason = None

    await db.commit()
    return {"id": conversation_id, "status": body.status}


async def _load_history(db: AsyncSession, session_id: str) -> list[dict]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalars().first()
    if not conversation:
        return []
    return [
        {
            "role": m.role,
            "content": m.content,
            "agent_type": m.agent_type,
            "confidence": m.confidence,
        }
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
    status: str = "active",
    escalation_reason: str | None = None,
):
    result = await db.execute(
        select(Conversation).where(Conversation.session_id == session_id)
    )
    conversation = result.scalars().first()
    now = datetime.utcnow()

    if not conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            project_id=project_id,
            session_id=session_id,
            status=status,
            escalated_at=now if status == "escalated" else None,
            escalation_reason=escalation_reason,
        )
        db.add(conversation)
    else:
        conversation.updated_at = now
        if status == "escalated":
            conversation.status = "escalated"
            conversation.escalated_at = now
            conversation.escalation_reason = escalation_reason

    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="user",
        content=user_message,
        created_at=now,
    )
    db.add(user_msg)

    ai_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role="assistant",
        content=response,
        agent_type=agent_type,
        confidence=confidence,
        responded_at=now,
    )
    db.add(ai_msg)

    await db.commit()
