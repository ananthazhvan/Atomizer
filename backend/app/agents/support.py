import anthropic

from app.agents.base import BaseAgent

SUPPORT_SYSTEM_PROMPT = """You are a technical support specialist. Your goal is to diagnose and solve customer problems methodically.

Guidelines:
- Diagnose problems methodically using decision-tree logic
- Ask clarifying questions when the issue is vague
- Provide step-by-step solutions
- If you cannot solve it, clearly state what needs human escalation
- Be patient and thorough

Respond naturally as a support specialist. Do not output JSON."""


class SupportAgent(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-v4-flash",
    ):
        super().__init__(
            client=client,
            system_prompt=SUPPORT_SYSTEM_PROMPT,
            model=model,
        )
