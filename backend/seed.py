"""Seed script that populates the demo project with realistic sample conversations.

Run: python -m seed  (from the backend directory)
"""
import asyncio
import uuid
from datetime import datetime, timedelta
import random

from app.database import init_db, async_session, Conversation, Message


SAMPLE_CONVERSATIONS = [
    {
        "status": "resolved",
        "messages": [
            ("user", "Hi, I'm interested in upgrading our team plan. We currently have 12 people but might grow to 25 by next quarter. What pricing tier would you recommend?", "positive", 0.72, 0.15),
            ("assistant", "Great question! For a team of 12 growing to 25, I'd recommend our Professional plan at $29/user/month. It includes unlimited storage, priority support, and you only pay for active seats — so you can scale up as you hire without overpaying now. Would you like me to send you a detailed comparison with the Enterprise tier?", "SALES", 0.93),
            ("user", "Yes please, and can you also check if there's a discount for annual billing?", "positive", 0.78, 0.2),
            ("assistant", "Absolutely! Annual billing saves you 20% — that's $278.40/user/year instead of $348. I've also checked our current promotion: teams migrating from a competitor get their first month free. Are you currently using another platform?", "SALES", 0.91),
            ("user", "We're on Dropbox Business right now. The free month sounds great.", "positive", 0.85, 0.3),
            ("assistant", "Perfect — the competitor migration credit applies to you. With 12 seats on the Professional annual plan, you're looking at $3,340.80/year total, with the first month waived. Your data migration from Dropbox is included at no extra cost. Shall I set up a call with our onboarding team to get you started?", "SALES", 0.94),
            ("user", "That sounds perfect, let's do it.", "positive", 0.9, 0.1),
            ("assistant", "I've noted your account for the onboarding call. Our team typically reaches out within 4 business hours. In the meantime, you'll receive an email with the pricing breakdown and migration guide. Thanks for choosing us — we're excited to have you on board!", "SALES", 0.95),
        ],
    },
    {
        "status": "resolved",
        "messages": [
            ("user", "The export to CSV feature isn't working. When I click the button nothing happens and the console shows a 500 error.", "neutral", 0.45, 0.5),
            ("assistant", "I can help troubleshoot that. Let's narrow this down: are you on the Reports page or the Dashboard page when you click export? And which browser are you using?", "SUPPORT", 0.88),
            ("user", "Reports page, Chrome. It was working fine yesterday.", "negative", 0.35, 0.4),
            ("assistant", "Thanks — we released an update last night that changed the export endpoint. Try clearing your browser cache (Ctrl+Shift+Delete → Cached images and files), then refresh the Reports page. The new endpoint requires a fresh auth token that may be cached incorrectly.", "SUPPORT", 0.87),
            ("user", "That fixed it! Thanks for the quick help.", "positive", 0.82, 0.15),
            ("assistant", "Glad that worked! Our engineering team is adding better cache-busting in the next release to prevent this from happening again. If you run into anything else, just reach out.", "SUPPORT", 0.9),
        ],
    },
    {
        "status": "escalated",
        "escalation_reason": "Supervisor flagged: agent response was evasive about refund policy; customer expressing frustration about double charge",
        "messages": [
            ("user", "I was charged twice this month — $299 on the 3rd and again on the 5th. This is completely unacceptable and I need a refund RIGHT NOW.", "frustrated", 0.12, 0.95),
            ("assistant", "I'm very sorry to hear about the double charge. I understand how frustrating this must be. Let me look into your account immediately and get this sorted for you.", "CUSTOMER_CARE", 0.85),
            ("user", "I've been on hold with my bank for 30 minutes because of this. I want the refund processed today.", "frustrated", 0.08, 0.92),
            ("assistant", "I sincerely apologise, but I need to escalate your query to a team member who can give it the attention it deserves. Someone will follow up shortly.", "CUSTOMER_CARE", 0.45),
        ],
    },
    {
        "status": "active",
        "messages": [
            ("user", "What integrations do you support? We use Salesforce, Slack, and Jira.", "neutral", 0.5, 0.25),
            ("assistant", "We natively support all three! Our Salesforce integration syncs contacts and opportunities bidirectionally, Slack connects for notifications and slash commands, and Jira links so support agents can create and track tickets directly from conversations. Would you like me to walk through the setup for any of these?", "SALES", 0.92),
            ("user", "That's great. How long does the Salesforce setup usually take?", "positive", 0.65, 0.2),
            ("assistant", "The Salesforce integration typically takes about 15 minutes to set up. You'll need admin access to your Salesforce org to authorize the OAuth connection. Here's the quick overview: 1) Go to Settings → Integrations → Salesforce, 2) Click Connect and log in to Salesforce, 3) Choose which objects to sync (Contacts, Opportunities, or both), 4) Map your custom fields if you have any. Our support team can walk you through it on a screen share if you prefer.", "SALES", 0.9),
        ],
    },
    {
        "status": "pending_human",
        "escalation_reason": "Supervisor flagged score 0.4: response made promises about refund timeline without policy verification; legal risk",
        "messages": [
            ("user", "Your product corrupted three months of our financial data. We're considering legal action unless someone in management contacts us today.", "frustrated", 0.05, 1.0),
            ("assistant", "I understand the severity of this situation. This needs immediate attention from our senior team. I've flagged your account as critical priority and our head of customer success will contact you within the hour. May I confirm the best phone number to reach you?", "CUSTOMER_CARE", 0.62),
        ],
    },
    {
        "status": "resolved",
        "messages": [
            ("user", "Hello!", "positive", 0.75, 0.1),
            ("assistant", "Hello! How can I help you today? I'm here to assist with any questions about our products, support issues, or account matters.", "GENERAL", 0.98),
        ],
    },
    {
        "status": "active",
        "messages": [
            ("user", "Do you have a mobile app? My team is often in the field and needs access on phones.", "neutral", 0.52, 0.3),
            ("assistant", "Yes, we have native iOS and Android apps with full feature parity to the web dashboard. Your team can view reports, respond to customer messages, and access the knowledge base from their phones. The apps also support offline mode — any actions queue up and sync when you're back online. Would you like me to send the download links?", "SALES", 0.88),
            ("user", "How does the offline mode handle file uploads?", "neutral", 0.48, 0.35),
            ("assistant", "Files are queued locally and uploaded automatically when connectivity returns. There's a 50MB per-file limit on mobile. For larger files, the app will hold them and notify the user to upload from a desktop connection. The queue is persistent across app restarts, so nothing gets lost.", "SUPPORT", 0.86),
        ],
    },
    {
        "status": "resolved",
        "messages": [
            ("user", "My account password reset email isn't arriving. Checked spam, waited 15 minutes, tried three times.", "frustrated", 0.22, 0.7),
            ("assistant", "I understand the frustration — being locked out is stressful. Let me check a few things: first, can you confirm the email address on your account? Sometimes a typo during signup causes this. Also, our logs show if the emails are bouncing.", "SUPPORT", 0.85),
            ("user", "It's john.smith@acmecorp.com", "neutral", 0.4, 0.5),
            ("assistant", "I can see the issue — emails to acmecorp.com are being deferred by your company's mail server (it's rate-limiting password reset emails as potential spam). I've whitelisted your domain and triggered a manual reset. You should receive it within 2 minutes. If it still doesn't arrive, I can verify your identity through an alternative method.", "SUPPORT", 0.91),
            ("user", "Got it! That worked. Thanks for digging into this.", "positive", 0.88, 0.15),
            ("assistant", "You're welcome! I've also added a note for our engineering team to increase the retry window for corporate domains to prevent this in the future. Have a great rest of your day!", "SUPPORT", 0.93),
        ],
    },
]


def _random_times(count: int, base_date: datetime) -> list[datetime]:
    """Generate count timestamps spaced out from base_date, going backwards."""
    times = []
    for i in range(count):
        offset = timedelta(
            minutes=random.randint(1, 45) + (i * random.randint(30, 120))
        )
        times.append(base_date - offset)
    return sorted(times)


async def seed():
    await init_db()

    async with async_session() as db:
        # Seed conversations under the demo project
        now = datetime.utcnow()

        total_messages = 0
        for idx, conv_data in enumerate(SAMPLE_CONVERSATIONS):
            conv_id = str(uuid.uuid4())
            session_id = f"seed_session_{idx}"

            conv = Conversation(
                id=conv_id,
                project_id="demo",
                session_id=session_id,
                status=conv_data["status"],
                escalated_at=(
                    now - timedelta(minutes=random.randint(10, 120))
                    if conv_data["status"] in ("escalated", "pending_human")
                    else None
                ),
                escalation_reason=conv_data.get("escalation_reason"),
                created_at=now - timedelta(hours=random.randint(1, 48)),
                updated_at=now - timedelta(minutes=random.randint(1, 60)),
            )
            db.add(conv)

            times = _random_times(len(conv_data["messages"]), conv.created_at)

            last_agent_time = None
            for msg_idx, msg_data in enumerate(conv_data["messages"]):
                role, content = msg_data[0], msg_data[1]
                msg_time = times[msg_idx]

                if role == "user":
                    sentiment, satisfaction, urgency = msg_data[2], msg_data[3], msg_data[4]
                    db.add(Message(
                        id=str(uuid.uuid4()),
                        conversation_id=conv_id,
                        role="user",
                        content=content,
                        sentiment=sentiment,
                        satisfaction=satisfaction,
                        urgency=urgency,
                        created_at=msg_time,
                    ))
                else:
                    agent_type, confidence = msg_data[2], msg_data[3]
                    # Simulate response time: 5-60 seconds after the user message
                    response_time = msg_time + timedelta(seconds=random.randint(5, 60))
                    db.add(Message(
                        id=str(uuid.uuid4()),
                        conversation_id=conv_id,
                        role="assistant",
                        content=content,
                        agent_type=agent_type,
                        confidence=confidence,
                        responded_at=response_time,
                        created_at=response_time,
                    ))

                total_messages += 1

        await db.commit()

    print(f"Seeded {len(SAMPLE_CONVERSATIONS)} conversations with {total_messages} messages.")


if __name__ == "__main__":
    asyncio.run(seed())
