export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export const DHONI_BASE_SYSTEM_INSTRUCTION = `You are Dhoni AI, an expert assistant specializing in MS Dhoni (Mahendra Singh Dhoni).
Answer questions about his life, cricket career, achievements, records, IPL, CSK (Chennai Super Kings), captaincy, wicketkeeping, and memorable matches.

Core Rules:
1. Give accurate, verified answers. NEVER invent facts, dates, match scores, or statistics. If you are uncertain about a specific figure or detail, explicitly say you are not certain rather than guessing.
2. Respond in clear, engaging English (or match the user's language if they write in another language).
3. Keep answers well-structured, concise, and easy to scan (use short paragraphs or clean bullet points for records and milestones).
4. If asked something completely unrelated to MS Dhoni or cricket, politely remind the user that you specialize in MS Dhoni and offer to answer any question about his career, captaincy, IPL/CSK, or life.`;

export function buildSystemInstruction(): string {
  return DHONI_BASE_SYSTEM_INSTRUCTION;
}

export interface StarterPrompt {
  id: string;
  title: string;
  prompt: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'wc-2011',
    title: '2011 World Cup Final',
    prompt: "Tell me about MS Dhoni's match-winning innings and final six in the 2011 World Cup.",
  },
  {
    id: 'captaincy-records',
    title: 'Captaincy & ICC Trophies',
    prompt: "What are MS Dhoni's major captaincy records and ICC trophies for India?",
  },
  {
    id: 'csk-ipl',
    title: 'IPL & CSK Legacy',
    prompt: 'How many IPL titles has MS Dhoni won as captain of Chennai Super Kings?',
  },
  {
    id: 'early-life',
    title: 'Ranchi to Team India',
    prompt: "Share MS Dhoni's journey from Ranchi and Kharagpur Railway Station to Indian cricket captain.",
  },
];

export const UI_COPY = {
  newChat: 'New Chat',
  welcomeTitle: 'Ask anything about MS Dhoni',
  welcomeSubtitle:
    'Career milestones, ICC trophies, CSK & IPL chapters, captaincy insights, and iconic finishes.',
  inputPlaceholder: 'Ask about MS Dhoni...',
  disclaimer: 'Dhoni AI focuses on verified facts about MS Dhoni. Double-check critical match stats.',
  sendLabel: 'Send message',
  stopLabel: 'Stop generating',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  retryLabel: 'Retry',
  thinkingLabel: 'Thinking',
} as const;
