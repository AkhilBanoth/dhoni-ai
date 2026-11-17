import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, type Content } from '@google/genai';
import { buildSystemInstruction } from './src/shared/dhoniPrompt.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_CANDIDATES = [
  { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
] as const;

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message?: string;
  history?: ChatHistoryItem[];
}

function formatApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return 'Gemini is temporarily busy. Please try again in a moment.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached. Please wait a few seconds and try again.';
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return 'Invalid or missing Gemini API key. Please check your environment configuration.';
  }
  return raw && raw.length < 220 ? raw : 'Failed to generate response from Gemini.';
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
}

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  cachedClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return cachedClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', model: MODEL_CANDIDATES[0].model });
  });

  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as ChatRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is missing. Please configure it in the server environment.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    const contents: Content[] = [];
    for (const item of history.slice(-16)) {
      if (!item || typeof item.content !== 'string' || !item.content.trim()) continue;
      contents.push({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content.trim() }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let closed = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        closed = true;
      }
    });

    const systemInstruction = buildSystemInstruction();
    let emittedAnyChunk = false;
    let lastError: unknown = null;

    for (const candidate of MODEL_CANDIDATES) {
      if (closed) break;
      try {
        const responseStream = await ai.models.generateContentStream({
          model: candidate.model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: candidate.thinkingLevel,
            },
          },
        });

        for await (const chunk of responseStream) {
          if (closed) break;
          const text = chunk.text;
          if (text) {
            emittedAnyChunk = true;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (emittedAnyChunk || !isTransientError(err)) {
          break;
        }
      }
    }

    if (!closed) {
      if (lastError) {
        res.write(`data: ${JSON.stringify({ error: formatApiError(lastError) })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      res.end();
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dhoni AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Dhoni AI server:', err);
  process.exit(1);
});
