import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from routes import (
    lesson_planner,
    lecture_notes,
    presentation_builder,
    assessment_creator,
    rubric_generator,
    evaluation_assistant,
    chat_assistant,
    auth
)
import database
from services.gemini_client import GeminiException, GeminiRateLimitException, GeminiSafetyException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="Faculty AI Assistant API",
    description="Backend API powered by Google Gemini for generating academic artifacts.",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    database.init_db()

# Enable CORS for local dev (allow http://localhost:*)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_origin_regex="http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(lesson_planner.router, tags=["Lesson Planner"])
app.include_router(lecture_notes.router, tags=["Lecture Notes"])
app.include_router(presentation_builder.router, tags=["Presentation Builder"])
app.include_router(assessment_creator.router, tags=["Assessment Creator"])
app.include_router(rubric_generator.router, tags=["Rubric Generator"])
app.include_router(evaluation_assistant.router, tags=["Evaluation Assistant"])
app.include_router(chat_assistant.router, tags=["AI Chat Assistant"])

# --- EXCEPTION HANDLERS ---

@app.exception_handler(GeminiRateLimitException)
async def rate_limit_exception_handler(request, exc: GeminiRateLimitException):
    logger.error(f"Rate limit exception triggered: {str(exc)}")
    return JSONResponse(
        status_code=429,
        content={"error": "Please retry in a moment."}
    )

@app.exception_handler(GeminiSafetyException)
async def safety_exception_handler(request, exc: GeminiSafetyException):
    logger.error(f"Safety exception triggered: {str(exc)}")
    # Return 502 with safety block message as per guidelines
    return JSONResponse(
        status_code=502,
        content={"error": "Content was flagged, please rephrase"}
    )

@app.exception_handler(GeminiException)
async def gemini_general_exception_handler(request, exc: GeminiException):
    logger.error(f"Gemini client exception triggered: {str(exc)}")
    return JSONResponse(
        status_code=502,
        content={"error": f"AI failure: {str(exc)}"}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    logger.error(f"Validation error: {str(exc)}")
    errors = exc.errors()
    msg = errors[0]["msg"] if errors else "Invalid parameters"
    loc = " -> ".join(str(l) for l in errors[0]["loc"]) if errors else ""
    return JSONResponse(
        status_code=422,
        content={"error": f"Bad input ({loc}): {msg}"}
    )

@app.exception_handler(Exception)
async def general_system_exception_handler(request, exc: Exception):
    logger.error(f"Unhandled system error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=502,
        content={"error": f"Internal server error: {str(exc)}"}
    )

@app.get("/")
async def root():
    return {"message": "Faculty AI Assistant Backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
