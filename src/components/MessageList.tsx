import { useState } from 'react';
import { AlertCircle, Check, Copy, RotateCcw } from 'lucide-react';
import { type ChatMessage, UI_COPY } from '../shared/dhoniPrompt';
import { DhoniEmblem } from './DhoniEmblem';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageListProps {
  messages: ChatMessage[];
  onRetry: () => void;
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = UI_COPY;

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1800);
    } catch {
      // Clipboard write unavailable
    }
  }

  return (
    <div
      data-testid="message-list"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
    >
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl border border-white/[0.08] bg-[#1C1F26] px-4 py-3 text-[15px] leading-relaxed text-[#F4F4F5] sm:max-w-[78%]">
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex items-start gap-3.5 sm:gap-4">
            <div className="mt-0.5 shrink-0">
              <DhoniEmblem size="sm" />
            </div>

            <div className="min-w-0 flex-1">
              {msg.isError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-950/25 p-4 text-sm text-red-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words leading-relaxed">{msg.content}</p>
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:bg-red-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{copy.retryLabel}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {msg.isStreaming && !msg.content ? (
                    <div
                      role="status"
                      aria-label={copy.thinkingLabel}
                      data-testid="response-skeleton"
                      className="space-y-2.5 py-1"
                    >
                      <span className="sr-only">{copy.thinkingLabel}</span>
                      <div className="skeleton-line h-3.5 w-[90%] rounded-md" />
                      <div className="skeleton-line h-3.5 w-[74%] rounded-md" />
                      <div className="skeleton-line h-3.5 w-[52%] rounded-md" />
                    </div>
                  ) : (
                    <MarkdownRenderer content={msg.content} isStreaming={msg.isStreaming} />
                  )}

                  {!msg.isStreaming && msg.content.trim().length > 0 && (
                    <div className="mt-2.5 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        aria-label={copiedId === msg.id ? copy.copiedLabel : copy.copyLabel}
                        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#71717A] transition-colors hover:bg-[#181A20] hover:text-[#E4E4E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/70"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden="true" />
                            <span className="text-[#FACC15]">{copy.copiedLabel}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{copy.copyLabel}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
