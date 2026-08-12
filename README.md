# Faculty AI Assistant — AI-Integrated Academic Workflow

An advanced suite of AI-powered productivity tools designed for educators, professors, and academic administrators. Powered by **Google Gemini** (LLM), this application automates the generation of lesson plans, lecture notes, slide presentations, rubrics, assessments, and grade evaluations, complete with a real-time streaming AI chat assistant.

---

## 🌟 Key Features

1. **Lesson Planner**: Generates detailed lecture-by-lecture lesson schedules based on course targets, student level, and total hours.
2. **Lecture Notes**: Outlines comprehensive pedagogical notes in varying depths (brief or detailed) for any given academic topic.
3. **Presentation Builder**: Creates outline slide structures containing bullet points, titles, and speaker notes.
4. **Assessment Creator**: Generates customized academic exams or quizzes (MCQs, short answer, or coding questions) mapped to Bloom's Taxonomy levels and Course Outcomes (COs).
5. **Rubric Generator**: Builds custom evaluation tables for assignments, distributed by quality metrics (Excellent, Good, Fair, Poor) and target marks.
6. **Evaluation Assistant**: Analyzes and grades student answer sheets based on custom evaluation rubrics with detailed diagnostic feedback.
7. **AI Chat Assistant**: Provides a helpful conversational interface to answer academic pedagogy questions, brainstorm syllabus outlines, and plan exams.

---

## ⚙️ Architecture & Tech Stack

The application is structured as a decoupled monorepo:

### Backend (`/backend`)
- **FastAPI**: Asynchronous web framework for high-performance API endpoints.
- **google-generativeai**: Official Google Gemini SDK for advanced content generation and structured JSON outputs.
- **Python Dotenv**: Environment configuration manager.
- **Uvicorn**: ASGI server.
- **SQLite**: Local relational database for simple authentication and persistent storage.

### Frontend (`/frontend`)
- **React**: Component-based UI library.
- **Vite**: Rapid-build tool and development server.
- **Tailwind CSS**: Utility-first styling framework for rich visual aesthetics.
- **Lucide React**: Premium icon set.

---

## 🚀 Quick Start Guide

### 📦 Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Gemini API Key** (Obtain from [Google AI Studio](https://aistudio.google.com/))

---

### 1. Setup the Backend API

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your Gemini API credentials:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL_NAME=gemini-2.5-flash  # Recommend gemini-2.5-flash for speed, or gemini-2.5-pro for deep reasoning
   PORT=8000
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

The backend API will run on [http://localhost:8000](http://localhost:8000). You can access interactive OpenAPI docs at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 2. Setup the Frontend Client

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend client will run on [http://localhost:5173](http://localhost:5173).

---

## 📝 License

This project is open-source. Feel free to use, modify, and distribute it for academic or institutional purposes.
