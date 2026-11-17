import { Fragment } from 'react';
import { parseInlineTokens, parseMarkdownBlocks } from '../utils/chatHelpers';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function renderInline(text: string) {
  const tokens = parseInlineTokens(text);
  return tokens.map((token, idx) => {
    if (token.type === 'bold') {
      return (
        <strong key={idx} className="font-semibold text-[#FAFAFA]">
          {token.value}
        </strong>
      );
    }
    if (token.type === 'italic') {
      return (
        <em key={idx} className="italic text-[#E4E4E7]">
          {token.value}
        </em>
      );
    }
    if (token.type === 'code') {
      return (
        <code
          key={idx}
          className="rounded bg-[#1F2229] px-1.5 py-0.5 text-[13px] text-[#FDE047]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {token.value}
        </code>
      );
    }
    return <Fragment key={idx}>{token.value}</Fragment>;
  });
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const blocks = parseMarkdownBlocks(content);

  if (blocks.length === 0 && isStreaming) {
    return <span className="streaming-caret" aria-hidden="true" />;
  }

  return (
    <div className="space-y-3 text-[15px] leading-[1.7] tracking-[0.005em] text-[#E4E4E7]">
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1;

        if (block.type === 'heading') {
          const sizeClass =
            block.level === 1
              ? 'text-lg font-semibold text-[#FAFAFA] mt-4'
              : block.level === 2
              ? 'text-base font-semibold text-[#FAFAFA] mt-3'
              : 'text-[15px] font-semibold text-[#FACC15] mt-2';

          return (
            <h3 key={index} className={sizeClass} style={{ fontFamily: 'var(--font-display)' }}>
              {renderInline(block.text)}
              {isLast && isStreaming && <span className="streaming-caret" aria-hidden="true" />}
            </h3>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p key={index} className="break-words">
              {renderInline(block.text)}
              {isLast && isStreaming && <span className="streaming-caret" aria-hidden="true" />}
            </p>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5 marker:text-[#EAB308]">
              {block.items.map((item, itemIdx) => {
                const isLastItem = isLast && itemIdx === block.items.length - 1;
                return (
                  <li key={itemIdx} className="break-words">
                    {renderInline(item)}
                    {isLastItem && isStreaming && (
                      <span className="streaming-caret" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={index} className="list-decimal space-y-1.5 pl-5 marker:text-[#EAB308]">
              {block.items.map((item, itemIdx) => {
                const isLastItem = isLast && itemIdx === block.items.length - 1;
                return (
                  <li key={itemIdx} className="break-words">
                    {renderInline(item)}
                    {isLastItem && isStreaming && (
                      <span className="streaming-caret" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#111317] p-3.5 text-xs leading-relaxed text-[#E4E4E7]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === 'table') {
          return (
            <div
              key={index}
              className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#121418]"
            >
              <table className="w-full border-collapse text-left text-xs sm:text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#181B21]">
                    {block.headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 font-semibold text-[#FACC15]">
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-white/[0.05] last:border-b-0"
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-[#D4D4D8]">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
