import { useEffect, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { UI_COPY } from '../shared/dhoniPrompt';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const copy = UI_COPY;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim().length > 0) {
        onSubmit();
      }
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }
    if (value.trim().length > 0) {
      onSubmit();
    }
  }

  const canSend = value.trim().length > 0;

  return (
    <div className="relative z-10 shrink-0 border-t border-white/[0.06] bg-[#0B0C0E]/75 px-4 pb-4 pt-3 backdrop-blur-md sm:px-6">
      <form
        onSubmit={handleFormSubmit}
        className="mx-auto flex w-full max-w-3xl items-end gap-2.5 rounded-2xl border border-white/[0.12] bg-[#14161A]/90 p-2 transition-colors focus-within:border-[#EAB308]/60"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={copy.inputPlaceholder}
          aria-label={copy.inputPlaceholder}
          className="max-h-[168px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-[#F4F4F5] placeholder-[#71717A] focus:outline-none sm:text-[15px]"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={copy.stopLabel}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#272A33] text-[#FACC15] transition-colors hover:bg-[#323642] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label={copy.sendLabel}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAB308] text-[#0B0C0E] transition-colors hover:bg-[#FACC15] disabled:cursor-not-allowed disabled:bg-[#23262E] disabled:text-[#71717A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]"
          >
            <ArrowUp className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
          </button>
        )}
      </form>

      <p className="mx-auto mt-2 max-w-3xl text-center text-[12px] text-[#71717A]">
        {copy.disclaimer}
      </p>
    </div>
  );
}
