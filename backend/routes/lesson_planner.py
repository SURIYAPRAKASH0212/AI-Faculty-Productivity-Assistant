from fastapi import APIRouter, HTTPException
from models import LessonPlannerRequest
from services.gemini_client import ask_gemini

router = APIRouter()

@router.post("/lesson-planner")
async def generate_lesson_plan(request: LessonPlannerRequest):
    system_instruction = (
        "You are an expert pedagogical assistant and academic curriculum designer. "
        "Your task is to generate high-quality, comprehensive, and detailed lesson plans. "
        "Every lesson plan you write must be thorough and structured. Do not use simple placeholders "
        "or one-line summaries. Provide fully explained objectives, step-by-step activities with realistic details, "
        "recommended teaching methodologies, and a clear description of a formative assessment/exit ticket. "
        "Format the response using clear Markdown with headings, subheadings, and bold text."
    )
    
    user_prompt = (
        f"Generate a comprehensive lesson plan for the course: {request.course}.\n"
        f"Topic: {request.topic}\n"
        f"Class Duration: {request.duration}\n"
        f"Student Difficulty Level/Focus: {request.level}\n\n"
        "The lesson plan must contain:\n"
        "1. Clear, measurable learning objectives (Bloom's Taxonomy aligned).\n"
        "2. Necessary pre-requisites for the students.\n"
        "3. A detailed timeline agenda, detailing exactly how the time should be spent (e.g. Warm-up, Direct Instruction, Guided Practice, Exit Ticket).\n"
        "4. Specific teaching method suggestions for the instructor.\n"
        "5. A detailed formative assessment or exit ticket prompt, with the exact wording the instructor can use."
    )

    result = await ask_gemini(
        system_instruction=system_instruction,
        user_prompt=user_prompt,
        response_mime_type="text/plain"
    )
    return result
