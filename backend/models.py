from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# --- LESSON PLANNER MODELS ---
class LessonPlannerRequest(BaseModel):
    course: str
    topic: str
    duration: str
    level: str

# --- LECTURE NOTES MODELS ---
class LectureNotesRequest(BaseModel):
    course: str
    topic: str
    depth: Literal["brief", "detailed"]
    level: Optional[str] = None
    format: Optional[str] = None

# --- PRESENTATION BUILDER MODELS ---
class PresentationBuilderRequest(BaseModel):
    topic: str
    num_slides: int
    audience: str
    style: Optional[str] = None

# Structured response schemas for Gemini
class Slide(BaseModel):
    slide_no: int
    title: str
    bullet_points: List[str]
    speaker_notes: str

class PresentationResponse(BaseModel):
    slides: List[Slide]

# --- ASSESSMENT CREATOR MODELS ---
class AssessmentCreatorRequest(BaseModel):
    unit: str
    total_marks: int
    bloom_levels: str
    question_type: Literal["MCQ", "short_answer", "mixed"]
    question_count: Optional[int] = 3

class Question(BaseModel):
    q_no: int
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    bloom_level: str
    marks: int
    course_outcome: str
    explanation: Optional[str] = None

class AssessmentResponse(BaseModel):
    questions: List[Question]

# --- RUBRIC GENERATOR MODELS ---
class RubricGeneratorRequest(BaseModel):
    assignment_title: str
    total_marks: int
    criteria_count: int
    criteria_list: Optional[List[str]] = None

class RubricCriterion(BaseModel):
    criterion: str
    description: str
    excellent: str
    good: str
    fair: str
    poor: str

class RubricResponse(BaseModel):
    criteria: List[RubricCriterion]

# --- EVALUATION ASSISTANT MODELS ---
class Submission(BaseModel):
    student_id: str
    answer_text: str

class EvaluationAssistantRequest(BaseModel):
    rubric: str
    submissions: List[Submission]

class EvaluationResult(BaseModel):
    student_id: str
    ai_score: int
    confidence: Literal["High", "Medium", "Low"]
    feedback: str
    flag: Optional[str] = None
    strengths: List[str]
    improvements: List[str]
    comments: str

class EvaluationResponse(BaseModel):
    results: List[EvaluationResult]

# --- CHAT ASSISTANT MODELS ---
class ChatMessage(BaseModel):
    role: Literal["user", "model", "assistant"]
    content: str

class ChatAssistantRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage]

# --- AUTHENTICATION MODELS ---
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Full Name of the user")
    email: str = Field(..., description="Academic Email Address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    department: str = Field("AIML", description="Academic Department")

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Registered Email")
    password: str = Field(..., description="Password")

