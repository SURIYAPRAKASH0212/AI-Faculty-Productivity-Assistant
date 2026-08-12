import json
from fastapi import APIRouter
from models import PresentationBuilderRequest, PresentationResponse
from services.gemini_client import ask_gemini

router = APIRouter()

@router.post("/presentation-builder")
async def generate_presentation(request: PresentationBuilderRequest):
    system_instruction = (
        "You are an expert slides designer and presenter. "
        "Create highly engaging slide deck structures based on the user topic. "
        "For each slide, you must specify a slide number, a descriptive title, "
        "a few bullet points summing up key highlights, and detailed speaker notes. "
        "The speaker notes must be a fully written, thorough explanatory paragraph (3-4 sentences) "
        "meant for the presenter to explain the slide concepts in detail. The speaker notes must NOT "
        "simply duplicate or restate the bullet points in prose. "
        "Your response must conform to the requested JSON schema."
    )
    
    style_info = f"Theme/Style Preference: {request.style}" if request.style else ""
    
    user_prompt = (
        f"Generate a slide deck structure on the topic: {request.topic}.\n"
        f"Number of Slides requested: {request.num_slides}\n"
        f"Target Audience: {request.audience}\n"
        f"{style_info}\n\n"
        "Draft a structured sequence of slides that logically flows through introduction, "
        "core concepts, technical breakdowns/examples, and conclusions. Make each slide's content "
        "specific, educational, and robust."
    )

    result_str = await ask_gemini(
        system_instruction=system_instruction,
        user_prompt=user_prompt,
        response_mime_type="application/json",
        response_schema=PresentationResponse
    )
    
    return json.loads(result_str)
