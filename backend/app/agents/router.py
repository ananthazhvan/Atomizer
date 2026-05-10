import json
import anthropic

from app.agents.base import BaseAgent

ROUTER_SYSTEM_PROMPT = """You are a message router for a business. Classify the user's message into exactly one of these categories:
- SALES: The customer wants to buy something, asks about pricing, products, plans, features, or wants a demo.
- SUPPORT: The customer has a technical problem, bug, error, or needs help using the product.
- CUSTOMER_CARE: The customer has a billing issue, wants a refund, is making a complaint, or has an account problem.
- GENERAL: Greetings, chitchat, or anything that doesn't fit the other categories.

Examples:
"How much does the enterprise plan cost?" → SALES
"My app keeps crashing when I upload photos" → SUPPORT
"I want a refund for my purchase last week" → CUSTOMER_CARE
"Hello, how are you?" → GENERAL

You must respond with ONLY a JSON object and nothing else. The JSON must have these fields:
- "category": one of "SALES", "SUPPORT", "CUSTOMER_CARE", "GENERAL"
- "confidence": a number between 0.0 and 1.0 indicating how confident you are
- "reasoning": a short (1 sentence) explanation of why you picked this category"""


class RouterAgent(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-v4-flash",
    ):
        super().__init__(
            client=client,
            system_prompt=ROUTER_SYSTEM_PROMPT,
            model=model,
        )

    async def classify(self, message: str) -> dict:
        result = await self.run(message)
        raw = result["response"]
        try:
            parsed = json.loads(raw)
            return {
                "category": parsed.get("category", "GENERAL"),
                "confidence": float(parsed.get("confidence", 0.5)),
                "reasoning": parsed.get("reasoning", ""),
            }
        except (json.JSONDecodeError, TypeError):
            return {
                "category": "GENERAL",
                "confidence": 0.3,
                "reasoning": "Failed to parse classification, defaulting to GENERAL",
            }


if __name__ == "__main__":
    import asyncio
    from app.config import ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL

    async def test():
        client_kwargs = {"api_key": ANTHROPIC_API_KEY}
        if ANTHROPIC_BASE_URL:
            client_kwargs["base_url"] = ANTHROPIC_BASE_URL

        client = anthropic.AsyncAnthropic(**client_kwargs)
        router = RouterAgent(client)

        messages = [
            "How much does the enterprise plan cost?",
            "The app crashes when I click save. Help!",
            "I was charged twice this month and I'm not happy about it.",
        ]

        for msg in messages:
            result = await router.classify(msg)
            print(f"Message: {msg}")
            print(f"  Category:   {result['category']}")
            print(f"  Confidence: {result['confidence']}")
            print(f"  Reasoning:  {result['reasoning']}")
            print()

    asyncio.run(test())
