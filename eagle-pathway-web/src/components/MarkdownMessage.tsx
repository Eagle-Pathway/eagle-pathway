'use client';

import React from 'react';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

// Inline formatting: bold, italics, code, links, <br>
function renderInline(text: string, isUser: boolean): React.ReactNode[] {
  // Normalize <br> or <br/> tags
  const parts = text.split(/(<br\s*\/?>|\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/gi);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Handle line breaks
    if (/^<br\s*\/?>$/i.test(part)) {
      return <br key={idx} />;
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}
        >
          {inner}
        </strong>
      );
    }

    // Italics: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className={isUser ? 'text-white/90 italic' : 'text-slate-700 italic'}>
          {inner}
        </em>
      );
    }

    // Inline code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
            isUser ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-800'
          }`}
        >
          {inner}
        </code>
      );
    }

    // Links: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a
          key={idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline font-medium ${
            isUser ? 'text-white hover:opacity-80' : 'text-brand-blue hover:text-brand-blue/80'
          }`}
        >
          {label}
        </a>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

// Parse markdown table rows
function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;
}

function isSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!isTableLine(trimmed)) return false;
  // Match lines like |---|:---:|---|
  const inner = trimmed.slice(1, -1);
  return inner.split('|').every((cell) => /^[\s:-]+$/.test(cell));
}

function parseTableBlock(lines: string[], isUser: boolean, key: number) {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const bodyLines = lines.slice(1).filter((l) => !isSeparatorLine(l));

  const headerCells = headerLine
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());

  return (
    <div key={key} className="overflow-x-auto my-3 rounded-xl border border-slate-200/90 shadow-2xs bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80">
            {headerCells.map((h, i) => (
              <th
                key={i}
                className="py-2.5 px-3.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider whitespace-nowrap"
              >
                {renderInline(h, false)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bodyLines.map((rowLine, rowIdx) => {
            const cells = rowLine
              .trim()
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());

            return (
              <tr key={rowIdx} className="hover:bg-slate-50/60 transition-colors">
                {cells.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="py-2.5 px-3.5 text-slate-700 text-xs align-top leading-relaxed"
                  >
                    {renderInline(cell, false)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
  if (!content) return null;

  // Split content into lines for block-level processing
  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  let elementKey = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Table Detection
    if (isTableLine(trimmed)) {
      const tableLines: string[] = [];
      while (i < rawLines.length && isTableLine(rawLines[i].trim())) {
        tableLines.push(rawLines[i]);
        i++;
      }
      const tableElem = parseTableBlock(tableLines, isUser, elementKey++);
      if (tableElem) {
        elements.push(tableElem);
      }
      continue;
    }

    // 2. Horizontal Rule: --- or ***
    if (/^(---|---|\*\*\*)$/.test(trimmed)) {
      elements.push(
        <hr
          key={elementKey++}
          className={`my-3.5 border-t ${isUser ? 'border-white/30' : 'border-slate-200'}`}
        />
      );
      i++;
      continue;
    }

    // 3. Headings: #, ##, ###
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const text = trimmed.replace(/^#+\s*/, '');

      if (level === 1) {
        elements.push(
          <h2
            key={elementKey++}
            className={`text-sm font-bold tracking-tight mt-3 mb-1.5 ${
              isUser ? 'text-white' : 'text-slate-900'
            }`}
          >
            {renderInline(text, isUser)}
          </h2>
        );
      } else if (level === 2) {
        elements.push(
          <h3
            key={elementKey++}
            className={`text-xs font-bold tracking-tight mt-3 mb-1.5 flex items-center gap-1.5 ${
              isUser ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span className="w-1 h-3 rounded-full bg-brand-gold flex-shrink-0" />
            <span>{renderInline(text, isUser)}</span>
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={elementKey++}
            className={`text-xs font-semibold mt-2.5 mb-1 ${
              isUser ? 'text-white/90' : 'text-slate-800'
            }`}
          >
            {renderInline(text, isUser)}
          </h4>
        );
      }
      i++;
      continue;
    }

    // 4. Blockquotes: > text
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={elementKey++}
          className={`my-2 pl-3 py-1 border-l-2 text-xs italic ${
            isUser
              ? 'border-white/60 bg-white/10 text-white/90 rounded-r'
              : 'border-brand-gold bg-amber-50/60 text-slate-700 rounded-r'
          }`}
        >
          {renderInline(text, isUser)}
        </blockquote>
      );
      i++;
      continue;
    }

    // 5. Unordered Lists: - item or * item
    if (/^[-*•]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^[-*•]\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }

      elements.push(
        <ul key={elementKey++} className="space-y-1 my-1.5 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  isUser ? 'bg-white' : 'bg-brand-blue'
                }`}
              />
              <span className="flex-1">{renderInline(item, isUser)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered Lists: 1. item
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
        listItems.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }

      elements.push(
        <ol key={elementKey++} className="space-y-1 my-1.5 pl-1 list-decimal list-inside">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-xs leading-relaxed">
              <span className="ml-1">{renderInline(item, isUser)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Regular paragraph / empty line
    if (!trimmed) {
      // Empty line adds natural spacing
      elements.push(<div key={elementKey++} className="h-1.5" />);
      i++;
      continue;
    }

    elements.push(
      <p key={elementKey++} className="text-xs leading-relaxed">
        {renderInline(trimmed, isUser)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1 text-xs leading-relaxed">{elements}</div>;
}
