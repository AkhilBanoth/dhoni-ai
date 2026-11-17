import { ArrowUpRight } from 'lucide-react';
import { STARTER_PROMPTS, UI_COPY } from '../shared/dhoniPrompt';
import { DhoniEmblem } from './DhoniEmblem';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-5">
        <DhoniEmblem size="lg" />
      </div>

      <h1
        className="text-center text-2xl font-semibold tracking-tight text-[#F4F4F5] sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
      >
        {UI_COPY.welcomeTitle}
      </h1>

      <p className="mt-3 max-w-xl text-center text-sm leading-relaxed text-[#A1A1AA] sm:text-[15px]">
        {UI_COPY.welcomeSubtitle}
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {STARTER_PROMPTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex min-h-[84px] flex-col justify-between rounded-xl border border-white/[0.1] bg-[#14161A]/85 p-4 text-left backdrop-blur-sm transition-colors hover:border-[#EAB308]/55 hover:bg-[#191C22]/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/70"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[#FACC15]">{item.title}</span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-[#71717A] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#EAB308]"
                aria-hidden="true"
              />
            </div>
            <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#A1A1AA]">
              {item.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
