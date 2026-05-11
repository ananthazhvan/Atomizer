import asyncio
import json
from typing import AsyncGenerator
import anthropic


class BaseAgent:
    def __init__(
        self,
        client: anthropic.AsyncAnthropic,
        system_prompt: str,
        model: str = "deepseek-chat",
    ):
        self.client = client
        self.system_prompt = system_prompt
        self.model = model

    def _build_messages(
        self,
        user_message: str,
        conversation_history: list[dict] | None = None,
    ) -> list[dict]:
        messages = []
        for entry in (conversation_history or []):
            messages.append({
                "role": entry.get("role", "user"),
                "content": entry.get("content", ""),
            })
        messages.append({"role": "user", "content": user_message})
        return messages

    def _build_system(self, knowledge_context: str = "") -> str:
        system = self.system_prompt
        if knowledge_context:
            system = f"{system}\n\nRelevant knowledge:\n{knowledge_context}"
        return system

    async def run(
        self,
        user_message: str,
        conversation_history: list[dict] | None = None,
        knowledge_context: str = "",
    ) -> dict:
        messages = self._build_messages(user_message, conversation_history)
        system = self._build_system(knowledge_context)

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system,
                messages=messages,
                temperature=0.3,
            )

            raw = "".join(
                block.text for block in response.content if hasattr(block, "text")
            )

            try:
                parsed = json.loads(raw)
                return {
                    "response": parsed.get("response", raw),
                    "confidence": float(parsed.get("confidence", 0.5)),
                    "reasoning": parsed.get("reasoning", ""),
                }
            except (json.JSONDecodeError, TypeError):
                return {
                    "response": raw,
                    "confidence": 0.5,
                    "reasoning": "",
                }

        except anthropic.APIError as e:
            return {
                "response": f"Agent error: {e.message}",
                "confidence": 0.0,
                "reasoning": f"API error: {e.status_code}",
            }
        except Exception as e:
            return {
                "response": "I'm having trouble connecting. Please try again in a moment.",
                "confidence": 0.0,
                "reasoning": f"Unexpected error: {str(e)}",
            }

    async def run_stream(
        self,
        user_message: str,
        conversation_history: list[dict] | None = None,
        knowledge_context: str = "",
    ) -> AsyncGenerator[str, None]:
        result = await self.run(user_message, conversation_history, knowledge_context)
        text = result["response"]

        # Simulate streaming by yielding in small word chunks
        words = text.split(" ")
        for i, word in enumerate(words):
            suffix = " " if i < len(words) - 1 else ""
            yield word + suffix
            if i % 3 == 0:
                await asyncio.sleep(0.02)
