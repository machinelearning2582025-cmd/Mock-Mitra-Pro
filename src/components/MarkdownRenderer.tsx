import React from 'react';

interface MarkdownRendererProps {
  text: string;
  isUser?: boolean;
  className?: string;
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
    result = result.replace(regex, replacement);
    result = result.replace(regex, replacement);
  });
  
  // Final clean up of multiple spaces or orphaned bracket symbols
  result = result.replace(/\\\{/g, "{").replace(/\\\}/g, "}");
  
  return result;
};

export default function MarkdownRenderer({ text, isUser = false, className = '' }: MarkdownRendererProps) {
  if (!text) return null;

  // Clean raw math expressions and symbols to look pristine
  const cleanedText = preprocessMathText(text);
  const lines = cleanedText.split('\n');

  // Inline styling parser: parses **, *, ` into colored/styled React elements
  const parseInlineStyles = (content: string): React.ReactNode[] => {
    const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = content.split(tokenRegex);

    return tokens.map((token, idx) => {
      // Bold **text**
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong 
            key={idx} 
            className={`font-bold ${isUser ? 'text-white' : 'text-slate-950 dark:text-white'}`}
          >
            {token.slice(2, -2)}
          </strong>
        );
      }
      // Italic *text*
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em 
            key={idx} 
            className={`italic ${isUser ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}`}
          >
            {token.slice(1, -1)}
          </em>
        );
      }
      // Monospace `code`
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code 
            key={idx} 
            className={`px-1.5 py-0.5 mx-0.5 font-mono text-[10px] sm:text-xs rounded-md ${
              isUser 
                ? 'bg-white/20 text-white border border-white/30' 
                : 'text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/20 border border-brand/20 dark:border-brand/30'
            }`}
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  const containerClasses = isUser
    ? `space-y-1.5 font-sans text-white leading-relaxed text-[11px] sm:text-xs ${className}`
    : `space-y-2 font-sans text-slate-800 dark:text-slate-200 leading-relaxed text-[11px] sm:text-xs ${className}`;

  return (
    <div className={containerClasses}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Ignore completely empty lines (render as small spacer)
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // 2. Headings: #, ##, ###, ####
        if (trimmed.startsWith('#### ')) {
          return (
            <h5 
              key={lineIdx} 
              className={`text-xs sm:text-sm font-black mt-3 mb-1.5 tracking-tight uppercase ${
                isUser ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              {parseInlineStyles(trimmed.slice(5))}
            </h5>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 
              key={lineIdx} 
              className={`text-sm sm:text-base font-black mt-3.5 mb-2 tracking-tight ${
                isUser ? 'text-white' : 'text-brand dark:text-brand-light'
              }`}
            >
              {parseInlineStyles(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 
              key={lineIdx} 
              className={`text-base sm:text-lg font-black mt-4 mb-2 tracking-tight ${
                isUser ? 'text-white' : 'text-brand dark:text-brand-light'
              }`}
            >
              {parseInlineStyles(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 
              key={lineIdx} 
              className={`text-lg sm:text-xl font-black mt-5 mb-2.5 tracking-tight ${
                isUser ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              {parseInlineStyles(trimmed.slice(2))}
            </h2>
          );
        }

        // 3. Bullet list items: - or * or •
        const bulletMatch = trimmed.match(/^([-*•])\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 my-1">
              <span className={`shrink-0 text-xs mt-0.5 ${isUser ? 'text-white/80' : 'text-brand dark:text-brand-light font-bold'}`}>•</span>
              <p className={`flex-1 text-[11px] sm:text-xs leading-normal ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                {parseInlineStyles(bulletMatch[2])}
              </p>
            </div>
          );
        }

        // 4. Numbered list items: 1. or 2. etc.
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-0.5 my-1">
              <span className={`font-black text-[10px] sm:text-xs shrink-0 mt-0.5 ${
                isUser ? 'text-white' : 'text-brand dark:text-brand-light'
              }`}>
                {numberedMatch[1]}.
              </span>
              <p className={`flex-1 text-[11px] sm:text-xs leading-normal ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                {parseInlineStyles(numberedMatch[2])}
              </p>
            </div>
          );
        }

        // 5. Blockquote / highlight lines starting with >
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote 
              key={lineIdx} 
              className={`border-l-2 pl-3 py-1 my-2 rounded-r-xl italic font-sans text-[11px] sm:text-xs ${
                isUser 
                  ? 'border-white/50 bg-white/10 text-white/90' 
                  : 'border-brand/50 bg-brand/5 dark:bg-brand/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              {parseInlineStyles(trimmed.slice(2))}
            </blockquote>
          );
        }

        // 6. Normal text paragraph
        return (
          <p 
            key={lineIdx} 
            className={`text-[11px] sm:text-xs leading-relaxed ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}
          >
            {parseInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}
