import { useEffect, useRef, useState } from 'react';
import { ChatComposer } from './components/ChatComposer';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { WelcomeScreen } from './components/WelcomeScreen';
import { type ChatMessage } from './shared/dhoniPrompt';
import { getChatStreamUrl, parseSseBuffer, sanitizeHistory } from './utils/chatHelpers';

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: isStreaming ? 'auto' : 'smooth',
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  function handleStop() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }

  function handleNewChat() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setMessages([]);
    setInput('');
  }

  async function streamReply(
    promptText: string,
    historySnapshot: ChatMessage[],
    assistantId: string
  ) {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch(getChatStreamUrl(import.meta.env.VITE_API_BASE_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: sanitizeHistory(historySnapshot),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetail = `Request failed (${response.status})`;
        try {
          const errJson = (await response.json()) as { detail?: string; error?: string };
          errorDetail = errJson.detail || errJson.error || errorDetail;
        } catch {
          // Use status fallback
        }
        throw new Error(errorDetail);
      }

      if (!response.body) {
        throw new Error('Streaming is not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseBuffer(sseBuffer);
        sseBuffer = remainder;

        for (const evt of events) {
          if (evt.error) {
            throw new Error(evt.error);
          }
          if (evt.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + evt.text } : m
              )
            );
          }
          if (evt.done) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              )
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
        return;
      }

      const errMessage =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to reach Dhoni AI. Please try again.';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: errMessage, isStreaming: false, isError: true }
            : m
        )
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
    }
  }

  async function sendMessage(rawText?: string) {
    const trimmed = (rawText ?? input).trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    };

    const assistantId = createId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    const historyBeforeSend = messages;
    setInput('');
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    await streamReply(trimmed, historyBeforeSend, assistantId);
  }

  async function handleRetry() {
    if (isStreaming || messages.length < 2) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualUserIndex = messages.length - 1 - lastUserIndex;
    const lastUserMsg = messages[actualUserIndex];
    const historyBeforeUser = messages.slice(0, actualUserIndex);
    const assistantId = createId();

    setMessages([
      ...messages.slice(0, actualUserIndex + 1),
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      },
    ]);

    await streamReply(lastUserMsg.content, historyBeforeUser, assistantId);
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#0B0C0E] text-[#F4F4F5]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0B0C0E]"
      >
        {!imgFailed && (
          <img
            src="/assets/aistudio/399585_1386832b.webp"
            alt="MS Dhoni in Chennai Super Kings yellow jersey at Wankhede Stadium"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-[center_22%] opacity-55 transition-opacity duration-300"
          />
        )}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            messages.length > 0
              ? 'bg-gradient-to-b from-[#0B0C0E]/82 via-[#0B0C0E]/76 to-[#0B0C0E]/92'
              : 'bg-gradient-to-b from-[#0B0C0E]/68 via-[#0B0C0E]/55 to-[#0B0C0E]/88'
          }`}
        />
      </div>

      <ChatHeader
        onNewChat={handleNewChat}
        hasMessages={messages.length > 0}
      />

      <main
        ref={scrollContainerRef}
        className="relative z-10 flex flex-1 flex-col overflow-y-auto"
      >
        {messages.length === 0 ? (
          <WelcomeScreen onSelectPrompt={(prompt) => sendMessage(prompt)} />
        ) : (
          <MessageList messages={messages} onRetry={handleRetry} />
        )}
      </main>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => sendMessage()}
        onStop={handleStop}
        isStreaming={isStreaming}
      />
    </div>
  );
}
