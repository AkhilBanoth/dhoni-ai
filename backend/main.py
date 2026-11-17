import json
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-4-hydrogen", "gemini-3.1-flash-lite"]
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv(
    "ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app"
).strip() or None

DHONI_SYSTEM_INSTRUCTION = """You are Dhoni AI, an expert assistant specializing in MS Dhoni (Mahendra Singh Dhoni).
Answer questions about his life, cricket career, achievements, records, IPL, CSK (Chennai Super Kings), captaincy, wicketkeeping, and memorable matches.

Core Rules:
1. Give accurate, verified answers. NEVER invent facts, dates, match scores, or statistics. If you are uncertain about a specific figure or detail, explicitly say you are not certain rather than guessing.
2. Respond in clear, engaging English (or match the user's language if they write in another language).
3. Keep answers well-structured, concise, and easy to scan (use short paragraphs or clean bullet points for records and milestones).
4. If asked something completely unrelated to MS Dhoni or cricket, politely remind the user that you specialize in MS Dhoni and offer to answer any question about his career, captaincy, IPL/CSK, or life."""

app = FastAPI(title="Dhoni AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=8000)


class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[HistoryMessage] = Field(default_factory=list)


_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "Dhoni AI API"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "model": GEMINI_MODEL}


@app.post("/api/chat/stream")
def chat_stream(payload: ChatStreamRequest) -> StreamingResponse:
    if not GEMINI_API_KEY or _client is None:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in backend/.env.",
        )

    client = _client

    contents: list[types.Content] = []
    for item in payload.history[-16:]:
        role = "user" if item.role == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=item.content)])
        )
    contents.append(
        types.Content(
            role="user", parts=[types.Part.from_text(text=payload.message.strip())]
        )
    )

    config = types.GenerateContentConfig(
        system_instruction=DHONI_SYSTEM_INSTRUCTION,
    )

    candidates = list(dict.fromkeys([GEMINI_MODEL, *FALLBACK_MODELS]))

    def event_generator():
        emitted_any_chunk = False
        last_error: Exception | None = None

        for model_name in candidates:
            try:
                stream = client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                for chunk in stream:
                    text = getattr(chunk, "text", None)
                    if text:
                        emitted_any_chunk = True
                        yield f"data: {json.dumps({'text': text})}\n\n"
                last_error = None
                break
            except Exception as exc:
                last_error = exc
                err_str = str(exc)
                retryable = any(
                    code in err_str
                    for code in ("404", "NOT_FOUND", "503", "UNAVAILABLE", "429")
                )
                if emitted_any_chunk or not retryable:
                    break

        if last_error is not None:
            error_message = str(last_error) or "Failed to generate response from Gemini."
            yield f"data: {json.dumps({'error': error_message})}\n\n"
        else:
            yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
