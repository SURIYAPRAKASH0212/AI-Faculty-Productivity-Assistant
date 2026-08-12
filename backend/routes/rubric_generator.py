import json
from fastapi import APIRouter
from models import RubricGeneratorRequest, RubricResponse
from services.gemini_client import ask_gemini

router = APIRouter()

@router.post("/rubric-generator")
async def generate_rubric(request: RubricGeneratorRequest):
    system_instruction = (
        "You are an academic quality assurance lead and grading expert. "
        "Your task is to generate clear, objective grading rubrics. "
        "Each criterion in the rubric must have a descriptive criterion name (e.g. 'Functionality', 'Clean Code'), "
        "a brief description of what the criterion measures, and detailed, gradeable, objective descriptors for 4 bands:\n"
        "- excellent: Describes outstanding work demonstrating complete mastery.\n"
        "- good: Describes proficient work with minor gaps but meeting all core requirements.\n"
        "- fair: Describes developing work that is partially complete or has notable flaws.\n"
        "- poor: Describes work showing critical deficits or failing to address basic expectations.\n\n"
        "Crucial requirement: Avoid vague descriptors like 'good effort' or 'satisfactory output'. Every description "
        "must be specific and gradeable (e.g. 'Code compiles successfully with no warning flags and passes all test inputs'). "
        "Your response must conform to the requested JSON schema."
    )

    criteria_hint = ""
    if request.criteria_list:
        criteria_hint = f"Focus the rubric on these specific criteria: {', '.join(request.criteria_list)}"
    
    user_prompt = (
        f"Generate a grading rubric for the assignment: {request.assignment_title}.\n"
        f"Total points allocation: {request.total_marks}\n"
        f"Number of criteria rows: {request.criteria_count}\n"
        f"{criteria_hint}\n\n"
        "Ensure the generated criteria cover the core requirements of this type of work."
    )

    result_str = await ask_gemini(
        system_instruction=system_instruction,
        user_prompt=user_prompt,
        response_mime_type="application/json",
        response_schema=RubricResponse
    )

    return json.loads(result_str)
