import { SquarePen } from 'lucide-react';
import { UI_COPY } from '../shared/dhoniPrompt';
import { DhoniEmblem } from './DhoniEmblem';

interface ChatHeaderProps {
  onNewChat: () => void;
  hasMessages: boolean;
}

export function ChatHeader({ onNewChat, hasMessages }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-white/[0.08] bg-[#0B0C0E]/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 shrink-0">
          <DhoniEmblem size="sm" />
          <span
            className="text-lg font-semibold tracking-tight text-[#F4F4F5] whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Dhoni AI
          </span>
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewChat}
            disabled={!hasMessages}
            aria-label={UI_COPY.newChat}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/[0.1] bg-[#14161A] px-3.5 py-2 text-xs font-medium text-[#F4F4F5] transition-colors hover:border-[#EAB308]/50 hover:bg-[#1B1E24] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/70"
          >
            <SquarePen className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden="true" />
            <span>{UI_COPY.newChat}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
