# Dhoni AI

A fast AI chatbot specializing in MS Dhoni — his life, cricket career, ICC trophies, records, IPL, CSK, captaincy, and memorable finishes.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (deployable to **Vercel**)
- **Backend:** Python FastAPI + Uvicorn + Google GenAI SDK (`gemini-2.5-flash`) + `python-dotenv` (deployable to **Render**)
- **Features:** Real-time SSE streaming responses, dark obsidian theme with golden accents, skeleton loading state, no login/database clutter.

---

## Deploy to Render (Backend) & Vercel (Frontend)

### Step 1 — Deploy Python FastAPI Backend on Render

1. Push your project to GitHub.
2. Open [Render](https://render.com) → **New +** → **Web Service** (or **Blueprint** using `render.yaml`).
3. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`
4. Add **Environment Variables** in Render:
   - `GEMINI_API_KEY` = your Google Gemini API key
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `ALLOWED_ORIGIN_REGEX` = `https://.*\.vercel\.app` (or set `ALLOWED_ORIGINS` to your exact Vercel URL if using a custom domain)
5. Deploy and copy your Render URL (for example, `https://dhoni-ai-backend.onrender.com`).

### Step 2 — Deploy React + Vite Frontend on Vercel

1. Open [Vercel](https://vercel.com) → **Add New...** → **Project** → import your GitHub repository.
2. Keep the root directory as `./` (Vercel reads `vercel.json` automatically):
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add **Environment Variable** in Vercel:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g., `https://dhoni-ai-backend.onrender.com`, no trailing slash)
4. Click **Deploy**.

---

## Windows VS Code Local Setup Commands

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
