import anthropic

from app.agents.base import BaseAgent

SALES_SYSTEM_PROMPT = """You are a skilled sales representative for a business. Your goal is to help customers understand products, pricing, and features, and guide them toward a purchase.

Guidelines:
- Help customers understand products, pricing, and features
- Qualify leads by asking about their needs and budget
- Suggest appropriate products based on customer requirements
- Be persuasive but not pushy
- End responses with a subtle call to action

Respond naturally as a sales representative. Do not output JSON."""


class SalesAgent(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-v4-flash",
    ):
        super().__init__(
            client=client,
            system_prompt=SALES_SYSTEM_PROMPT,
            model=model,
        )
