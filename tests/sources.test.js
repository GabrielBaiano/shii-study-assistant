import { describe, it, expect } from 'vitest';
import { buildSources } from '../utils/sources.js';

describe('buildSources', () => {
  it('includes static first and then user sites', () => {
    const staticSources = [{ label: 'Gemini', source: 'file:///gemini.html' }];
    const user = ['https://a.com', 'https://b.com'];
    const out = buildSources(staticSources, user, 'file:///placeholder.html');
    expect(out[0].label).toBe('Gemini');
    expect(out[1].source).toBe('https://a.com');
    expect(out[2].source).toBe('https://b.com');
  });

  it('falls back to placeholder when everything is empty', () => {
    const out = buildSources([], [], 'file:///placeholder.html');
    expect(out).toHaveLength(1);
    expect(out[0].source).toContain('placeholder.html');
  });
});


