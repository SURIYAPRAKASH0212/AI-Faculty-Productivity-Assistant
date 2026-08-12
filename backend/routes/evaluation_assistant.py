import asyncio
import json
import logging
from fastapi import APIRouter
from models import EvaluationAssistantRequest, EvaluationResponse, EvaluationResult
from services.gemini_client import ask_gemini

router = APIRouter()
logger = logging.getLogger("evaluation_assistant")

async def evaluate_single_submission(rubric: str, student_id: str, answer_text: str) -> dict:
    """
    Evaluates a single student submission against a rubric using the Gemini API.
    Returns a dictionary matching the EvaluationResult schema.
    """
    system_instruction = (
        "You are an expert grading assistant and academic evaluator. "
        "Your task is to grade the student's submission based on the provided rubric. "
        "Analyze the submission thoroughly, award a fair score, state your grading confidence ('High', 'Medium', 'Low'), "
        "and provide 2-3 specific feedback sentences directly referencing the student's actual answer content. "
        "You must also list specific strengths, improvements, and a general encouraging summary comment. "
        "Crucial constraint: You MUST set the 'flag' field to a descriptive warning string whenever your confidence is "
        "'Medium' or 'Low' (describing the ambiguity, plagiarism risk, or evaluation difficulty). "
        "If confidence is 'High', 'flag' MUST be null/None. "
        "Your response must conform to the requested JSON schema."
    )

    user_prompt = (
        f"Rubric:\n{rubric}\n\n"
        f"Student ID: {student_id}\n"
        f"Student Submission:\n{answer_text}\n\n"
        "Evaluate the submission according to the rubric. Award score, evaluate confidence, write feedback referencing their work, "
        "identify strengths, identify improvements, add comments, and flag if necessary."
    )

    try:
        result_str = await ask_gemini(
            system_instruction=system_instruction,
            user_prompt=user_prompt,
            response_mime_type="application/json",
            response_schema=EvaluationResult
        )
        parsed = json.loads(result_str)
        # Ensure the student_id is set correctly
        parsed["student_id"] = student_id
        return parsed
    except Exception as e:
        logger.error(f"Error evaluating student {student_id}: {str(e)}")
        # Return a fallback error-state object to not fail the entire batch
        return {
            "student_id": student_id,
            "ai_score": 0,
            "confidence": "Low",
            "feedback": f"Failed to grade submission: {str(e)}",
            "flag": f"Evaluation error: {str(e)}",
            "strengths": [],
            "improvements": ["Please review code compilation manually."],
            "comments": "An error occurred during evaluation."
        }

@router.post("/evaluation-assistant")
async def evaluate_submissions(request: EvaluationAssistantRequest):
    # Run all evaluations concurrently using asyncio.gather
    tasks = [
        evaluate_single_submission(request.rubric, sub.student_id, sub.answer_text)
        for sub in request.submissions
    ]
    results = await asyncio.gather(*tasks)
    return {"results": results}
