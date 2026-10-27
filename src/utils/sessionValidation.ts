import { z } from 'zod';

export const sessionSubmissionSchema = z.object({
  lang_id: z.string().min(1).max(32),
  mode: z.string().min(1).max(32),
  tier: z.enum(['beginner', 'short', 'medium', 'long']),
  wpm: z.number().int().nonnegative(),
  raw_wpm: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(100),
  consistency: z.number().min(0).max(100),
  chars: z.number().int().positive(),
  duration_ms: z.number().int().positive(),
  seed: z.string().min(1).max(64).nullable().optional(),
});

export type SessionSubmissionInput = z.infer<typeof sessionSubmissionSchema>;

export type ValidationErrorCode =
  | 'INVALID_SCHEMA'
  | 'DURATION_TOO_SHORT'
  | 'ACCURACY_TOO_LOW'
  | 'WPM_MISMATCH';

export interface PlausibilityResult {
  ok: boolean;
  code?: ValidationErrorCode;
  message?: string;
  data?: SessionSubmissionInput;
}

export function validateSessionSubmission(input: unknown): PlausibilityResult {
  const parsed = sessionSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'INVALID_SCHEMA',
      message: parsed.error.issues[0]?.message || 'Invalid session payload',
    };
  }

  const data = parsed.data;

  // 1. Reject runs under 5 seconds (5000ms)
  if (data.duration_ms < 5000) {
    return {
      ok: false,
      code: 'DURATION_TOO_SHORT',
      message: 'Session duration must be at least 5 seconds (5000ms).',
    };
  }

  // 2. Reject accuracy under 45%
  if (data.accuracy < 45) {
    return {
      ok: false,
      code: 'ACCURACY_TOO_LOW',
      message: 'Session accuracy must be at least 45%.',
    };
  }

  // 3. Plausibility check: WPM must match chars and duration_ms
  const minutes = data.duration_ms / 60000;
  const expectedRawWpm = data.chars / 5 / minutes;
  const expectedNetWpm = expectedRawWpm * (data.accuracy / 100);

  if (data.wpm > 350 || data.raw_wpm > 400) {
    return {
      ok: false,
      code: 'WPM_MISMATCH',
      message: 'Reported WPM exceeds human plausibility bounds.',
    };
  }

  if (data.wpm > data.raw_wpm + 2) {
    return {
      ok: false,
      code: 'WPM_MISMATCH',
      message: 'Net WPM cannot exceed Raw WPM.',
    };
  }

  // Allow reasonable rounding & keystroke-timing tolerance (max of 12 WPM or 20% of expected)
  const rawTolerance = Math.max(12, expectedRawWpm * 0.2);
  const netTolerance = Math.max(12, expectedNetWpm * 0.2);

  if (
    Math.abs(data.raw_wpm - expectedRawWpm) > rawTolerance ||
    Math.abs(data.wpm - expectedNetWpm) > netTolerance
  ) {
    return {
      ok: false,
      code: 'WPM_MISMATCH',
      message: `Reported WPM (${data.wpm} net / ${data.raw_wpm} raw) does not match ${data.chars} chars in ${data.duration_ms}ms.`,
    };
  }

  return { ok: true, data };
}
