interface DhoniEmblemProps {
  size?: 'sm' | 'lg';
}

export function DhoniEmblem({ size = 'sm' }: DhoniEmblemProps) {
  const dimensions = size === 'lg' ? 'w-14 h-14 text-2xl rounded-2xl' : 'w-8 h-8 text-sm rounded-lg';

  return (
    <div
      aria-hidden="true"
      className={`${dimensions} inline-flex items-center justify-center shrink-0 bg-[#181A20] border border-[#EAB308]/40 text-[#FACC15] font-semibold tracking-tight select-none`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      7
    </div>
  );
}
