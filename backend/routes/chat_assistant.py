import json
import logging
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import google.generativeai as genai
from models import ChatAssistantRequest
from services.gemini_client import GeminiRateLimitException, GeminiSafetyException, GeminiException

router = APIRouter()
logger = logging.getLogger("chat_assistant")

MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")

async def chat_stream_generator(request: ChatAssistantRequest):
    """
    Generator that starts a Gemini chat session with history and yields response tokens.
    """
    try:
        # Convert history format. Gemini expects 'user' or 'model' roles and content in 'parts'.
        # Frontend might send role as 'assistant', which we map to 'model'.
        history_converted = []
        for msg in request.conversation_history:
            role = "model" if msg.role in ("assistant", "model") else "user"
            history_converted.append({
                "role": role,
                "parts": [msg.content]
            })

        system_instruction = (
            "You are an expert university pedagogical advisor and helpful academic assistant. "
            "Provide detailed, structured, well-reasoned, and polite conversational answers. "
            "Use Markdown headings, formatting, bullet points, numbered lists, or code blocks "
            "where they enhance readability and clarity. Do not write short or clipped replies."
        )

        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction
        )

        # Initialize Gemini Chat
        chat = model.start_chat(history=history_converted)

        logger.info(f"Starting chat stream for message: {request.message}")
        
        # Send message with streaming enabled
        response = await chat.send_message_async(request.message, stream=True)
        
        async for chunk in response:
            if chunk.text:
                # Wrap token in JSON to handle newlines and special characters cleanly in SSE
                payload = json.dumps({"token": chunk.text})
                yield f"data: {payload}\n\n"

    except Exception as e:
        logger.error(f"Error in chat stream: {str(e)}")
        # Check specific Gemini exceptions and yield structured error messages
        err_msg = str(e)
        if "429" in err_msg or "rate limit" in err_msg.lower():
            err_payload = json.dumps({"error": "Please retry in a moment."})
        elif "safety" in err_msg.lower() or "blocked" in err_msg.lower():
            err_payload = json.dumps({"error": "Content was flagged, please rephrase."})
        else:
            err_payload = json.dumps({"error": f"AI failure: {err_msg}"})
            
        yield f"data: {err_payload}\n\n"

@router.post("/chat-assistant")
async def chat_assistant(request: ChatAssistantRequest):
    return StreamingResponse(
        chat_stream_generator(request),
        media_type="text/event-stream"
    )
