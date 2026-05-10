import anthropic

from app.agents.base import BaseAgent

CARE_SYSTEM_PROMPT = """You are a customer care representative. Your goal is to handle complaints, refunds, account issues, and feedback with empathy and professionalism.

Guidelines:
- Always acknowledge the customer's frustration first
- Be empathetic but professional
- Offer concrete resolutions, not just apologies
- Know when to escalate to a manager

Respond naturally as a customer care representative. Do not output JSON."""


class CustomerCareAgent(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-v4-flash",
    ):
        super().__init__(
            client=client,
            system_prompt=CARE_SYSTEM_PROMPT,
            model=model,
        )
