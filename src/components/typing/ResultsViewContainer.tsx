'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ResultsDashboard from '@/components/results/ResultsDashboard';
import { ModalTab } from '@/components/typing/CommandPaletteModal';
import { submitTypingSession } from '@/utils/telemetry';
import { SessionSubmissionInput } from '@/utils/sessionValidation';
import { SessionStats, TelemetryPoint } from '@/hooks/useCodeTypingEngine';
import {
  DeveloperUser,
  GameMode,
  HistoryRecord,
  SnippetItem,
  SnippetLength,
} from '@/constants/languages';
import { StudioTheme } from '@/constants/themes';

interface ResultsViewContainerProps {
  user: DeveloperUser | null;
  stats: SessionStats;
  maxStreak: number;
  history: TelemetryPoint[];
  code: string;
  currentIndex: number;
  timeLimitSec: number;
  activeSnippet: SnippetItem;
  selectedLang: string;
  gameMode: GameMode;
  lengthMode: SnippetLength;
  todayStr: string;
  personalBest: number;
  onUpdatePersonalBest: (pb: number) => void;
  dailyBestWpm: number;
  onUpdateDailyBestWpm: (pb: number) => void;
  sessionLogs: HistoryRecord[];
  onAppendSessionLog: (entry: HistoryRecord) => void;
  onRecordMistakes: (
    missedKeys: Record<string, number>,
    weakPatterns: Record<string, number>
  ) => void;
  ghostChallengerWpm: number | null;
  theme: StudioTheme;
  onRestart: () => void;
  onNextRandom: () => void;
  onOpenModalTab: (tab: ModalTab | 'profile' | 'settings') => void;
}

export default function ResultsViewContainer({
  user,
  stats,
  maxStreak,
  history,
  code,
  currentIndex,
  timeLimitSec,
  activeSnippet,
  selectedLang,
  gameMode,
  lengthMode,
  todayStr,
  personalBest,
  onUpdatePersonalBest,
  dailyBestWpm,
  onUpdateDailyBestWpm,
  sessionLogs,
  onAppendSessionLog,
  onRecordMistakes,
  ghostChallengerWpm,
  theme,
  onRestart,
  onNextRandom,
  onOpenModalTab,
}: ResultsViewContainerProps) {
  const hasRecordedRef = useRef<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'local' | 'syncing'>('local');
  const [syncError, setSyncError] = useState<string>('');
  const [pendingSyncEntry, setPendingSyncEntry] = useState<SessionSubmissionInput | null>(null);

  const handleRetrySync = useCallback(() => {
    if (!pendingSyncEntry) return;
    setCloudSyncStatus('syncing');
    submitTypingSession(pendingSyncEntry).then((res) => {
      if (res.ok) {
        setCloudSyncStatus('synced');
        setSyncError('');
      } else {
        setCloudSyncStatus('local');
        setSyncError(
          res.code ? `[${res.code}] ${res.error}` : res.error || 'Failed to save session'
        );
      }
    });
  }, [pendingSyncEntry]);

  useEffect(() => {
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    if (!user) {
      setCloudSyncStatus('local');
      setSyncError('🔒 Guest Mode: Sign in to save your test results.');
      setPendingSyncEntry(null);
      return;
    }

    const lastMsForTelemetry =
      stats.keystrokeLog.length > 0
        ? Math.round(stats.keystrokeLog[stats.keystrokeLog.length - 1].ms)
        : timeLimitSec > 0
        ? timeLimitSec * 1000
        : 0;
    const actualDurationSec = Math.max(1, Math.round(lastMsForTelemetry / 1000));

    if (!stats.isFlaggedInvalid && stats.wpm > personalBest) {
      onUpdatePersonalBest(stats.wpm);
    }
    if (!stats.isFlaggedInvalid && gameMode === 'daily' && stats.wpm > dailyBestWpm) {
      onUpdateDailyBestWpm(stats.wpm);
    }

    onRecordMistakes(stats.missedKeys, stats.weakPatterns || {});

    const newEntry: HistoryRecord = {
      date: todayStr,
      timestamp: Date.now(),
      langId: selectedLang,
      gameMode,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      syntaxAccuracy: stats.syntaxAccuracy,
      consistency: stats.consistency,
      chars: currentIndex,
      durationSec: actualDurationSec,
    };

    if (!stats.isFlaggedInvalid) {
      onAppendSessionLog(newEntry);
    }

    const submissionPayload: SessionSubmissionInput = {
      lang_id: selectedLang,
      mode: gameMode,
      tier: lengthMode,
      wpm: Math.round(stats.wpm),
      raw_wpm: Math.round(stats.rawWpm),
      accuracy: Number(stats.accuracy.toFixed(2)),
      consistency: Number(stats.consistency.toFixed(2)),
      chars: Math.max(1, currentIndex),
      duration_ms: lastMsForTelemetry,
      seed: gameMode === 'daily' ? todayStr : null,
    };
    setPendingSyncEntry(submissionPayload);

    setCloudSyncStatus('syncing');
    submitTypingSession(submissionPayload).then((res) => {
      if (res.ok) {
        setCloudSyncStatus('synced');
        setSyncError('');
      } else {
        setCloudSyncStatus('local');
        setSyncError(
          res.code ? `[${res.code}] ${res.error}` : res.error || 'Failed to save session'
        );
      }
    });
  }, [
    user,
    stats,
    timeLimitSec,
    personalBest,
    onUpdatePersonalBest,
    gameMode,
    dailyBestWpm,
    onUpdateDailyBestWpm,
    onRecordMistakes,
    todayStr,
    selectedLang,
    currentIndex,
    onAppendSessionLog,
    lengthMode,
  ]);

  return (
    <ResultsDashboard
      isGuest={!user}
      onRetrySync={handleRetrySync}
      stats={{ ...stats, maxStreak, snippetBadge: activeSnippet.badge }}
      history={history}
      code={code}
      languageLabel={activeSnippet.label}
      filename={activeSnippet.filename}
      personalBest={personalBest}
      sessionLogs={sessionLogs}
      ghostChallengerWpm={ghostChallengerWpm}
      cloudSyncStatus={cloudSyncStatus}
      syncError={syncError}
      theme={theme}
      onRestart={onRestart}
      onNextRandom={onNextRandom}
      onOpenModalTab={onOpenModalTab}
    />
  );
}
