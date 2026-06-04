import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

// Pre-process raw LaTeX formulas, braces and code containers to beautiful Unicode symbols
const preprocessMathText = (input: string): string => {
  if (!input) return "";
  
  let result = input;
  
  // 1. Block LaTeX wrappers \\[ ... \\] and $$ ... $$ -> clean text block
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, " $1 ");
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, " $1 ");
  
  // 2. Inline LaTeX wrappers \\( ... \\), $ ... $ -> clean inline text
  result = result.replace(/\\\\\(([\s\S]*?)\\\\\)/g, " $1 ");
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, " $1 ");
  result = result.replace(/\$([\s\S]*?)\$/g, " $1 ");
  
  // 3. Translation of various raw LaTeX symbols & structures into clean screen-readable Unicode
  const translations: { regex: RegExp; replacement: string }[] = [
    // Fractions \frac{a}{b} -> (a)/(b)
    { regex: /\\frac\s*\{\s*([^{}]+?)\s*\}\s*\{\s*([^{}]+?)\s*\}/g, replacement: "($1)/($2)" },
    // Square root \sqrt{a} -> √(a)
    { regex: /\\sqrt\s*\{\s*([^{}]+?)\s*\}/g, replacement: "√($1)" },
    // Common exponents
    { regex: /\^\{\s*2\s*\}/g, replacement: "²" },
    { regex: /\^\{\s*3\s*\}/g, replacement: "³" },
    { regex: /\^2/g, replacement: "²" },
    { regex: /\^3/g, replacement: "³" },
    { regex: /\^\{\s*([^{}]+?)\s*\}/g, replacement: "^($1)" },
    
    // Basic scientific commands
    { regex: /\\times/g, replacement: " × " },
    { regex: /\\div/g, replacement: " ÷ " },
    { regex: /\\pm/g, replacement: " ± " },
    { regex: /\\ne/g, replacement: " ≠ " },
    { regex: /\\le/g, replacement: " ≤ " },
    { regex: /\\ge/g, replacement: " ≥ " },
    { regex: /\\propto/g, replacement: " ∝ " },
    { regex: /\\approx/g, replacement: " ≈ " },
    { regex: /\\infty/g, replacement: " ∞ " },
    { regex: /\\degree/g, replacement: "°" },
    { regex: /\\circ/g, replacement: "°" },
    
    // Greek alphabet
    { regex: /\\pi/g, replacement: "π" },
    { regex: /\\theta/g, replacement: "θ" },
    { regex: /\\alpha/g, replacement: "α" },
    { regex: /\\beta/g, replacement: "β" },
    { regex: /\\delta/g, replacement: "δ" },
    { regex: /\\Delta/g, replacement: "Δ" },
    { regex: /\\sigma/g, replacement: "σ" },
    { regex: /\\lambda/g, replacement: "λ" },
    { regex: /\\mu/g, replacement: "μ" },
    { regex: /\\phi/g, replacement: "φ" },
    { regex: /\\omega/g, replacement: "ω" },
    
    // Layout and spacing cleans
    { regex: /\\bold/g, replacement: "" },
    { regex: /\\mathrm/g, replacement: "" },
    { regex: /\\text/g, replacement: "" },
    { regex: /\\qquad/g, replacement: "   " },
    { regex: /\\quad/g, replacement: "  " },
  ];
  
  translations.forEach(({ regex, replacement }) => {
    // Run multiple passes for nested structures (e.g. nested fractions)
    result = result.replace(regex, replacement);
    result = result.replace(regex, replacement);
  });
  
  // Final clean up of multiple spaces or orphaned bracket symbols
  result = result.replace(/\\\{/g, "{").replace(/\\\}/g, "}");
  
  return result;
};

export default function MarkdownRenderer({ text }: MarkdownRendererProps) {
  if (!text) return null;

  // Clean raw math expressions and symbols to look pristine
  const cleanedText = preprocessMathText(text);
  const lines = cleanedText.split('\n');

  // Inline styling parser: parses **, *, ` into colored/styled React elements
  const parseInlineStyles = (content: string): React.ReactNode[] => {
    // Regex to tokenise by **, * or `
    const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = content.split(tokenRegex);

    return tokens.map((token, idx) => {
      // Bold **text**
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      }
      // Italic *text*
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={idx} className="italic text-slate-300">
            {token.slice(1, -1)}
          </em>
        );
      }
      // Monospace `code`
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 mx-0.5 font-mono text-[10px] sm:text-xs text-brand-light bg-brand/10 border border-brand/20 rounded-md">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  return (
    <div className="space-y-2 font-sans text-slate-300 leading-relaxed text-[11px] sm:text-xs">
      {lines.map((line, lineIdx) => {
        let trimmed = line.trim();

        // 1. Ignore completely empty lines (or render as spacer)
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // 2. Headings: #, ##, ###, ####
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 key={lineIdx} className="text-xs sm:text-sm font-black text-white mt-3 mb-1.5 tracking-tight uppercase">
              {parseInlineStyles(trimmed.slice(5))}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lineIdx} className="text-sm sm:text-base font-black text-brand-light mt-4 mb-2 tracking-tight">
              {parseInlineStyles(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lineIdx} className="text-base sm:text-lg font-black text-white mt-5 mb-2.5 tracking-tight">
              {parseInlineStyles(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={lineIdx} className="text-lg sm:text-xl font-black text-white mt-6 mb-3 tracking-tight">
              {parseInlineStyles(trimmed.slice(2))}
            </h2>
          );
        }

        // 3. Bullet list items: - or * or •
        const bulletMatch = trimmed.match(/^([-*•])\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-1">
              <span className="text-brand shrink-0 text-xs mt-0.5">•</span>
              <p className="flex-1 text-[11px] sm:text-xs text-slate-300 leading-normal">
                {parseInlineStyles(bulletMatch[2])}
              </p>
            </div>
          );
        }

        // 4. Numbered list items: 1. or 2. etc.
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-1">
              <span className="text-brand-light font-black text-[10px] sm:text-xs shrink-0 mt-0.5">
                {numberedMatch[1]}.
              </span>
              <p className="flex-1 text-[11px] sm:text-xs text-slate-300 leading-normal">
                {parseInlineStyles(numberedMatch[2])}
              </p>
            </div>
          );
        }

        // 5. Blockquote / highlight lines starting with >
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={lineIdx} className="border-l-2 border-brand/50 pl-3 py-1 my-2 bg-brand/5 rounded-r-xl italic text-slate-400 font-sans text-[11px] sm:text-xs">
              {parseInlineStyles(trimmed.slice(2))}
            </blockquote>
          );
        }

        // 6. Normal text paragraph
        return (
          <p key={lineIdx} className="text-[11px] sm:text-xs leading-relaxed text-slate-300">
            {parseInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}
