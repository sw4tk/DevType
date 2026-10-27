import { describe, it, expect } from 'vitest';
import { validateSessionSubmission } from '../src/utils/sessionValidation';

describe('validateSessionSubmission plausibility checks', () => {
  it('accepts a realistic valid typing session', () => {
    // 300 chars in 30,000ms (0.5 min) => 60 words / 0.5 min = 120 raw WPM
    // 95% accuracy => 114 net WPM
    const res = validateSessionSubmission({
      lang_id: 'typescript',
      mode: '30',
      tier: 'medium',
      wpm: 114,
      raw_wpm: 120,
      accuracy: 95,
      consistency: 88,
      chars: 300,
      duration_ms: 30000,
      seed: null,
    });
    expect(res.ok).toBe(true);
  });

  it('rejects sessions shorter than 5 seconds (5000ms)', () => {
    const res = validateSessionSubmission({
      lang_id: 'python',
      mode: 'standard',
      tier: 'short',
      wpm: 80,
      raw_wpm: 80,
      accuracy: 100,
      consistency: 90,
      chars: 30,
      duration_ms: 4500,
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('DURATION_TOO_SHORT');
  });

  it('rejects sessions with accuracy below 45%', () => {
    const res = validateSessionSubmission({
      lang_id: 'go',
      mode: 'standard',
      tier: 'medium',
      wpm: 20,
      raw_wpm: 60,
      accuracy: 40,
      consistency: 50,
      chars: 150,
      duration_ms: 30000,
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ACCURACY_TOO_LOW');
  });

  it('rejects sessions where reported WPM does not match chars and duration_ms', () => {
    // 100 chars in 60,000ms (1 min) is only 20 WPM, but payload claims 180 WPM
    const res = validateSessionSubmission({
      lang_id: 'typescript',
      mode: '60',
      tier: 'medium',
      wpm: 180,
      raw_wpm: 185,
      accuracy: 98,
      consistency: 92,
      chars: 100,
      duration_ms: 60000,
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('WPM_MISMATCH');
  });

  it('rejects sessions where net WPM is higher than raw WPM', () => {
    const res = validateSessionSubmission({
      lang_id: 'typescript',
      mode: '30',
      tier: 'medium',
      wpm: 130,
      raw_wpm: 100,
      accuracy: 100,
      consistency: 90,
      chars: 250,
      duration_ms: 30000,
    });
    expect(res.ok).toBe(false);
    expect(res.code).toBe('WPM_MISMATCH');
  });
});
