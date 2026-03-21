/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

describe('useGateway shape', () => {
  it('exports useGateway function', async () => {
    const mod = await import('../useGateway');
    expect(typeof mod.useGateway).toBe('function');
  });
});
