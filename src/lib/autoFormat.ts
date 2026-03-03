/**
 * Auto-detection and formatting of code blocks in plain text messages.
 * Wraps unformatted code/terminal output in fenced code blocks with language hints.
 */

/** Guess the programming language from a block of lines */
export function guessLanguage(lines: string[]): string {
  const joined = lines.join('\n');
  if (/^import .+ from ['"]/.test(joined) || /^export (function|const|default|class|interface|type) /.test(joined) || /React\./.test(joined) || /<\w+[\s/>]/.test(joined) && /className=/.test(joined)) return 'tsx';
  if (/^(import|export|const|let|var|function|class|interface|type) /.test(joined) || /=>\s*{/.test(joined) || /: (string|number|boolean|any)\b/.test(joined)) return 'typescript';
  if (/^(use |fn |let mut |pub |impl |struct |enum |mod |crate::)/.test(joined) || /-> (Self|Result|Option|Vec|String|bool|i32|u32)/.test(joined)) return 'rust';
  if (/^(def |class |import |from .+ import |if __name__)/.test(joined) || /self\.\w+/.test(joined) && !/this\./.test(joined)) return 'python';
  if (/^\s*(server|location|upstream|proxy_pass|listen \d)/.test(joined)) return 'nginx';
  if (/^\[.*\]\s*$/.test(lines[0] || '') && /=/.test(joined)) return 'ini';
  if (/^(apiVersion|kind|metadata|spec):/.test(joined)) return 'yaml';
  if (/^\{/.test(joined.trim()) && /\}$/.test(joined.trim())) return 'json';
  if (/^#!\/(bin|usr)/.test(joined) || /^\s*(if \[|then|fi|echo |export |source )/.test(joined)) return 'bash';
  if (/^(<!DOCTYPE|<html|<div|<head|<body)/.test(joined)) return 'html';
  if (/^\.\w+\s*\{|^@(media|keyframes|import)/.test(joined)) return 'css';
  if (/^(SELECT|INSERT|CREATE|ALTER|DROP|UPDATE) /i.test(joined)) return 'sql';
  return '';
}

/** Detect if a block of lines looks like code */
export function looksLikeCode(lines: string[]): boolean {
  if (lines.length < 2) return false;
  // If text contains markdown formatting, it's probably prose, not code
  const joined = lines.join('\n');
  if (/\*\*[^*]+\*\*/.test(joined) || /^#{1,6}\s/m.test(joined) || /^\s*[-*+]\s/m.test(joined)) return false;
  let codeSignals = 0;
  const patterns = [
    /^(import|export|const|let|var|function|class|interface|type|enum|struct|fn|pub|use|def|from|module|package|namespace)\s/,
    /[{};]\s*$/,
    /^\s*(if|else|for|while|return|match|switch|case|break|continue)\b/,
    /^\s*(\/\/|\/\*)/,
    /^\s*#\s*(?:include|define|ifdef|ifndef|endif|pragma|import)\b/,
    /[├└│┬─]──/,
    /^\s+\w+\(.*\)/,
    /^\s*<\/?[A-Z]\w*/,
    /=>\s*[{(]/,
    /\.\w+\(.*\)\s*[;,]?\s*$/,
  ];
  for (const line of lines) {
    for (const pat of patterns) {
      if (pat.test(line)) { codeSignals++; break; }
    }
  }
  return codeSignals / lines.length > 0.3;
}

/** Auto-wrap unformatted code/terminal output in fenced code blocks */
export function autoFormatText(text: string): string {
  // Already has code fences — leave as-is
  if (text.includes('```')) return text;

  const lines = text.split('\n');

  // If most of the text looks like code, wrap the whole thing
  const nonEmptyLines = lines.filter(l => l.trim());
  if (nonEmptyLines.length >= 3 && looksLikeCode(nonEmptyLines)) {
    const lang = guessLanguage(nonEmptyLines);
    return '```' + lang + '\n' + text + '\n```';
  }

  // Otherwise, detect contiguous code blocks within prose
  const result: string[] = [];
  let codeBuffer: string[] = [];

  const flushCode = () => {
    if (codeBuffer.length >= 3 && looksLikeCode(codeBuffer)) {
      const lang = guessLanguage(codeBuffer);
      result.push('```' + lang);
      result.push(...codeBuffer);
      result.push('```');
    } else {
      result.push(...codeBuffer);
    }
    codeBuffer = [];
  };

  const isCodeLine = (line: string): boolean => {
    return /^[\s]+(import|export|const|let|var|function|return|if|else|for)/.test(line)
      || /[{};]\s*$/.test(line)
      || /^\s*\/\//.test(line)
      || /[├└│┬─]──/.test(line)
      || /^\s+\w+\(.*\)/.test(line);
  };

  for (const line of lines) {
    if (isCodeLine(line) || (codeBuffer.length > 0 && (line.trim() === '' || /^\s{2,}/.test(line)))) {
      codeBuffer.push(line);
    } else {
      flushCode();
      result.push(line);
    }
  }
  flushCode();

  return result.join('\n');
}
