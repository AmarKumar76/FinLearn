import React from 'react';

/**
 * Safely parses inline markdown (bold **text**, italic *text*, inline code `code`)
 * into React elements without dangerous HTML injection.
 */
function renderInlineMarkdown(text) {
  if (!text) return null;

  // Regex to match **bold**, *italic*, `code`
  // We use capture groups to split and preserve tokens
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-aubergine">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-aubergine/95">
          {inner}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-ivory-dark border border-brass/20 text-xs font-mono text-terracotta"
        >
          {inner}
        </code>
      );
    }

    return part;
  });
}

/**
 * Safe, complete Markdown Renderer for FinLearn educational lesson content.
 * Handles headings (h1, h2, h3, h4), ordered and unordered lists, nested list items,
 * bold/italic emphasis, blockquotes, and spacing safely with React elements.
 */
export function MarkdownRenderer({ content, className = '' }) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Split into structural blocks separated by one or more blank lines
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-5 ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headings: ####, ###, ##, #
        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={bIdx}
              className="font-sans text-base font-bold text-aubergine pt-3 text-terracotta"
            >
              {renderInlineMarkdown(trimmed.replace(/^####\s+/, ''))}
            </h4>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={bIdx}
              className="font-sans text-xl font-bold text-aubergine pt-4 pb-1 border-b border-brass/15"
            >
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={bIdx}
              className="font-sans text-2xl font-black text-aubergine pt-6 pb-2"
            >
              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={bIdx}
              className="font-sans text-3xl font-black text-aubergine pt-6 pb-2"
            >
              {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        // Blockquotes: lines starting with >
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((line) => line.replace(/^>\s?/, ''))
            .join(' ');
          return (
            <blockquote
              key={bIdx}
              className="pl-4 py-2 border-l-4 border-terracotta bg-terracotta/5 rounded-r-xl italic text-aubergine/90 text-sm sm:text-base my-3"
            >
              {renderInlineMarkdown(quoteLines)}
            </blockquote>
          );
        }

        // Ordered list: starts with number followed by . (e.g. "1. ")
        const lines = trimmed.split('\n');
        const isOrderedList = lines.some((l) => /^\s*\d+\.\s+/.test(l));
        const isUnorderedList = lines.some((l) => /^\s*[-*]\s+/.test(l));

        if (isOrderedList && !lines[0].startsWith('###') && !lines[0].startsWith('##')) {
          // Render ordered list with potential sub-bullets
          return (
            <ol key={bIdx} className="list-decimal pl-6 space-y-2 text-base font-sans">
              {lines.map((line, lIdx) => {
                const isSubItem = /^\s+[-*]\s+/.test(line);
                const isMainOrdered = /^\s*\d+\.\s+/.test(line);

                if (isSubItem) {
                  const cleaned = line.replace(/^\s+[-*]\s+/, '');
                  return (
                    <li key={lIdx} className="list-disc ml-5 mt-1 text-sm text-aubergine/80 leading-relaxed">
                      {renderInlineMarkdown(cleaned)}
                    </li>
                  );
                }

                if (isMainOrdered) {
                  const cleaned = line.replace(/^\s*\d+\.\s+/, '');
                  return (
                    <li key={lIdx} className="leading-relaxed text-aubergine/90">
                      {renderInlineMarkdown(cleaned)}
                    </li>
                  );
                }

                if (line.trim()) {
                  return (
                    <p key={lIdx} className="text-sm text-aubergine/80 ml-1">
                      {renderInlineMarkdown(line.trim())}
                    </p>
                  );
                }

                return null;
              })}
            </ol>
          );
        }

        if (isUnorderedList && !lines[0].startsWith('###') && !lines[0].startsWith('##')) {
          return (
            <ul key={bIdx} className="list-disc pl-6 space-y-2 text-base font-sans">
              {lines.map((line, lIdx) => {
                const isSubItem = /^\s{2,}[-*]\s+/.test(line);
                const isItem = /^\s*[-*]\s+/.test(line);

                if (isSubItem) {
                  const cleaned = line.replace(/^\s+[-*]\s+/, '');
                  return (
                    <li key={lIdx} className="list-circle ml-5 text-sm text-aubergine/80 leading-relaxed">
                      {renderInlineMarkdown(cleaned)}
                    </li>
                  );
                }

                if (isItem) {
                  const cleaned = line.replace(/^\s*[-*]\s+/, '');
                  return (
                    <li key={lIdx} className="leading-relaxed text-aubergine/90">
                      {renderInlineMarkdown(cleaned)}
                    </li>
                  );
                }

                if (line.trim()) {
                  return (
                    <p key={lIdx} className="text-sm text-aubergine/80 ml-1">
                      {renderInlineMarkdown(line.trim())}
                    </p>
                  );
                }

                return null;
              })}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p
            key={bIdx}
            className="leading-8 text-aubergine/90 font-serif text-base sm:text-lg selection:bg-terracotta/20"
          >
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default MarkdownRenderer;
