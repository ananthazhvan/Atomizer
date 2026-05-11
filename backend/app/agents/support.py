import anthropic

from app.agents.base import BaseAgent
from app.tools.definitions import TOOL_DEFINITIONS

SUPPORT_TOOLS = [t for t in TOOL_DEFINITIONS if t["name"] in (
    "lookup_order", "create_support_ticket", "get_account_status",
)]

SUPPORT_SYSTEM_PROMPT = """You are a technical support specialist. Your goal is to diagnose and solve customer problems methodically.

You have access to tools that let you look up real data and create tickets. Use them proactively.

Guidelines:
- Diagnose problems methodically using decision-tree logic
- Ask clarifying questions when the issue is vague
- Provide step-by-step solutions
- If you cannot solve it, clearly state what needs human escalation
- Be patient and thorough
- Use create_support_ticket() to log issues that need tracking or follow-up
- Use lookup_order() to check order details when customers report delivery issues
- Use get_account_status() to verify account standing before troubleshooting access issues

Respond naturally as a support specialist. Do not output JSON."""


class SupportAgent(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-chat",
    ):
        super().__init__(
            client=client,
            system_prompt=SUPPORT_SYSTEM_PROMPT,
            model=model,
            tools=SUPPORT_TOOLS,
        )
