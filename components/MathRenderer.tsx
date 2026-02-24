"use client";

import { useMemo } from "react";
import katex from "katex";

// Render text that may contain inline LaTeX ($...$) and display LaTeX ($$...$$)
export default function MathRenderer({ text, className = "" }: { text: string; className?: string }) {
  const html = useMemo(() => renderMathInText(text), [text]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderMathInText(text: string): string {
  // Split on $$...$$ (display) and $...$ (inline)
  // Process display math first, then inline
  let result = text;

  // Display math: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<code>${tex}</code>`;
    }
  });

  // Inline math: $...$  (but not $$)
  result = result.replace(/(?<!\$)\$(?!\$)(.*?)\$(?!\$)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<code>${tex}</code>`;
    }
  });

  // Color highlights: [[highlight]]text[[/highlight]]
  result = result.replace(
    /\[\[highlight\]\](.*?)\[\[\/highlight\]\]/g,
    '<span class="bg-yellow-200 text-yellow-900 px-1 rounded font-semibold">$1</span>'
  );

  // Green highlights for new results: [[green]]text[[/green]]
  result = result.replace(
    /\[\[green\]\](.*?)\[\[\/green\]\]/g,
    '<span class="bg-green-200 text-green-900 px-1 rounded font-semibold">$1</span>'
  );

  return result;
}

// SVG Diagram renderer
export function DiagramRenderer({ svg, caption }: { svg: string; caption?: string }) {
  // Sanitize: only allow SVG content
  if (!svg.includes("<svg")) return null;

  return (
    <div className="my-3 flex flex-col items-center">
      <div
        className="bg-white rounded-xl p-3 border border-violet-100 inline-block max-w-full overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && (
        <p className="text-xs text-gray-500 mt-1 italic">{caption}</p>
      )}
    </div>
  );
}
