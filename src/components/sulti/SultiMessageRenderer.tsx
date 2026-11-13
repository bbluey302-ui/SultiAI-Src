import React, { useState } from 'react';
import { 
  Volume2, Copy, Check, ExternalLink, MapPin, Sparkles, 
  CheckCircle2, XCircle, Lightbulb, BookOpen, AlertTriangle, 
  RotateCcw, Code, Table as TableIcon 
} from 'lucide-react';
import { speakBisaya } from '../../utils/audio';
import { sounds } from '../../utils/soundEffects';

interface SultiMessageRendererProps {
  content: string;
  translation?: string;
  phoneticGuide?: string;
  role?: 'user' | 'assistant' | 'system';
  targetLanguage?: string;
  vocabularyBreakdown?: { term?: string; bisaya?: string; meaning?: string; english?: string; pos?: string }[];
  corrections?: {
    original?: string;
    improved?: string;
    explanation?: string;
    example?: string;
  };
  suggestedFollowUps?: string[];
  culturalTip?: string;
  groundingSources?: { title: string; uri: string }[];
  mapsLinks?: { title: string; uri: string }[];
  codeBlock?: { language: string; code: string };
  tableData?: { headers: string[]; rows: string[][] };
  onSelectSuggestion?: (text: string) => void;
  onRetry?: () => void;
  isError?: boolean;
  /** Long welcome/greeting copy can be collapsed to keep the first screen compact. */
  collapsible?: boolean;
}

export const SultiMessageRenderer: React.FC<SultiMessageRendererProps> = ({
  content,
  translation,
  phoneticGuide,
  role = 'assistant',
  targetLanguage = 'cebuano',
  vocabularyBreakdown,
  corrections,
  suggestedFollowUps,
  culturalTip,
  groundingSources,
  mapsLinks,
  codeBlock,
  tableData,
  onSelectSuggestion,
  onRetry,
  isError = false,
  collapsible = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const isCollapsible = collapsible && content.length > 260;
  const contentVisible = !isCollapsible || isExpanded;

  const handleCopy = (text: string, type: 'code' | 'table') => {
    sounds.playTap();
    navigator.clipboard?.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    }
  };

  const handleSpeak = async (textToSpeak: string) => {
    sounds.playTap();
    setIsPlayingAudio(true);
    await speakBisaya(textToSpeak, 0.88);
    setIsPlayingAudio(false);
  };

  // Helper parser for Markdown elements in text:
  // Extracts markdown tables if embedded in text
  const renderFormattedMarkdown = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const flushTable = (keyIdx: number) => {
      if (tableHeaders.length > 0) {
        const tableString = [
          tableHeaders.join(' | '),
          tableHeaders.map(() => '---').join(' | '),
          ...tableRows.map((r) => r.join(' | ')),
        ].join('\n');

        elements.push(
          <div key={`table-${keyIdx}`} className="my-2.5 w-full max-w-full overflow-hidden rounded-xl border border-line bg-elevated/50">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-elevated px-3 py-1.5 text-[11px] font-mono font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <TableIcon className="h-3.5 w-3.5 text-brand" />
                <span>Comparison table</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(tableString, 'table')}
                className="flex shrink-0 items-center gap-1 transition-colors hover:text-brand"
                title="Copy table as Markdown"
                aria-label="Copy table as Markdown"
              >
                {copiedTable ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copiedTable ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full text-left text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-surface">
                    {tableHeaders.map((th, hIdx) => (
                      <th key={hIdx} className="whitespace-nowrap border-b border-line p-2 font-bold text-ink">
                        {th.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="transition-colors hover:bg-brand-soft/60">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 align-top text-ink">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Table row detection (| col1 | col2 |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').map((s) => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
        // Skip separator row (|---|---|)
        if (cells.every((c) => /^[-:]+$/.test(c))) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable(i);
      }

      // Headings
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="mt-2.5 mb-1 text-[13px] font-bold font-display text-brand sm:text-sm">
            {parseInlineFormatting(line.replace('### ', ''))}
          </h4>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="mt-3 mb-1.5 text-sm font-extrabold font-display text-ink sm:text-[15px]">
            {parseInlineFormatting(line.replace('## ', ''))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={i} className="mt-3 mb-2 text-base font-black font-display text-ink sm:text-lg">
            {parseInlineFormatting(line.replace('# ', ''))}
          </h2>
        );
        continue;
      }

      // Blockquote (> ...)
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="my-1.5 rounded-r-lg border-l-2 border-brand bg-brand-soft py-1 pl-3 text-[13px] italic text-muted">
            {parseInlineFormatting(line.replace('> ', ''))}
          </blockquote>
        );
        continue;
      }

      // Unordered lists (- or *)
      if (/^[-*]\s+/.test(line)) {
        const text = line.replace(/^[-*]\s+/, '');
        elements.push(
          <div key={i} className="my-0.5 flex items-start gap-2 text-[13.5px] leading-relaxed text-ink">
            <span className="mt-0.5 shrink-0 font-bold text-brand" aria-hidden>•</span>
            <span className="min-w-0">{parseInlineFormatting(text)}</span>
          </div>
        );
        continue;
      }

      // Ordered lists (1. , 2. )
      if (/^\d+\.\s+/.test(line)) {
        const match = line.match(/^(\d+)\.\s+(.*)/);
        if (match) {
          elements.push(
            <div key={i} className="my-1 flex items-start gap-2 text-[13.5px] leading-relaxed text-ink">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-[10px] font-bold text-brand">
                {match[1]}
              </span>
              <span className="min-w-0">{parseInlineFormatting(match[2])}</span>
            </div>
          );
          continue;
        }
      }

      // Standard paragraph
      if (line.trim().length > 0) {
        elements.push(
          <p key={i} className="my-1.5 text-[13.5px] leading-relaxed text-ink sm:text-sm">
            {parseInlineFormatting(line)}
          </p>
        );
      }
    }

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  // Helper parser for inline **bold**, *italic* and `code`
  const parseInlineFormatting = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-ink">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={index}
            className="rounded bg-elevated px-1 py-0.5 font-mono text-[0.92em] text-ink"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={index} className="italic text-brand">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-2.5 min-w-0">
      {/* Primary Message Content */}
      <div className="min-w-0 text-[13.5px] leading-relaxed sm:text-sm">
        <div
          className={`relative min-w-0 ${
            contentVisible ? '' : 'max-h-[7.5rem] overflow-hidden'
          }`}
        >
          {renderFormattedMarkdown(content)}
          {!contentVisible && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent"
            />
          )}
        </div>
        {isCollapsible && (
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setIsExpanded((value) => !value);
            }}
            className="mt-1 text-[11px] font-semibold text-brand transition-colors hover:text-brand-strong"
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show less' : 'Read full introduction'}
          </button>
        )}
      </div>

      {/* Phonetic Pronunciation Guide */}
      {phoneticGuide && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11px] text-ink">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
              Phonetics
            </span>
            <span className="truncate font-mono italic">{phoneticGuide}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSpeak(content)}
            disabled={isPlayingAudio}
            className="shrink-0 rounded-lg p-1 text-brand transition-colors hover:bg-brand/10 active:scale-90 disabled:opacity-60"
            title="Listen to pronunciation"
            aria-label="Listen to pronunciation"
          >
            <Volume2 className={`h-3.5 w-3.5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      )}

      {/* English Explanation & Bisaya Translation */}
      {content && translation && (
        <div className="space-y-2 pt-2 border-t border-line bg-surface/50 pb-2">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-emerald-400">English Explanation</div>
              <p className="leading-relaxed">{content}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-xs">EN</span>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-1 text-[11px] leading-relaxed">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <span className="text-amber-400 font-bold text-xs">BIS</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-emerald-400">Bisaya Translation</div>
              <p className="leading-relaxed">{translation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Original English Translation Toggle (fallback) */}
      {translation && !content && (
        <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] italic text-muted">
          <div className="min-w-0 truncate">
            {showTranslation ? `"${translation}"` : 'Translation hidden'}
          </div>
          <button
            type="button"
            onClick={() => setShowTranslation(!showTranslation)}
            className="shrink-0 text-[10px] font-semibold text-brand hover:underline"
          >
            {showTranslation ? 'Hide' : 'Translate'}
          </button>
        </div>
      )}

      {/* Language Corrections Card */}
      {corrections && corrections.original && (
        <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-700/50 dark:bg-amber-950/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>Language correction &amp; better phrasing</span>
          </div>

          <div className="space-y-1.5 text-[12.5px]">
            <div className="flex items-start gap-1.5 text-rose-700 dark:text-rose-400">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold uppercase">Original: </span>
                <span className="break-words line-through">{corrections.original}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  Improved:{' '}
                </span>
                <span className="break-words font-bold">{corrections.improved}</span>
              </div>
            </div>

            {corrections.explanation && (
              <p className="mt-1 rounded-xl bg-surface/70 p-2 text-[11.5px] leading-relaxed text-ink">
                <span className="font-bold">Why: </span>
                {corrections.explanation}
              </p>
            )}

            {corrections.example && (
              <div className="pt-0.5 text-[11.5px] italic text-brand">
                Natural example: "{corrections.example}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vocabulary and Phrase Breakdown Cards */}
      {vocabularyBreakdown && vocabularyBreakdown.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand">
            <BookOpen className="h-3 w-3" />
            <span>Vocabulary &amp; phrasing</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {vocabularyBreakdown.map((item, idx) => {
              const term = item.term || item.bisaya || '';
              const meaning = item.meaning || item.english || '';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-elevated p-2 text-xs"
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1 truncate font-bold text-ink">
                      <span className="truncate">{term}</span>
                      {item.pos && (
                        <span className="shrink-0 rounded bg-surface px-1 font-mono text-[9px] text-muted">
                          {item.pos}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-muted">{meaning}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSpeak(term)}
                    className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:bg-surface hover:text-ink"
                    title={`Pronounce ${term}`}
                    aria-label={`Pronounce ${term}`}
                  >
                    <Volume2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cultural & Etiquette Tip */}
      {culturalTip && (
        <div className="flex items-start gap-2 rounded-xl border border-purple-200 bg-purple-50 p-2.5 text-[11.5px] text-purple-900 dark:border-purple-800/40 dark:bg-purple-950/30 dark:text-purple-200">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
          <div className="min-w-0 leading-snug">
            <span className="font-bold">Cultural tip: </span>
            {culturalTip}
          </div>
        </div>
      )}

      {/* Grounding Citations (Google Search & Google Maps) */}
      {(groundingSources && groundingSources.length > 0) || (mapsLinks && mapsLinks.length > 0) ? (
        <div className="space-y-1 pt-1">
          <div className="font-mono text-[10px] uppercase text-muted">Sources &amp; grounding</div>
          <div className="flex flex-wrap gap-1.5">
            {groundingSources?.map((source, sIdx) => (
              <a
                key={sIdx}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 rounded-lg border border-line bg-elevated px-2.5 py-1 font-mono text-[10px] text-brand transition-colors hover:border-brand"
              >
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                <span className="max-w-[140px] truncate">{source.title || 'Web citation'}</span>
              </a>
            ))}
            {mapsLinks?.map((map, mIdx) => (
              <a
                key={mIdx}
                href={map.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] text-emerald-700 transition-colors hover:border-emerald-500 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="max-w-[140px] truncate">{map.title || 'Location pin'}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* Structured Code Block (with copy button) */}
      {codeBlock && (
        <div className="my-2 max-w-full overflow-hidden rounded-xl border border-line bg-stone-900 font-mono text-xs text-stone-100">
          <div className="flex items-center justify-between border-b border-stone-700 bg-stone-800 px-3 py-1.5 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Code className="h-3 w-3 text-teal-400" />
              <span>{codeBlock.language || 'code'}</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopy(codeBlock.code, 'code')}
              className="flex items-center gap-1 transition-colors hover:text-white"
              aria-label="Copy code"
            >
              {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-teal-200">
            <code>{codeBlock.code}</code>
          </pre>
        </div>
      )}

      {/* Error state card with retry action */}
      {isError && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>Connection timeout or failed response.</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-1 text-xs font-bold text-white transition-all hover:bg-rose-500 active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Suggested follow-up replies (fallback when not rendered by the workspace) */}
      {suggestedFollowUps && suggestedFollowUps.length > 0 && onSelectSuggestion && (
        <div className="space-y-1.5 pt-2">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
            Suggested replies
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedFollowUps.map((suggestion, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onSelectSuggestion(suggestion);
                }}
                className="max-w-full rounded-xl border border-line bg-surface px-2.5 py-1.5 text-left text-xs leading-snug text-ink shadow-xs transition-all hover:border-brand/50 hover:bg-brand-soft active:scale-[0.98]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
