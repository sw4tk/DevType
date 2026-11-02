import { describe, it, expect } from 'vitest';
import {
  classifyCharError,
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateSyntaxAccuracy,
  calculateConsistencyAndJitter,
  KeystrokeData,
} from '../src/lib/stats';

describe('src/lib/stats pure calculations', () => {
  it('handles 0 keystrokes edge case safely', () => {
    expect(calculateWpm(0, 0)).toBe(0);
    expect(calculateRawWpm(0, 15000)).toBe(0);
    expect(calculateAccuracy(0, 0)).toBe(100);
    expect(calculateSyntaxAccuracy([])).toBe(100);
    expect(calculateConsistencyAndJitter([])).toEqual({ consistency: 100, jitterMs: 0 });
  });

  it('handles 1 keystroke edge case safely', () => {
    const single: KeystrokeData[] = [
      { char: '{', expected: '{', index: 0, ms: 120, deltaMs: 95, isError: false },
    ];
    expect(calculateAccuracy(1, 1)).toBe(100);
    expect(calculateSyntaxAccuracy(single)).toBe(100);
    expect(calculateConsistencyAndJitter(single)).toEqual({ consistency: 100, jitterMs: 0 });
    expect(calculateWpm(1, 60000)).toBe(0); // 1/5 = 0.2 -> rounds to 0
  });

  it('handles all-errors edge case (0% accuracy, 0 net WPM, >0 raw WPM)', () => {
    const allErrors: KeystrokeData[] = Array.from({ length: 10 }, (_, i) => ({
      char: 'x',
      expected: i % 2 === 0 ? '(' : 'a',
      index: i,
      ms: (i + 1) * 100,
      deltaMs: 100,
      isError: true,
    }));
    expect(calculateWpm(0, 10000)).toBe(0);
    expect(calculateRawWpm(10, 10000)).toBe(12); // (10/5) / (10/60) = 12
    expect(calculateAccuracy(0, 10)).toBe(0);
    expect(calculateSyntaxAccuracy(allErrors)).toBe(0);
  });

  it('classifies brackets, operators, punctuation, and alphanumeric characters', () => {
    expect(classifyCharError('{')).toBe('brackets');
    expect(classifyCharError('=')).toBe('operators');
    expect(classifyCharError(';')).toBe('punctuation');
    expect(classifyCharError('a')).toBe('alphanumeric');
  });

  it('computes jitterMs and consistency for steady vs erratic keystrokes', () => {
    const steady: KeystrokeData[] = Array.from({ length: 8 }, (_, i) => ({
      char: 'a',
      expected: 'a',
      index: i,
      ms: (i + 1) * 100,
      deltaMs: 100,
      isError: false,
    }));
    expect(calculateConsistencyAndJitter(steady)).toEqual({ consistency: 100, jitterMs: 0 });

    const erratic: KeystrokeData[] = [80, 400, 90, 500, 75, 450].map((deltaMs, i) => ({
      char: 'a',
      expected: 'a',
      index: i,
      ms: (i + 1) * 200,
      deltaMs,
      isError: false,
    }));
    const res = calculateConsistencyAndJitter(erratic);
    expect(res.jitterMs).toBeGreaterThan(150);
    expect(res.consistency).toBeLessThan(75);
  });
});
