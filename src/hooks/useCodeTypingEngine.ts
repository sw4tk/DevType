'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorMode } from '@/constants/languages';
import {
  KeystrokeData,
  ErrorBreakdown,
  SessionStats,
  EMPTY_ERROR_BREAKDOWN,
  createEmptyStats,
  classifyCharError,
  calculateWpm,
  calculateRawWpm,
  calculateCpm,
  calculateAccuracy,
  calculateSyntaxAccuracy,
  calculateConsistencyAndJitter,
} from '@/lib/stats';

export type { KeystrokeData, ErrorBreakdown, SessionStats };
export type EngineStatus = 'idle' | 'typing' | 'finished';

export interface TelemetryPoint {
  ms: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

export interface UseCodeTypingEngineOptions {
  initialSnippet: string;
  onKeystrokeFeedback?: (isError: boolean) => void;
  pacemakerWpm?: number;
  disabled?: boolean;
  timeLimitSec?: number;
  onRequestNextSnippet?: () => string;
  suddenDeath?: boolean;
  endlessMode?: boolean;
  ghostTimestampsMs?: number[] | null;
  errorMode?: ErrorMode;
  autoPairEnabled?: boolean;
}

const TRACKED_PATTERNS = [
  '=>',
  '===',
  '!==',
  '?.',
  '::',
  '->',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '()',
  '{}',
  '[]',
];

export function useCodeTypingEngine({
  initialSnippet,
  onKeystrokeFeedback,
  pacemakerWpm = 0,
  disabled = false,
  timeLimitSec = 0,
  onRequestNextSnippet,
  suddenDeath = false,
  endlessMode = false,
  ghostTimestampsMs = null,
  errorMode = 'forgiving',
  autoPairEnabled = true,
}: UseCodeTypingEngineOptions) {
  const [code, setCode] = useState<string>(initialSnippet);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [ghostIndex, setGhostIndex] = useState<number>(0);
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(timeLimitSec);
  const [errorVersion, setErrorVersion] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('');
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  const [afkPausedWarning, setAfkPausedWarning] = useState<boolean>(false);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [liveStats, setLiveStats] = useState<SessionStats>(() => createEmptyStats());

  const baseSnippetRef = useRef<string>(initialSnippet);
  const codeRef = useRef<string>(initialSnippet);
  const indexRef = useRef<number>(0);
  const statusRef = useRef<EngineStatus>('idle');
  const timeLimitRef = useRef<number>(timeLimitSec);
  timeLimitRef.current = timeLimitSec;
  const suddenDeathRef = useRef<boolean>(suddenDeath);
  suddenDeathRef.current = suddenDeath;
  const endlessModeRef = useRef<boolean>(endlessMode);
  endlessModeRef.current = endlessMode;
  const errorModeRef = useRef<ErrorMode>(errorMode);
  errorModeRef.current = errorMode;
  const autoPairRef = useRef<boolean>(autoPairEnabled);
  autoPairRef.current = autoPairEnabled;

  const startTimeRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const totalIdleDeductionMsRef = useRef<number>(0);
  const peakWpmRef = useRef<number>(0);

  const keystrokesRef = useRef<KeystrokeData[]>([]);
  const errorsRef = useRef<Set<number>>(new Set());
  const missedKeysRef = useRef<Record<string, number>>({});
  const weakPatternsRef = useRef<Record<string, number>>({});
  const streakRef = useRef<number>(0);
  const maxStreakRef = useRef<number>(0);
  const feedbackRef = useRef(onKeystrokeFeedback);
  feedbackRef.current = onKeystrokeFeedback;
  const nextSnippetGeneratorRef = useRef(onRequestNextSnippet);
  nextSnippetGeneratorRef.current = onRequestNextSnippet;

  const errorBreakdownRef = useRef<ErrorBreakdown>({ ...EMPTY_ERROR_BREAKDOWN });

  const getEffectiveElapsedMs = useCallback(() => {
    if (startTimeRef.current === null) return 0;
    return Math.max(
      250,
      performance.now() - startTimeRef.current - totalIdleDeductionMsRef.current
    );
  }, []);

  const computeStatsSnapshot = useCallback((): SessionStats => {
    if (startTimeRef.current === null) {
      return {
        ...createEmptyStats(),
        streak: streakRef.current,
        maxStreak: maxStreakRef.current,
        errorBreakdown: { ...errorBreakdownRef.current },
        missedKeys: { ...missedKeysRef.current },
        weakPatterns: { ...weakPatternsRef.current },
        keystrokeLog: [...keystrokesRef.current],
      };
    }

    const elapsedMs = getEffectiveElapsedMs();
    const totalTyped = keystrokesRef.current.length;
    const totalErrors = keystrokesRef.current.filter((k) => k.isError).length;
    const correctChars = Math.max(0, totalTyped - totalErrors);

    const rawWpm = calculateRawWpm(totalTyped, elapsedMs);
    const wpm = calculateWpm(correctChars, elapsedMs);
    if (wpm > peakWpmRef.current && totalTyped >= 8) {
      peakWpmRef.current = wpm;
    }

    const accuracy = calculateAccuracy(correctChars, totalTyped);
    const cpm = calculateCpm(correctChars, elapsedMs);
    const syntaxAccuracy = calculateSyntaxAccuracy(keystrokesRef.current);
    const { consistency, jitterMs } = calculateConsistencyAndJitter(keystrokesRef.current);
    const isFlaggedInvalid = accuracy < 45 || wpm > 320;

    return {
      wpm,
      rawWpm,
      peakWpm: Math.max(wpm, peakWpmRef.current),
      accuracy,
      syntaxAccuracy,
      cpm,
      consistency,
      jitterMs,
      streak: streakRef.current,
      maxStreak: maxStreakRef.current,
      errorBreakdown: { ...errorBreakdownRef.current },
      missedKeys: { ...missedKeysRef.current },
      weakPatterns: { ...weakPatternsRef.current },
      keystrokeLog: [...keystrokesRef.current],
      isFlaggedInvalid,
    };
  }, [getEffectiveElapsedMs]);

  const finishNow = useCallback(() => {
    const finalStats = computeStatsSnapshot();
    setLiveStats(finalStats);
    if (startTimeRef.current !== null) {
      setHistory((h) => [
        ...h,
        {
          ms: getEffectiveElapsedMs(),
          wpm: finalStats.wpm,
          rawWpm: finalStats.rawWpm,
          errors: errorsRef.current.size,
        },
      ]);
    }
    statusRef.current = 'finished';
    setStatus('finished');
  }, [computeStatsSnapshot, getEffectiveElapsedMs]);

  const resetEngine = useCallback((newSnippet?: string) => {
    const targetCode = typeof newSnippet === 'string' ? newSnippet : baseSnippetRef.current;
    baseSnippetRef.current = targetCode;
    codeRef.current = targetCode;
    let firstNonSpace = 0;
    while (
      firstNonSpace < targetCode.length &&
      (targetCode[firstNonSpace] === ' ' || targetCode[firstNonSpace] === '\t')
    ) {
      firstNonSpace++;
    }
    indexRef.current = firstNonSpace;
    statusRef.current = 'idle';
    startTimeRef.current = null;
    lastKeyTimeRef.current = null;
    totalIdleDeductionMsRef.current = 0;
    peakWpmRef.current = 0;
    keystrokesRef.current = [];
    errorsRef.current = new Set();
    missedKeysRef.current = {};
    weakPatternsRef.current = {};
    streakRef.current = 0;
    maxStreakRef.current = 0;
    errorBreakdownRef.current = { ...EMPTY_ERROR_BREAKDOWN };

    setCode(targetCode);
    setCurrentIndex(firstNonSpace);
    setGhostIndex(0);
    setStatus('idle');
    setTimeLeft(timeLimitRef.current);
    setErrorVersion(0);
    setStreak(0);
    setMaxStreak(0);
    setLastKeyPressed('');
    setAfkPausedWarning(false);
    setHistory([]);
    setLiveStats(createEmptyStats());
  }, []);

  useEffect(() => {
    resetEngine(initialSnippet);
  }, [initialSnippet, timeLimitSec, suddenDeath, endlessMode, resetEngine]);

  useEffect(() => {
    if (status !== 'typing' || timeLimitSec <= 0) return;

    const timer = setInterval(() => {
      if (startTimeRef.current === null) return;
      const elapsedMs = getEffectiveElapsedMs();
      const remainingSec = Math.max(0, Math.ceil((timeLimitSec * 1000 - elapsedMs) / 1000));
      setTimeLeft(remainingSec);

      if (elapsedMs >= timeLimitSec * 1000) {
        clearInterval(timer);
        finishNow();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [status, timeLimitSec, finishNow, getEffectiveElapsedMs]);

  useEffect(() => {
    if (status !== 'typing') {
      setGhostIndex(0);
      return;
    }

    if (ghostTimestampsMs && ghostTimestampsMs.length > 0) {
      const timers: NodeJS.Timeout[] = [];
      ghostTimestampsMs.forEach((msOffset, idx) => {
        const t = setTimeout(() => {
          setGhostIndex(Math.min(codeRef.current.length - 1, idx + 1));
        }, msOffset);
        timers.push(t);
      });
      return () => timers.forEach(clearTimeout);
    }

    if (pacemakerWpm <= 0) {
      setGhostIndex(0);
      return;
    }

    const charsPerSecond = (pacemakerWpm * 5) / 60;
    const intervalMs = Math.max(30, Math.round(1000 / charsPerSecond));

    const timer = setInterval(() => {
      setGhostIndex((prev) => Math.min(codeRef.current.length - 1, prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status, pacemakerWpm, ghostTimestampsMs]);

  useEffect(() => {
    if (status !== 'typing') return;

    const interval = setInterval(() => {
      if (startTimeRef.current === null) return;
      if (lastKeyTimeRef.current !== null && performance.now() - lastKeyTimeRef.current > 3500) {
        setAfkPausedWarning(true);
        return;
      }
      const snap = computeStatsSnapshot();
      setLiveStats(snap);
      setHistory((prev) => [
        ...prev,
        {
          ms: getEffectiveElapsedMs(),
          wpm: snap.wpm,
          rawWpm: snap.rawWpm,
          errors: errorsRef.current.size,
        },
      ]);
    }, 750);

    return () => clearInterval(interval);
  }, [status, computeStatsSnapshot, getEffectiveElapsedMs]);

  useEffect(() => {
    if (disabled) return;

    const extendOrFinishStream = (nextIndex: number) => {
      if (timeLimitRef.current > 0 || endlessModeRef.current) {
        const freshChunk = nextSnippetGeneratorRef.current
          ? nextSnippetGeneratorRef.current()
          : baseSnippetRef.current;
        const extended = `${codeRef.current}\n\n${freshChunk}`;
        codeRef.current = extended;
        setCode(extended);
        indexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
        return;
      }
      finishNow();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }

      if (e.isComposing || e.keyCode === 229) return;
      if (e.repeat && e.key !== 'Backspace') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') return;
      if ((e.metaKey || e.ctrlKey) && e.key === ',') return;
      if (e.altKey && e.key.toLowerCase() === 'n') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && statusRef.current === 'typing') {
        e.preventDefault();
        finishNow();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        resetEngine();
        return;
      }

      if (e.key === 'CapsLock') return;
      if (statusRef.current === 'finished') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const activeCode = codeRef.current;
      const idx = indexRef.current;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (activeCode.slice(idx, idx + 2) === '  ') {
          let indentEnd = idx;
          while (indentEnd < activeCode.length && activeCode[indentEnd] === ' ') {
            indentEnd++;
          }
          indexRef.current = indentEnd;
          setCurrentIndex(indentEnd);
          setLastKeyPressed('TAB');
          feedbackRef.current?.(false);
        }
        return;
      }

      if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Enter') return;
      e.preventDefault();

      const now = performance.now();
      let deltaMs = 95;
      if (statusRef.current === 'idle') {
        startTimeRef.current = now;
        lastKeyTimeRef.current = now;
        statusRef.current = 'typing';
        setStatus('typing');
      } else if (lastKeyTimeRef.current !== null) {
        const gap = now - lastKeyTimeRef.current;
        deltaMs = gap;
        if (gap > 3500 && timeLimitRef.current === 0) {
          totalIdleDeductionMsRef.current += gap - 1000;
          deltaMs = 250;
        }
        lastKeyTimeRef.current = now;
        setAfkPausedWarning(false);
      }

      const elapsedMs = getEffectiveElapsedMs();

      setLastKeyPressed(
        e.key === ' '
          ? 'SPACE'
          : e.key === 'Enter'
          ? 'ENTER'
          : e.key === 'Backspace'
          ? 'BKSP'
          : e.key.toUpperCase()
      );

      if (e.key === 'Backspace') {
        if (errorModeRef.current === 'no-backspace') {
          feedbackRef.current?.(true);
          return;
        }
        let next = idx - 1;
        while (
          next > 0 &&
          (activeCode[next] === ' ' || activeCode[next] === '\t') &&
          activeCode[next - 1] === '\n'
        ) {
          next--;
        }
        const clamped = Math.max(0, next);
        indexRef.current = clamped;
        setCurrentIndex(clamped);
        feedbackRef.current?.(false);
        return;
      }

      const expectedChar = activeCode[idx];

      if (
        e.key === ' ' &&
        expectedChar !== ' ' &&
        idx > 0 &&
        (activeCode[idx - 1] === ' ' || activeCode[idx - 1] === '\t')
      ) {
        let scan = idx - 1;
        while (scan > 0 && (activeCode[scan] === ' ' || activeCode[scan] === '\t')) {
          scan--;
        }
        if (scan === 0 || activeCode[scan] === '\n') {
          return;
        }
      }

      if (expectedChar === ' ' || expectedChar === '\t') {
        let lookahead = idx;
        while (
          lookahead < activeCode.length &&
          (activeCode[lookahead] === ' ' || activeCode[lookahead] === '\t')
        ) {
          lookahead++;
        }
        if (e.key === activeCode[lookahead]) {
          keystrokesRef.current.push({
            char: e.key,
            expected: activeCode[lookahead],
            index: lookahead,
            ms: elapsedMs,
            deltaMs,
            isError: false,
          });
          streakRef.current += 1;
          if (streakRef.current > maxStreakRef.current) maxStreakRef.current = streakRef.current;
          setStreak(streakRef.current);
          setMaxStreak(maxStreakRef.current);
          feedbackRef.current?.(false);

          const nextIdx = lookahead + 1;
          if (nextIdx >= activeCode.length) {
            extendOrFinishStream(nextIdx);
          } else {
            indexRef.current = nextIdx;
            setCurrentIndex(nextIdx);
          }
          return;
        }
      }

      const typedChar = e.key === 'Enter' ? '\n' : e.key;
      const isError = typedChar !== expectedChar;

      const twoCharWindow = activeCode.slice(Math.max(0, idx - 1), idx + 1);
      const twoCharAhead = activeCode.slice(idx, idx + 2);
      const threeCharAhead = activeCode.slice(idx, idx + 3);

      keystrokesRef.current.push({
        char: typedChar,
        expected: expectedChar,
        index: idx,
        ms: elapsedMs,
        deltaMs,
        isError,
      });
      feedbackRef.current?.(isError);

      if (isError) {
        const category = classifyCharError(expectedChar);
        errorBreakdownRef.current[category] += 1;
        const missedKeyLabel =
          expectedChar === '\n'
            ? 'ENTER'
            : expectedChar === ' '
            ? 'SPACE'
            : expectedChar.toUpperCase();
        missedKeysRef.current[missedKeyLabel] = (missedKeysRef.current[missedKeyLabel] || 0) + 1;

        for (const pat of TRACKED_PATTERNS) {
          if (twoCharWindow === pat || twoCharAhead === pat || threeCharAhead === pat) {
            weakPatternsRef.current[pat] = (weakPatternsRef.current[pat] || 0) + 1;
          }
        }

        errorsRef.current.add(idx);
        streakRef.current = 0;
        setStreak(0);
        setErrorVersion((v) => v + 1);

        if (suddenDeathRef.current) {
          finishNow();
          return;
        }

        if (errorModeRef.current === 'strict') {
          return;
        }
      } else {
        if (errorsRef.current.has(idx)) {
          errorsRef.current.delete(idx);
          setErrorVersion((v) => v + 1);
        }
        streakRef.current += 1;
        if (streakRef.current > maxStreakRef.current) {
          maxStreakRef.current = streakRef.current;
          setMaxStreak(maxStreakRef.current);
        }
        setStreak(streakRef.current);

        if (deltaMs > 380 && TRACKED_PATTERNS.includes(twoCharWindow)) {
          weakPatternsRef.current[twoCharWindow] =
            (weakPatternsRef.current[twoCharWindow] || 0) + 1;
        }
      }

      let next = idx + 1;

      if (expectedChar === '\n' || typedChar === '\n') {
        while (
          next < activeCode.length &&
          (activeCode[next] === ' ' || activeCode[next] === '\t')
        ) {
          next++;
        }
      }

      if (next >= activeCode.length) {
        extendOrFinishStream(next);
      } else {
        indexRef.current = next;
        setCurrentIndex(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [computeStatsSnapshot, resetEngine, finishNow, getEffectiveElapsedMs, disabled]);

  return {
    code,
    currentIndex,
    ghostIndex,
    status,
    timeLeft,
    errors: errorsRef.current,
    errorVersion,
    stats: liveStats,
    streak,
    maxStreak,
    lastKeyPressed,
    capsLockOn,
    afkPausedWarning,
    history,
    resetEngine,
    finishNow,
  };
}
