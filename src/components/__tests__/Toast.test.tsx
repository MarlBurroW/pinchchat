/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('renders success message with correct text', () => {
    render(<Toast message="Link copied!" type="success" />);
    expect(screen.getByText('Link copied!')).toBeDefined();
  });

  it('renders warning message with correct text', () => {
    render(<Toast message="Session not found" type="warning" />);
    expect(screen.getByText('Session not found')).toBeDefined();
  });

  it('applies emerald color class for success type', () => {
    const { container } = render(<Toast message="ok" type="success" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('emerald');
  });

  it('applies amber color class for warning type', () => {
    const { container } = render(<Toast message="warn" type="warning" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('amber');
  });
});
