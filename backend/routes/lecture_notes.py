from fastapi import APIRouter
from models import LectureNotesRequest
from services.gemini_client import ask_gemini

router = APIRouter()

@router.post("/lecture-notes")
async def generate_lecture_notes(request: LectureNotesRequest):
    system_instruction = (
        "You are an expert university professor and technical content generator. "
        "Your task is to write detailed, thorough lecture notes on the requested topic. "
        "Do not write brief or surface-level outlines. Notes must include clear definitions, "
        "conceptual explanations, worked examples (e.g. step-by-step algorithms or code fragments where applicable), "
        "and a transitional final sentence linking this lecture to the next logical concept. "
        "Format the output using clear, readable Markdown with standard headings."
    )
    
    # Constructing a prompt incorporating optional level and format parameters
    prompt_details = []
    if request.level:
        prompt_details.append(f"Student Level: {request.level}")
    if request.format:
        prompt_details.append(f"Format Preference: {request.format}")
        
    details_str = "\n".join(prompt_details)

    user_prompt = (
        f"Compose comprehensive academic lecture notes for the course: {request.course}.\n"
        f"Topic: {request.topic}\n"
        f"Depth constraint: {request.depth} (provide extremely thorough details if 'detailed' is specified).\n"
        f"{details_str}\n\n"
        "Ensure the notes contain:\n"
        "1. A comprehensive introduction to the concept.\n"
        "2. Core theoretical principles or architecture.\n"
        "3. Worked examples (such as concrete mathematical derivations or a Python code segment if it helps illustrate the concept).\n"
        "4. Common pitfalls or design tradeoffs.\n"
        "5. A concluding transition sentence linking this topic to what students should learn next."
    )

    result = await ask_gemini(
        system_instruction=system_instruction,
        user_prompt=user_prompt,
        response_mime_type="text/plain"
    )
    return result
