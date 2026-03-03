import { describe, it, expect } from 'vitest';
import { guessLanguage, looksLikeCode, autoFormatText } from '../autoFormat';

describe('guessLanguage', () => {
  it('detects TypeScript/TSX', () => {
    expect(guessLanguage(['import React from "react"', 'export default App'])).toBe('tsx');
  });

  it('detects TypeScript', () => {
    expect(guessLanguage(['const x: string = "hello"', 'export function foo() {}'])).toBe('typescript');
  });

  it('detects Rust', () => {
    expect(guessLanguage(['fn main() {', '  println!("hello");', '}'])).toBe('rust');
  });

  it('detects Python', () => {
    expect(guessLanguage(['def hello():', '  print("world")'])).toBe('python');
  });

  it('detects YAML', () => {
    expect(guessLanguage(['apiVersion: v1', 'kind: Service', 'metadata:', '  name: foo'])).toBe('yaml');
  });

  it('detects JSON', () => {
    expect(guessLanguage(['{ "key": "value" }'])).toBe('json');
  });

  it('detects bash', () => {
    expect(guessLanguage(['#!/bin/bash', 'echo "hello"'])).toBe('bash');
  });

  it('detects HTML', () => {
    expect(guessLanguage(['<!DOCTYPE html>', '<html>', '<body></body>'])).toBe('html');
  });

  it('detects CSS', () => {
    expect(guessLanguage(['.container {', '  display: flex;', '}'])).toBe('css');
  });

  it('detects SQL', () => {
    expect(guessLanguage(['SELECT * FROM users', 'WHERE id = 1'])).toBe('sql');
  });

  it('detects nginx', () => {
    expect(guessLanguage(['server {', '  listen 80;', '  location / {'])).toBe('nginx');
  });

  it('detects INI', () => {
    expect(guessLanguage(['[section]', 'key=value'])).toBe('ini');
  });

  it('returns empty string for plain text', () => {
    expect(guessLanguage(['Hello world', 'This is just text'])).toBe('');
  });
});

describe('looksLikeCode', () => {
  it('returns false for single line', () => {
    expect(looksLikeCode(['one line'])).toBe(false);
  });

  it('returns true for code-like lines', () => {
    expect(looksLikeCode([
      'import React from "react";',
      'const App = () => {',
      '  return <div />;',
      '};',
    ])).toBe(true);
  });

  it('returns false for markdown prose', () => {
    expect(looksLikeCode([
      '# Hello',
      'This is **bold** text',
      '- item one',
      '- item two',
    ])).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(looksLikeCode([
      'Just a normal paragraph.',
      'Nothing special here.',
      'Move along.',
    ])).toBe(false);
  });

  it('detects tree output as code', () => {
    expect(looksLikeCode([
      '├── src/',
      '│   ├── index.ts',
      '│   └── utils.ts',
      '└── package.json',
    ])).toBe(true);
  });
});

describe('autoFormatText', () => {
  it('returns text unchanged if it already has code fences', () => {
    const text = 'Here is code:\n```js\nconsole.log("hi")\n```';
    expect(autoFormatText(text)).toBe(text);
  });

  it('wraps a full code block', () => {
    const code = 'import foo from "bar";\nconst x = 1;\nexport default x;';
    const result = autoFormatText(code);
    expect(result).toContain('```');
    expect(result).toContain('import foo from "bar"');
  });

  it('leaves plain text unchanged', () => {
    const text = 'Hello world.\nThis is a normal message.';
    expect(autoFormatText(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(autoFormatText('')).toBe('');
  });

  it('handles single line', () => {
    const text = 'Just one line';
    expect(autoFormatText(text)).toBe(text);
  });
});
