import json
import anthropic

from app.agents.base import BaseAgent

SENTIMENT_SYSTEM_PROMPT = """You are a sentiment analysis classifier. Analyze the customer's message and classify it.

Return ONLY a JSON object with these fields:
- "sentiment": one of "positive", "neutral", "negative", "frustrated"
- "satisfaction": a float from 0.0 (extremely dissatisfied) to 1.0 (extremely satisfied)
- "urgency": a float from 0.0 (not urgent) to 1.0 (critical/escalation needed now)
- "summary": a 3-word max label for the emotional tone (e.g. "curious and optimistic", "angry about billing")

Classification guidelines:
- "positive": Customer is happy, satisfied, grateful, or excited. satisfaction >= 0.7
- "neutral": Routine inquiry, no strong emotion. satisfaction around 0.5
- "negative": Dissatisfied, disappointed, or mildly upset. satisfaction 0.2-0.5
- "frustrated": Angry, threatening to leave, demanding escalation. satisfaction < 0.3

Urgency signals:
- Words like "immediately", "urgent", "ASAP", "right now" → urgency > 0.7
- Mention of legal action, chargebacks, or "speak to manager" → urgency > 0.8
- Routine inquiry with no time pressure → urgency < 0.3"""


class SentimentAnalyzer(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-chat",
    ):
        super().__init__(
            client=client,
            system_prompt=SENTIMENT_SYSTEM_PROMPT,
            model=model,
        )

    async def analyze(self, user_message: str) -> dict:
        result = await self.run(user_message)
        raw = result["response"]

        try:
            parsed = json.loads(raw)
            sentiment = parsed.get("sentiment", "neutral")
            if sentiment not in ("positive", "neutral", "negative", "frustrated"):
                sentiment = "neutral"
            return {
                "sentiment": sentiment,
                "satisfaction": float(parsed.get("satisfaction", 0.5)),
                "urgency": float(parsed.get("urgency", 0.0)),
                "summary": parsed.get("summary", ""),
            }
        except (json.JSONDecodeError, TypeError):
            return {
                "sentiment": "neutral",
                "satisfaction": 0.5,
                "urgency": 0.0,
                "summary": "",
            }
