import json
from fastapi import APIRouter
from models import AssessmentCreatorRequest, AssessmentResponse
from services.gemini_client import ask_gemini

router = APIRouter()

@router.post("/assessment-creator")
async def create_assessment(request: AssessmentCreatorRequest):
    system_instruction = (
        "You are an expert examiner, professor, and educational assessment designer. "
        "Your task is to generate high-quality academic questions based on the requested unit/topic. "
        "Each question must have a number, question text, a designated Bloom's taxonomy level (e.g. 'Remember', "
        "'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'), marks allocated, a matching course outcome identifier, "
        "and a detailed explanation of the solution. "
        "You MUST adhere to these strict constraints:\n"
        "1. The sum of the 'marks' field across all generated questions MUST equal the requested 'total_marks' exactly.\n"
        "2. If question_type is 'MCQ', each question MUST include a list of exactly 4 string options, and 'correct_answer' "
        "must be one of these options. Do not make 'options' or 'correct_answer' null.\n"
        "3. If question_type is 'short_answer', 'options' and 'correct_answer' MUST be null/None in your JSON response.\n"
        "4. If question_type is 'mixed', you can return a combination of MCQ questions and short answer questions, setting "
        "options/correct_answer appropriately.\n"
        "5. Your response must conform to the requested JSON schema."
    )

    user_prompt = (
        f"Create an assessment for the unit: {request.unit}.\n"
        f"Total Marks: {request.total_marks}\n"
        f"Target Bloom's levels: {request.bloom_levels}\n"
        f"Question type: {request.question_type}\n"
        f"Number of questions to generate: {request.question_count}\n\n"
        "Ensure the questions are challenging, technically accurate, and provide real academic value."
    )

    result_str = await ask_gemini(
        system_instruction=system_instruction,
        user_prompt=user_prompt,
        response_mime_type="application/json",
        response_schema=AssessmentResponse
    )

    return json.loads(result_str)
