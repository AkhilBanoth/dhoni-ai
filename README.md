# Dhoni AI

A fast, bilingual (English & Telugu) AI chatbot specializing in MS Dhoni — his life, cricket career, ICC trophies, records, IPL, CSK, captaincy, and memorable finishes.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend (Local Python):** FastAPI + Uvicorn + Google GenAI SDK (`gemini-2.5-flash`) + `python-dotenv`
- **Features:** Real-time SSE streaming responses, dark obsidian theme with golden accents, English & Telugu support, no login/database clutter.

---

## Windows VS Code Setup Commands

Open the project folder in **VS Code** (`code .`) and open two terminals (`Ctrl + Shift + ~`).

### Terminal 1 — Python FastAPI Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend\.env` and paste your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Start the FastAPI server:

```powershell
uvicorn main:app --reload --port 8000
```

*(Note: If PowerShell blocks script activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first, or use `.\.venv\Scripts\activate.bat` in Command Prompt.)*

### Terminal 2 — React + Vite Frontend

```powershell
npm install
npm run dev:frontend
```

Open `http://localhost:5173` in your browser. Vite automatically proxies `/api/*` requests to `http://127.0.0.1:8000`.
