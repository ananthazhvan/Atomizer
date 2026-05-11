from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["whatsapp"])


@router.get("/whatsapp/webhook")
async def verify_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token"),
):
    """WhatsApp Cloud API webhook verification.

    WhatsApp sends a GET request with hub.mode=subscribe and a verify token
    to confirm the webhook endpoint is owned by the developer.
    """
    VERIFY_TOKEN = "atomizer_flowzint_verify"

    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge, status_code=200)

    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/webhook")
async def receive_whatsapp_message(request: Request):
    """Receive incoming WhatsApp messages via the Cloud API webhook.

    Transforms WhatsApp message format into Atomizer's standard ChatRequest
    and routes through the same multi-agent pipeline.

    Expected payload (WhatsApp Cloud API format):
    {
        "object": "whatsapp_business_account",
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "15551234567",
                        "text": { "body": "I need help with my order" }
                    }]
                }
            }]
        }]
    }
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    entries = body.get("entry", [])
    messages_received = []

    for entry in entries:
        for change in entry.get("changes", []):
            value = change.get("value", {})
            incoming = value.get("messages", [])

            for msg in incoming:
                from_number = msg.get("from", "unknown")
                text_body = (
                    msg.get("text", {}).get("body", "")
                    if isinstance(msg.get("text"), dict)
                    else ""
                )

                if not text_body:
                    continue

                messages_received.append({
                    "from": from_number,
                    "message": text_body,
                    "timestamp": msg.get("timestamp", ""),
                })

    if not messages_received:
        return {"status": "no_messages"}

    return {
        "status": "received",
        "messages": messages_received,
        "note": "WhatsApp messages received. In production, each message would be routed through Atomizer's agent pipeline with channel='whatsapp' for response formatting.",
    }
