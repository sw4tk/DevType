export type KeystrokeData = {
  char: string;
  expected: string;
  index: number;
  ms: number;
  deltaMs: number;
  isError: boolean;
};

export interface ErrorBreakdown {
  brackets: number;
  operators: number;
  punctuation: number;
  alphanumeric: number;
}

export interface SessionStats {
  wpm: number;
  rawWpm: number;
  peakWpm: number;
  accuracy: number;
  syntaxAccuracy: number;
  cpm: number;
  consistency: number;
  jitterMs: number;
  streak: number;
  maxStreak: number;
  errorBreakdown: ErrorBreakdown;
  missedKeys: Record<string, number>;
  weakPatterns: Record<string, number>;
  keystrokeLog: KeystrokeData[];
  isFlaggedInvalid?: boolean;
  snippetBadge?: string;
}

export function classifyCharError(char: string): keyof ErrorBreakdown {
  if ('(){}[]<>'.includes(char)) return 'brackets';
  if ('+-*/=&|!^%~?:'.includes(char)) return 'operators';
  if (';,.\'"`\\'.includes(char)) return 'punctuation';
  return 'alphanumeric';
}

export function calculateRawWpm(totalTyped: number, elapsedMs: number): number {
  if (totalTyped <= 0 || elapsedMs <= 0) return 0;
  const elapsedMinutes = Math.max(elapsedMs / 60000, 0.015);
  return Math.min(350, Math.round(totalTyped / 5 / elapsedMinutes));
}

export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (correctChars <= 0 || elapsedMs <= 0) return 0;
  const elapsedMinutes = Math.max(elapsedMs / 60000, 0.015);
  return Math.min(350, Math.max(0, Math.round(correctChars / 5 / elapsedMinutes)));
}

export function calculateCpm(correctChars: number, elapsedMs: number): number {
  if (correctChars <= 0 || elapsedMs <= 0) return 0;
  const elapsedMinutes = Math.max(elapsedMs / 60000, 0.015);
  return Math.max(0, Math.round(correctChars / elapsedMinutes));
}

export function calculateAccuracy(correctChars: number, totalTyped: number): number {
  if (totalTyped <= 0) return 100;
  const clampedCorrect = Math.max(0, Math.min(correctChars, totalTyped));
  return Math.round((clampedCorrect / totalTyped) * 1000) / 10;
}

export function calculateSyntaxAccuracy(keystrokes: readonly KeystrokeData[]): number {
  const syntaxKeystrokes = keystrokes.filter(
    (k) => classifyCharError(k.expected) !== 'alphanumeric'
  );
  if (syntaxKeystrokes.length === 0) return 100;
  const syntaxErrors = syntaxKeystrokes.filter((k) => k.isError).length;
  return (
    Math.round(((syntaxKeystrokes.length - syntaxErrors) / syntaxKeystrokes.length) * 1000) / 10
  );
}

export function calculateConsistencyAndJitter(keystrokes: readonly KeystrokeData[]): {
  consistency: number;
  jitterMs: number;
} {
  if (keystrokes.length <= 4) {
    return { consistency: 100, jitterMs: 0 };
  }

  const intervals = keystrokes
    .map((k) => k.deltaMs)
    .filter((d) => d > 15 && d < 1500);

  if (intervals.length <= 2) {
    return { consistency: 100, jitterMs: 0 };
  }

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const jitterMs = Math.round(stdDev);
  const cv = mean > 0 ? stdDev / mean : 0;
  const consistency = Math.max(0, Math.min(100, Math.round((1 - cv * 0.45) * 100)));

  return { consistency, jitterMs };
}

export const EMPTY_ERROR_BREAKDOWN: ErrorBreakdown = Object.freeze({
  brackets: 0,
  operators: 0,
  punctuation: 0,
  alphanumeric: 0,
});

export const EMPTY_STATS: SessionStats = Object.freeze({
  wpm: 0,
  rawWpm: 0,
  peakWpm: 0,
  accuracy: 100,
  syntaxAccuracy: 100,
  cpm: 0,
  consistency: 100,
  jitterMs: 0,
  streak: 0,
  maxStreak: 0,
  errorBreakdown: EMPTY_ERROR_BREAKDOWN,
  missedKeys: {},
  weakPatterns: {},
  keystrokeLog: [],
  isFlaggedInvalid: false,
});

export function createEmptyStats(): SessionStats {
  return {
    ...EMPTY_STATS,
    errorBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
    missedKeys: {},
    weakPatterns: {},
    keystrokeLog: [],
  };
}
