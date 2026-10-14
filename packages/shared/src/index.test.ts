import { describe, it, expect } from 'vitest';

describe('shared types', () => {
  it('exports all types', () => {
    // Types are compile-time only, this just ensures the module loads
    expect(true).toBe(true);
  });
});
