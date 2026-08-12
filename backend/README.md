# Faculty AI Assistant - Backend API

This is the Python + FastAPI backend for the Faculty AI Assistant workflow suite. It integrates the Google Gemini API to generate real, live pedagogical content (lesson plans, lecture notes, slides, quizzes, rubrics, concurrent grading, and real-time streaming chat).

## Tech Stack
- **FastAPI**: Modern, fast web framework.
- **google-generativeai**: Official Google Gemini Python SDK.
- **python-dotenv**: Environment variable management.
- **uvicorn**: ASGI server for running the app.

---

## Getting Started

### 1. Get a Gemini API Key
To use the AI tools, you need a Gemini API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account.
3. Click on **Create API Key**.
4. Copy the generated key.

### 2. Configure Environment Variables
1. Copy the template env file:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and insert your key:
   ```env
   GEMINI_API_KEY=your_copied_api_key_here
   GEMINI_MODEL_NAME=gemini-2.5-flash
   PORT=8000
   ```
   *Note: `gemini-2.5-flash` is used for ultra-fast, real-time responses. You can swap this to `gemini-2.5-pro` for deeper reasoning if quality needs outweigh speed.*

### 3. Installation & Run

#### Backend Setup
Make sure you have python (>= 3.9) installed.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will now be running on [http://localhost:8000](http://localhost:8000). You can inspect the interactive documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

#### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the React local development server:
   ```bash
   npm run dev
   ```
   Open the application in your browser (usually [http://localhost:5173](http://localhost:5173)).
