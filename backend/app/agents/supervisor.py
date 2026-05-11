import json
import anthropic

from app.agents.base import BaseAgent

SUPERVISOR_SYSTEM_PROMPT = """You are a quality assurance supervisor for a multi-agent customer service system. Your job is to review the response from a specialist agent and evaluate it against four criteria:

- ACCURACY: Does the response correctly address the customer's question? No hallucinations or made-up facts?
- TONE: Is the tone appropriate? Empathetic for complaints, professional for sales, helpful for support.
- COMPLETENESS: Did the agent fully answer the question, or did it deflect / give a non-answer?
- SAFETY: Does the response make promises the business can't keep? Any legal or compliance risks?

You must respond with ONLY a JSON object and nothing else:
{
    "pass": true/false,
    "score": 0.0-1.0,
    "issues": "Brief explanation of any issues found, or empty string if none",
    "corrected_response": "Rewritten response if score < 0.7, otherwise empty string"
}

Rules:
- If score >= 0.8, pass=true. The response is good as-is.
- If score is 0.6-0.79, pass=false but provide a corrected_response that fixes the issues.
- If score < 0.6, pass=false AND the response needs escalation. Set corrected_response to a brief polite message informing the customer their query is being escalated.
- A response that deflects ("I don't know", "contact support", generic non-answers) without good reason should score below 0.6.
- A response that makes false promises (refunds without policy, guaranteed results) should score below 0.6.
- Be strict but fair. A simple "thanks for your message" style response to "hello" can still pass."""


class SupervisorAgent(BaseAgent):
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        model: str = "deepseek-chat",
    ):
        super().__init__(
            client=client,
            system_prompt=SUPERVISOR_SYSTEM_PROMPT,
            model=model,
        )

    async def review(
        self,
        user_message: str,
        agent_response: str,
        agent_type: str,
    ) -> dict:
        review_prompt = (
            f"Customer message: {user_message}\n\n"
            f"Agent type: {agent_type}\n\n"
            f"Agent response to review:\n{agent_response}"
        )

        result = await self.run(review_prompt)
        raw = result["response"]

        try:
            parsed = json.loads(raw)
            return {
                "pass": parsed.get("pass", True),
                "score": float(parsed.get("score", 0.8)),
                "issues": parsed.get("issues", ""),
                "corrected_response": parsed.get("corrected_response", ""),
            }
        except (json.JSONDecodeError, TypeError):
            return {
                "pass": True,
                "score": 0.7,
                "issues": "Supervisor failed to parse - defaulting to pass",
                "corrected_response": "",
            }
