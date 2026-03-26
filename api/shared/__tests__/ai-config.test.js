import { describe, it, expect } from 'vitest';
import { AI_MODEL, ANALYZE_SYSTEM_PROMPT, NL_SEARCH_SYSTEM_PROMPT } from '../ai-config.js';

describe('ai-config', () => {
  it('exports ANALYZE_SYSTEM_PROMPT as a non-empty string', () => {
    expect(typeof ANALYZE_SYSTEM_PROMPT).toBe('string');
    expect(ANALYZE_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(ANALYZE_SYSTEM_PROMPT).toContain('economic data analyst');
  });

  it('exports NL_SEARCH_SYSTEM_PROMPT as a non-empty string', () => {
    expect(typeof NL_SEARCH_SYSTEM_PROMPT).toBe('string');
    expect(NL_SEARCH_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    expect(NL_SEARCH_SYSTEM_PROMPT).toContain('FRED');
    expect(NL_SEARCH_SYSTEM_PROMPT).toContain('searchTerms');
  });

  it('ANALYZE_SYSTEM_PROMPT includes the accessibility clause', () => {
    expect(ANALYZE_SYSTEM_PROMPT).toContain('imagine explaining to someone with basic economic knowledge');
  });

  it('AI_MODEL has a default value', () => {
    expect(typeof AI_MODEL).toBe('string');
    expect(AI_MODEL.length).toBeGreaterThan(0);
  });

  it('NL_SEARCH_SYSTEM_PROMPT requires JSON response format', () => {
    expect(NL_SEARCH_SYSTEM_PROMPT).toContain('valid JSON only');
  });

  it('ANALYZE_SYSTEM_PROMPT covers all 5 analysis points', () => {
    expect(ANALYZE_SYSTEM_PROMPT).toContain('What this indicator measures');
    expect(ANALYZE_SYSTEM_PROMPT).toContain('overall trend');
    expect(ANALYZE_SYSTEM_PROMPT).toContain('Notable patterns');
    expect(ANALYZE_SYSTEM_PROMPT).toContain('Recent behavior');
    expect(ANALYZE_SYSTEM_PROMPT).toContain('broader economy');
  });
});
