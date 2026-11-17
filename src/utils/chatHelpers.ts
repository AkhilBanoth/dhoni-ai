export interface ApiHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface SseEvent {
  text?: string;
  done?: boolean;
  error?: string;
}

/**
 * Parses an incremental SSE text buffer into complete JSON events and a remaining partial buffer.
 */
export function parseSseBuffer(buffer: string): { events: SseEvent[]; remainder: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const frames = normalized.split('\n\n');
  const remainder = frames.pop() ?? '';
  const events: SseEvent[] = [];

  for (const frame of frames) {
    const lines = frame.split('\n');
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length === 0) continue;

    const payload = dataLines.join('\n').trim();
    if (!payload) continue;

    try {
      const parsed = JSON.parse(payload) as SseEvent;
      events.push(parsed);
    } catch {
      // Ignore malformed SSE JSON frames safely
    }
  }

  return { events, remainder };
}

/**
 * Sanitizes conversation history sent to the backend so only valid non-empty user/assistant turns remain.
 */
export function sanitizeHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string; isError?: boolean }>,
  maxTurns = 16
): ApiHistoryItem[] {
  const cleaned: ApiHistoryItem[] = [];
  for (const msg of messages) {
    if (msg.isError) continue;
    const content = msg.content.trim();
    if (!content) continue;
    cleaned.push({ role: msg.role, content });
  }
  return cleaned.slice(-maxTurns);
}

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const cells = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|');
  return cells.length > 0 && cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c));
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * Parses a subset of Markdown into structured blocks for crisp, safe rendering.
 */
export function parseMarkdownBlocks(input: string): MarkdownBlock[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Headings (#, ##, ###)
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
      i += 1;
      continue;
    }

    // Markdown table (header + separator + rows)
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list (1. 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (
        !cur ||
        cur.startsWith('```') ||
        /^(#{1,3})\s+/.test(cur) ||
        /^[-*]\s+/.test(cur) ||
        /^\d+\.\s+/.test(cur) ||
        (cur.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
      ) {
        break;
      }
      paraLines.push(cur);
      i += 1;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return blocks;
}

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string };

/**
 * Tokenizes inline markdown (**bold**, *italic*, `code`) safely without HTML injection.
 */
export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', value: raw.slice(1, -1) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) });
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Resolves the streaming chat API URL using an optional VITE_API_BASE_URL (e.g. Render backend URL on Vercel).
 */
export function getChatStreamUrl(baseUrl?: string): string {
  const trimmed = (baseUrl ?? '').trim().replace(/\/+$/, '');
  return trimmed ? `${trimmed}/api/chat/stream` : '/api/chat/stream';
}
