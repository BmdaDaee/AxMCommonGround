import os

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

from db import collection, serialize_many, utc_now

load_dotenv()

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MODEL_PROVIDER = "openai"
MODEL_NAME = "gpt-4.1-nano"


STATE_PROMPTS = {
    "ALIGNED": "The couple is connected. Reinforce what is working and name one steady next step.",
    "DORMANT": "The relationship feels safe but quiet. Distinguish rest from drift and suggest one gentle activation.",
    "MISALIGNED": "They are missing each other in meaning. Surface each person's likely need without blame.",
    "CAPACITY_BLOCKED": "One or both people are overloaded. Prioritize steadiness and recommend a smaller ask.",
    "TRUST_FRACTURED": "Trust is strained. Lead with care, clarity, and one observable repair action.",
}


def fallback_bently_response(message: str, state: str) -> str:
    guidance = {
        "ALIGNED": "Name what is already working before you ask for anything more.",
        "DORMANT": "Make the opening smaller and gentler than your first impulse.",
        "MISALIGNED": "Lead with your feeling and the meaning beneath it, not your argument.",
        "CAPACITY_BLOCKED": "Ask for one small concrete moment instead of a full emotional reset.",
        "TRUST_FRACTURED": "Keep the next step observable, specific, and repair-focused.",
    }
    return (
        f"What you’re naming matters. {guidance.get(state, guidance['DORMANT'])} "
        f"Try starting with: ‘When {message[:70].rstrip('.')}... I notice myself needing a little more clarity and closeness. Can we slow this down together?’"
    )


async def generate_bently_response(session_id: str, message: str, state: str, pair_summary: str) -> str:
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("Missing EMERGENT_LLM_KEY")

    previous_entries = list(
        collection("bently_entries")
        .find({"sessionId": session_id}, {"_id": 0})
        .sort("createdAt", -1)
        .limit(6)
    )
    previous_entries.reverse()
    history = serialize_many(previous_entries)
    transcript = "\n".join(
        f"{entry['author'].upper()}: {entry['content']}" for entry in history
    ) or "No prior context."

    system_message = (
        "You are Bently, a relationship mediator for couples. "
        "Be direct, warm, and observant. Never take sides. "
        "Keep responses under 110 words. Avoid bullet points. "
        f"Current relational state guidance: {STATE_PROMPTS.get(state, STATE_PROMPTS['DORMANT'])}"
    )

    prompt = (
        f"Context: {pair_summary}\n"
        f"History: {transcript[-900:]}\n"
        f"Message: {message}"
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)

    try:
        response = await chat.send_message(UserMessage(text=prompt))
    except Exception:
        response = fallback_bently_response(message, state)

    collection("bently_entries").insert_many(
        [
            {
                "sessionId": session_id,
                "author": "user",
                "content": message,
                "createdAt": utc_now(),
            },
            {
                "sessionId": session_id,
                "author": "bently",
                "content": response,
                "createdAt": utc_now(),
            },
        ]
    )

    return response