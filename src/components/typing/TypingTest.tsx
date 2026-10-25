'use client';
import { createClient } from '@/utils/supabase/client';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useCodeTypingEngine } from '@/hooks/useCodeTypingEngine';
import { useMechanicalAudio, SwitchProfile } from '@/hooks/useMechanicalAudio';
import ResultsDashboard from '@/components/results/ResultsDashboard';
import LiveKeyboardDeck from '@/components/typing/LiveKeyboardDeck';
import StudioHeaderDock from '@/components/typing/StudioHeaderDock';
import VimDojoArena from '@/components/typing/VimDojoArena';
import IdeCodeViewport from '@/components/typing/IdeCodeViewport';
import CommandPaletteModal, { ModalTab } from '@/components/typing/CommandPaletteModal';
import DeveloperProfileModal from '@/components/typing/DeveloperProfileModal';
import StudioSettingsModal from '@/components/typing/StudioSettingsModal';
import { recordTypingSession } from '@/utils/telemetry';
import {
  LANGUAGES,
  QUICK_LANGUAGES,
  SnippetItem,
  SnippetLength,
  GameMode,
  ErrorMode,
  CaretSmoothness,
  CaretShape,
  HistoryRecord,
  DeveloperUser,
} from '@/constants/languages';
import { STUDIO_THEMES } from '@/constants/themes';
import { UI_STYLES, UIStyleId } from '@/constants/uiStyles';
import {
  pick,
  synthesizeUnlimitedSnippet,
  synthesizeSmartCoachSnippet,
} from '@/utils/codeSynthesizer';
import {
  getInstantUnseenSnippet,
  getNextCorpusSnippet,
  harvestGitHubCorpusForLanguage,
} from '@/utils/githubScraper';
import { syncSessionToCloud } from '@/utils/supabaseClient';
import { Zap, Layers, Terminal, Loader2, Keyboard } from 'lucide-react';

export default function TypingTest() {
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [bootStepText, setBootStepText] = useState<string>('Downloading user data & telemetry profile...');

  const [selectedLang, setSelectedLang] = useState<string>('typescript');
  const [lengthMode, setLengthMode] = useState<SnippetLength>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [errorMode, setErrorMode] = useState<ErrorMode>('forgiving');
  const [uiStyleId, setUiStyleId] = useState<UIStyleId>('glassmorphism');

  // New User-Configurable Layout & Typography Settings
  const [showKeyboard, setShowKeyboard] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState(18);

  const [activeSnippet, setActiveSnippet] = useState<SnippetItem | null>(null);

  const [importedChunks, setImportedChunks] = useState<string[]>([]);
  const [importedMeta, setImportedMeta] = useState<{ title: string; badge: string } | null>(null);

  const [ghostTimeline, setGhostTimeline] = useState<number[] | null>(null);
  const [ghostChallengerWpm, setGhostChallengerWpm] = useState<number | null>(null);

  const [soundProfile, setSoundProfile] = useState<SwitchProfile>('thock');
  const [themeId, setThemeId] = useState<string>('obsidian');
  const [caretShape, setCaretShape] = useState<CaretShape>('block');
  const [caretSmoothness, setCaretSmoothness] = useState<CaretSmoothness>('butter');
  const [velocityStretch, setVelocityStretch] = useState<boolean>(true);
  const [caretGlow, setCaretGlow] = useState<boolean>(true);
  const [focusZenDim, setFocusZenDim] = useState<boolean>(false);
  const [pacemakerWpm, setPacemakerWpm] = useState<number>(75);

  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [paletteTab, setPaletteTab] = useState<ModalTab>('languages');
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [personalBest, setPersonalBest] = useState<number>(0);
  const [dailyBestWpm, setDailyBestWpm] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<HistoryRecord[]>([]);
  const [cumulativeMissedKeys, setCumulativeMissedKeys] = useState<Record<string, number>>({});
  const [cumulativeWeakPatterns, setCumulativeWeakPatterns] = useState<Record<string, number>>({});
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'local' | 'syncing'>('local');
  const [syncError, setSyncError] = useState<string>('');
  const [pendingSyncEntry, setPendingSyncEntry] = useState<HistoryRecord | null>(null);

  const handleRetrySync = useCallback(() => {
    if (!pendingSyncEntry) return;
    setCloudSyncStatus('syncing');
    syncSessionToCloud(user, pendingSyncEntry).then((res) => {
      if (res.ok) {
        setCloudSyncStatus('synced');
        setSyncError('');
      } else {
        setCloudSyncStatus('local');
        setSyncError(res.error || 'Failed to sync to Supabase');
      }
    });
  }, [user, pendingSyncEntry]);

  const sparkTriggerRef = useRef<(() => void) | null>(null);
  const hasRecordedRef = useRef<boolean>(false);
  const currentLangSpec = useMemo(
    () => LANGUAGES.find((l) => l.id === selectedLang) || LANGUAGES[0],
    [selectedLang]
  );
  const [todayStr, setTodayStr] = useState<string>('2026-10-23');

  const theme = useMemo(
    () => STUDIO_THEMES.find((t) => t.id === themeId) || STUDIO_THEMES[0],
    [themeId]
  );

  const uiStyle = useMemo(
    () => UI_STYLES.find((s) => s.id === uiStyleId) || UI_STYLES[0],
    [uiStyleId]
  );

  const { playKeystroke, ambientPlaying, toggleAmbientDrone } = useMechanicalAudio(soundProfile);

  // Boot Loader Sequence: Downloads User Data + Fetches Guaranteed-Random Unseen Snippet
  useEffect(() => {
    
    const initializeDevType = async () => {
      const currentIsoDate = new Date().toISOString().slice(0, 10);
      setTodayStr(currentIsoDate);

      let initialLang = pick(QUICK_LANGUAGES);
      try {
        const savedLang = localStorage.getItem('dt_last_lang');
        if (savedLang) initialLang = savedLang;
        setSelectedLang(initialLang);

        const savedSmooth = localStorage.getItem('dt_smoothness') as CaretSmoothness | null;
        const savedShape = localStorage.getItem('dt_shape') as CaretShape | null;
        const savedTheme = localStorage.getItem('dt_theme');
        const savedUiStyle = localStorage.getItem('dt_ui_style') as UIStyleId | null;
        const savedErrorMode = localStorage.getItem('dt_error_mode') as ErrorMode | null;
        const savedShowKb = localStorage.getItem('dt_show_keyboard');
        const savedFontSize = localStorage.getItem('dt_font_size');
        const savedLogs = localStorage.getItem('dt_session_logs');
        const savedDaily = localStorage.getItem(`dt_daily_pb_${currentIsoDate}`);
        const savedUser = localStorage.getItem('dt_user_profile');
        const savedMisses = localStorage.getItem('dt_missed_keys');
        const savedPatterns = localStorage.getItem('dt_weak_patterns');

        if (savedSmooth) setCaretSmoothness(savedSmooth);
        if (savedShape) setCaretShape(savedShape);
        if (savedTheme) setThemeId(savedTheme);
        if (savedUiStyle && UI_STYLES.some((s) => s.id === savedUiStyle)) setUiStyleId(savedUiStyle);
        if (savedErrorMode) setErrorMode(savedErrorMode);
        if (savedShowKb !== null) setShowKeyboard(savedShowKb === 'true');
        if (savedFontSize) setFontSize(parseInt(savedFontSize, 10) || 15);
        if (savedLogs) setSessionLogs(JSON.parse(savedLogs));
        if (savedDaily) setDailyBestWpm(parseInt(savedDaily, 10));
        if (savedUser) {
          const supabase = createClient();
          const { data: { user: realAuthUser } } = await supabase.auth.getUser();
          if (realAuthUser) {
            setUser(JSON.parse(savedUser));
          } else {
            localStorage.removeItem('dt_user_profile');
            setUser(null);
          }
        }
        if (savedMisses) setCumulativeMissedKeys(JSON.parse(savedMisses));
        if (savedPatterns) setCumulativeWeakPatterns(JSON.parse(savedPatterns));
      } catch {}

      if (window.location.search.includes('error=') || window.location.hash.includes('error=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      const params = new URLSearchParams(window.location.search);
      const ghostParam = params.get('ghost');
      if (ghostParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(ghostParam)));
          if (decoded && decoded.c && Array.isArray(decoded.t)) {
            setActiveSnippet({
              langId: 'custom',
              label: decoded.l || 'Ghost Race',
              filename: decoded.f || 'challenge.ts',
              badge: `GHOST RACE • ${decoded.w} WPM`,
              category: 'P2P Challenge',
              code: decoded.c,
            });
            setGhostTimeline(decoded.t);
            setGhostChallengerWpm(decoded.w || 90);
            setIsBooting(false);
            return;
          }
        } catch {}
      }

      setBootStepText('Synthesizing non-repeating code snippet from cloud corpus...');
      let freshSnippet = await getNextCorpusSnippet(initialLang, 'medium');
      if (!freshSnippet) {
        freshSnippet = getInstantUnseenSnippet(initialLang, 'medium');
      }
      setActiveSnippet(freshSnippet);
      harvestGitHubCorpusForLanguage(initialLang, 'medium', true).catch(() => {});

      setTimeout(() => setIsBooting(false), 550);
    };

    initializeDevType();
  }, []);

  const recentAvgWpm = useMemo(() => {
    if (sessionLogs.length === 0) return 60;
    const recent = sessionLogs.slice(-10);
    return Math.round(recent.reduce((a, r) => a + r.wpm, 0) / recent.length);
  }, [sessionLogs]);

  const rollRandomSnippet = useCallback(
    (targetLang: string = selectedLang, targetLen: SnippetLength = lengthMode) => {
      setGhostTimeline(null);
      setGhostChallengerWpm(null);

      if (targetLang === 'custom' && importedChunks.length > 0 && importedMeta) {
        const chunk = pick(importedChunks);
        setActiveSnippet({
          langId: 'custom',
          label: 'Imported',
          filename: importedMeta.title,
          badge: importedMeta.badge,
          category: 'GitHub',
          code: chunk,
        });
        return chunk;
      }

      if (gameMode === 'smartcoach') {
        const coachItem = synthesizeSmartCoachSnippet(
          targetLang,
          cumulativeMissedKeys,
          cumulativeWeakPatterns,
          recentAvgWpm
        );
        setActiveSnippet(coachItem);
        return coachItem.code;
      }

      const unseen = getInstantUnseenSnippet(targetLang, targetLen);
      setActiveSnippet(unseen);
      getNextCorpusSnippet(targetLang, targetLen).catch(() => {});
      return unseen.code;
    },
    [
      selectedLang,
      lengthMode,
      importedChunks,
      importedMeta,
      gameMode,
      cumulativeMissedKeys,
      cumulativeWeakPatterns,
      recentAvgWpm,
    ]
  );

  const startDailyChallenge = useCallback(() => {
    setGhostTimeline(null);
    setGhostChallengerWpm(null);
    setGameMode('daily');
    setActiveSnippet(synthesizeUnlimitedSnippet(selectedLang, 'medium', todayStr));
  }, [selectedLang, todayStr]);

  const requestStreamChunk = useCallback((): string => {
    if (selectedLang === 'custom' && importedChunks.length > 0) {
      return pick(importedChunks);
    }
    return getInstantUnseenSnippet(selectedLang, lengthMode).code;
  }, [selectedLang, lengthMode, importedChunks]);

  const handleKeystrokeFeedback = useCallback(
    (isError: boolean) => {
      playKeystroke(isError);
      if (!isError) sparkTriggerRef.current?.();
    },
    [playKeystroke]
  );

  const timeLimitSec =
    gameMode === '15' ? 15 : gameMode === '30' ? 30 : gameMode === '60' ? 60 : 0;
  const isSuddenDeath = gameMode === 'suddendeath';
  const isZenMode = gameMode === 'zen';
  const isVimMode = gameMode === 'vim';

  const {
    code,
    currentIndex,
    ghostIndex,
    status,
    timeLeft,
    errors,
    errorVersion,
    stats,
    streak,
    maxStreak,
    lastKeyPressed,
    capsLockOn,
    afkPausedWarning,
    history,
    resetEngine,
    finishNow,
  } = useCodeTypingEngine(
    activeSnippet?.code || 'export const ready = true;',
    handleKeystrokeFeedback,
    pacemakerWpm,
    paletteOpen || profileModalOpen || settingsModalOpen || isVimMode || isBooting,
    timeLimitSec,
    requestStreamChunk,
    isSuddenDeath,
    isZenMode,
    ghostTimeline,
    errorMode
  );

  const handleSelectLanguage = useCallback(
    (langId: string) => {
      setSelectedLang(langId);
      try {
        localStorage.setItem('dt_last_lang', langId);
      } catch {}
      if (gameMode === 'daily') {
        setActiveSnippet(synthesizeUnlimitedSnippet(langId, 'medium', todayStr));
      } else {
        rollRandomSnippet(langId, lengthMode);
      }
    },
    [gameMode, lengthMode, rollRandomSnippet, todayStr]
  );

  const handleSelectGameMode = useCallback(
    (mode: GameMode) => {
      if (mode === 'daily') {
        startDailyChallenge();
      } else if (mode === 'smartcoach') {
        setGameMode('smartcoach');
        setActiveSnippet(
          synthesizeSmartCoachSnippet(
            selectedLang,
            cumulativeMissedKeys,
            cumulativeWeakPatterns,
            recentAvgWpm
          )
        );
      } else {
        setGameMode(mode);
      }
    },
    [
      startDailyChallenge,
      selectedLang,
      cumulativeMissedKeys,
      cumulativeWeakPatterns,
      recentAvgWpm,
    ]
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`devtype_pb_${selectedLang}_${gameMode}`);
      setPersonalBest(saved ? parseInt(saved, 10) : 0);
    } catch {
      setPersonalBest(0);
    }
  }, [selectedLang, gameMode]);

  useEffect(() => {
    if (status !== 'finished') {
      hasRecordedRef.current = false;
      return;
    }
    if (hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    if (!user) {
      setCloudSyncStatus('local');
      setSyncError('🔒 Guest Mode: Sign in to save your test results.');
      setPendingSyncEntry(null);
      return;
    }

    if (status === 'finished') {
      // Guest Mode: Allow testing & ResultsDashboard, but skip all data saving if not logged in
      if (!user) {
        setCloudSyncStatus('local');
        setSyncError('');
        setPendingSyncEntry(null);
        return;
      }

      const lastMsForTelemetry =
        stats.keystrokeLog.length > 0
          ? stats.keystrokeLog[stats.keystrokeLog.length - 1].ms
          : 15000;
      const actualDurationSec = Math.max(1, Math.round(lastMsForTelemetry / 1000));

      recordTypingSession({
        language: currentLangSpec.name,
        ext: `.${currentLangSpec.ext}`,
        mode: gameMode,
        length_tier: lengthMode,
        wpm: Math.round(stats.wpm),
        raw_wpm: Math.round(stats.rawWpm || stats.wpm),
        accuracy: Number(stats.accuracy.toFixed(1)),
        lines_typed: code.split('\n').length,
        duration_seconds: actualDurationSec,
      }).catch((err) => console.error('Telemetry error:', err));

      if (!stats.isFlaggedInvalid && stats.wpm > personalBest) {
        setPersonalBest(stats.wpm);
        try {
          localStorage.setItem(`devtype_pb_${selectedLang}_${gameMode}`, String(stats.wpm));
        } catch {}
      }
      if (!stats.isFlaggedInvalid && gameMode === 'daily' && stats.wpm > dailyBestWpm) {
        setDailyBestWpm(stats.wpm);
        try {
          localStorage.setItem(`dt_daily_pb_${todayStr}`, String(stats.wpm));
        } catch {}
      }

      setCumulativeMissedKeys((prev) => {
        const next = { ...prev };
        Object.entries(stats.missedKeys).forEach(([k, v]) => {
          next[k] = (next[k] || 0) + v;
        });
        try {
          localStorage.setItem('dt_missed_keys', JSON.stringify(next));
        } catch {}
        return next;
      });

      setCumulativeWeakPatterns((prev) => {
        const next = { ...prev };
        Object.entries(stats.weakPatterns || {}).forEach(([k, v]) => {
          next[k] = (next[k] || 0) + v;
        });
        try {
          localStorage.setItem('dt_weak_patterns', JSON.stringify(next));
        } catch {}
        return next;
      });

      const durationSec = actualDurationSec;

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
        chars: code.length,
        durationSec,
      };
      setPendingSyncEntry(newEntry);

      if (!stats.isFlaggedInvalid) {
        try {
          setSessionLogs((prev) => {
            const updated = [...prev.slice(-399), newEntry];
            localStorage.setItem('dt_session_logs', JSON.stringify(updated));
            return updated;
          });
        } catch {}
      }

      setCloudSyncStatus('syncing');
      syncSessionToCloud(user, newEntry).then((res) => {
        if (res.ok) {
          setCloudSyncStatus('synced');
          setSyncError('');
        } else {
          setCloudSyncStatus('local');
          setSyncError(res.error || 'Failed to sync to Supabase');
        }
      });
    }
  }, [
    status,
    stats,
    personalBest,
    dailyBestWpm,
    selectedLang,
    gameMode,
    todayStr,
    code.length,
    user,
  ]);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteTab('languages');
        setPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsModalOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        rollRandomSnippet();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [rollRandomSnippet]);

  // Terminal Boot Loader Screen
  if (isBooting || !activeSnippet) {
    return (
      <div
        style={{ backgroundColor: theme.bg }}
        className="w-screen h-dvh flex flex-col items-center justify-center font-mono select-none px-6"
      >
        <div className="w-full max-w-md bg-[#0c0c10] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 animate-pulse" style={{ color: theme.accent }} />
              <span className="text-xs font-extrabold text-white tracking-wider uppercase">
                DevType // Cloud Boot
              </span>
            </div>
            <span className="text-[10px] text-neutral-500">v2.5</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-300">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: theme.accent }} />
            <span>{bootStepText}</span>
          </div>

          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full w-2/3 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <ResultsDashboard
        isGuest={!user}
        onRetrySync={handleRetrySync}
        stats={{ ...stats, maxStreak }}
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
        onRestart={() => resetEngine()}
        onNextRandom={() => {
          const fresh = rollRandomSnippet();
          resetEngine(fresh);
        }}
        onOpenModalTab={(tab) => {
          resetEngine();
          if (tab === 'profile') {
            setProfileModalOpen(true);
          } else if (tab === 'settings') {
            setSettingsModalOpen(true);
          } else {
            setPaletteTab(tab);
            setPaletteOpen(true);
          }
        }}
      />
    );
  }

  const dimChrome = focusZenDim && status === 'typing';

  return (
    <div
      data-ui-style={uiStyleId}
      style={
        {
          backgroundColor: theme.bg,
          '--dt-accent': theme.accent,
          '--dt-surface': theme.surface,
        } as React.CSSProperties
      }
      className="relative w-screen h-dvh max-h-dvh text-neutral-300 font-mono flex flex-col justify-between overflow-hidden select-none transition-colors duration-300 px-6 py-4"
    >
      {/* Dedicated Full-Page Studio Settings View */}
      <StudioSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        theme={theme}
        uiStyleId={uiStyleId}
        onSelectUiStyle={(styleId) => {
          setUiStyleId(styleId);
          try {
            localStorage.setItem('dt_ui_style', styleId);
          } catch {}
        }}
        showKeyboard={showKeyboard}
        onChangeShowKeyboard={(val) => {
          setShowKeyboard(val);
          try {
            localStorage.setItem('dt_show_keyboard', String(val));
          } catch {}
        }}
        fontSize={fontSize}
        onChangeFontSize={(sz) => {
          setFontSize(sz);
          try {
            localStorage.setItem('dt_font_size', String(sz));
          } catch {}
        }}
        caretSmoothness={caretSmoothness}
        onChangeCaretSmoothness={(val) => {
          setCaretSmoothness(val);
          try {
            localStorage.setItem('dt_smoothness', val);
          } catch {}
        }}
        caretShape={caretShape}
        onChangeCaretShape={(val) => {
          setCaretShape(val);
          try {
            localStorage.setItem('dt_shape', val);
          } catch {}
        }}
        errorMode={errorMode}
        onChangeErrorMode={(em) => {
          setErrorMode(em);
          try {
            localStorage.setItem('dt_error_mode', em);
          } catch {}
        }}
        velocityStretch={velocityStretch}
        onChangeVelocityStretch={setVelocityStretch}
        caretGlow={caretGlow}
        onChangeCaretGlow={setCaretGlow}
        focusZenDim={focusZenDim}
        onChangeFocusZenDim={setFocusZenDim}
        pacemakerWpm={pacemakerWpm}
        onChangePacemaker={setPacemakerWpm}
        soundProfile={soundProfile}
        onChangeSoundProfile={setSoundProfile}
      />

      <CommandPaletteModal
        isOpen={paletteOpen}
        initialTab={paletteTab}
        onClose={() => setPaletteOpen(false)}
        selectedLang={selectedLang}
        onSelectLanguage={handleSelectLanguage}
        selectedThemeId={themeId}
        onSelectTheme={(id) => {
          setThemeId(id);
          try {
            localStorage.setItem('dt_theme', id);
          } catch {}
        }}
        uiStyleId={uiStyleId}
        onSelectUiStyle={(styleId) => {
          setUiStyleId(styleId);
          try {
            localStorage.setItem('dt_ui_style', styleId);
          } catch {}
        }}
        errorMode={errorMode}
        onChangeErrorMode={(em) => {
          setErrorMode(em);
          try {
            localStorage.setItem('dt_error_mode', em);
          } catch {}
        }}
        onTriggerRandom={() => rollRandomSnippet()}
        onStartDailyChallenge={startDailyChallenge}
        onSubmitCustomChunks={(title, chunks, badge) => {
          setImportedChunks(chunks);
          setImportedMeta({ title, badge });
          setSelectedLang('custom');
          setActiveSnippet({
            langId: 'custom',
            label: 'Imported',
            filename: title,
            badge,
            category: 'GitHub',
            code: chunks[0],
          });
        }}
        currentCaretShape={caretShape}
        onChangeCaretShape={(val) => {
          setCaretShape(val);
          try {
            localStorage.setItem('dt_shape', val);
          } catch {}
        }}
        caretSmoothness={caretSmoothness}
        onChangeCaretSmoothness={(val) => {
          setCaretSmoothness(val);
          try {
            localStorage.setItem('dt_smoothness', val);
          } catch {}
        }}
        velocityStretch={velocityStretch}
        onChangeVelocityStretch={setVelocityStretch}
        caretGlow={caretGlow}
        onChangeCaretGlow={setCaretGlow}
        focusZenDim={focusZenDim}
        onChangeFocusZenDim={setFocusZenDim}
        pacemakerWpm={pacemakerWpm}
        onChangePacemaker={setPacemakerWpm}
        sessionLogs={sessionLogs}
        todayStr={todayStr}
        dailyBestWpm={dailyBestWpm}
      />

      <DeveloperProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onLoginUser={(u) => {
          setUser(u);
          try {
            localStorage.setItem('dt_user_profile', JSON.stringify(u));
          } catch {}
        }}
        onLogoutUser={() => {
          setUser(null);
          try {
            localStorage.removeItem('dt_user_profile');
          } catch {}
        }}
        sessionLogs={sessionLogs}
        todayStr={todayStr}
        accentColor={theme.accent}
        theme={theme}
      />

      {/* Ambient Spotlight + Dot Matrix */}
      <div
        className="pointer-events-none absolute -top-44 left-1/2 -translate-x-1/2 w-[960px] h-[380px] blur-3xl opacity-90 transition-all duration-500"
        style={{
          background: `radial-gradient(circle at center, ${theme.glow} 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 100%)',
        }}
      />

      <div className="relative z-20 w-full animate-studio-dock"><StudioHeaderDock
        theme={theme}
        uiStyle={uiStyle}
        dimChrome={dimChrome}
        currentLangSpec={currentLangSpec}
        lengthMode={lengthMode}
        gameMode={gameMode}
        soundProfile={soundProfile}
        caretSmoothness={caretSmoothness}
        ambientPlaying={ambientPlaying}
        showKeyboard={showKeyboard}
        user={user}
        onOpenPaletteTab={(tab) => {
          setPaletteTab(tab);
          setPaletteOpen(true);
        }}
        onOpenSettingsPage={() => setSettingsModalOpen(true)}
        onToggleKeyboard={() => {
          setShowKeyboard((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('dt_show_keyboard', String(next));
            } catch {}
            return next;
          });
        }}
        onSelectLength={(len) => {
          setLengthMode(len);
          rollRandomSnippet(selectedLang, len);
        }}
        onSelectGameMode={handleSelectGameMode}
        onRollRandom={() => rollRandomSnippet()}
        onToggleAmbient={toggleAmbientDrone}
        onCycleTheme={() => {
          const idx = STUDIO_THEMES.findIndex((t) => t.id === themeId);
          const next = STUDIO_THEMES[(idx + 1) % STUDIO_THEMES.length];
          setThemeId(next.id);
          try {
            localStorage.setItem('dt_theme', next.id);
          } catch {}
        }}
        onCycleUiStyle={() => {
          const idx = UI_STYLES.findIndex((s) => s.id === uiStyleId);
          const next = UI_STYLES[(idx + 1) % UI_STYLES.length];
          setUiStyleId(next.id);
          try {
            localStorage.setItem('dt_ui_style', next.id);
          } catch {}
        }}
        onCycleSound={() => {
          const order: SwitchProfile[] = ['thock', 'clack', 'click', 'off'];
          setSoundProfile(order[(order.indexOf(soundProfile) + 1) % order.length]);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
      /></div>

      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 min-h-0 flex flex-col justify-center gap-3.5 py-2 animate-studio-ide">
        {isVimMode ? (
          <VimDojoArena
            theme={theme}
            disabled={paletteOpen || profileModalOpen || settingsModalOpen}
            onPlayKeystroke={playKeystroke}
          />
        ) : (
          <IdeCodeViewport
            code={code}
            activeSnippet={activeSnippet}
            currentIndex={currentIndex}
            ghostIndex={ghostIndex}
            status={status}
            timeLeft={timeLeft}
            timeLimitSec={timeLimitSec}
            errors={errors}
            errorVersion={errorVersion}
            stats={stats}
            streak={streak}
            personalBest={personalBest}
            capsLockOn={capsLockOn}
            afkPausedWarning={afkPausedWarning}
            gameMode={gameMode}
            ghostChallengerWpm={ghostChallengerWpm}
            pacemakerWpm={pacemakerWpm}
            hasGhostTimeline={Boolean(ghostTimeline && ghostTimeline.length > 0)}
            theme={theme}
            uiStyle={uiStyle}
            showKeyboard={showKeyboard}
            fontSize={fontSize}
            caretShape={caretShape}
            caretSmoothness={caretSmoothness}
            velocityStretch={velocityStretch}
            caretGlow={caretGlow}
            sparkTriggerRef={sparkTriggerRef}
            onFinishZen={finishNow}
            onOpenProfile={() => setProfileModalOpen(true)}
            onResetEngine={() => resetEngine()}
          />
        )}

        {showKeyboard && (
          <div
            className={`hidden md:flex justify-center shrink-0 transition-opacity duration-300 ${
              dimChrome ? 'opacity-35' : 'opacity-100'
            }`}
          >
            <LiveKeyboardDeck
              activeKey={lastKeyPressed}
              mode="live"
              accentColor={theme.accent}
              capsLockOn={capsLockOn}
            />
          </div>
        )}
      </main>

      <footer
        className={`relative z-10 w-full max-w-7xl mx-auto shrink-0 flex items-center justify-between text-[11px] text-neutral-500 pl-28 pr-2 py-1 animate-studio-footer transition-opacity duration-300 ${
          dimChrome ? 'opacity-15' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" style={{ color: theme.accent }} />
            Glide: <strong className="text-neutral-300 uppercase">{caretSmoothness}</strong>
          </span>
          <span>•</span>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-1 hover:text-white cursor-pointer"
          >
            <Layers className="w-3 h-3" style={{ color: theme.accent }} />
            UI: <strong className="text-neutral-300 uppercase">{uiStyle.name}</strong>
          </button>
          <span>•</span>
          <button
            onClick={() => setShowKeyboard((k) => !k)}
            className="flex items-center gap-1 hover:text-white cursor-pointer"
          >
            <Keyboard className="w-3 h-3" style={{ color: theme.accent }} />
            Deck: <strong className="text-neutral-300">{showKeyboard ? 'ON' : 'OFF'}</strong>
          </button>
          <span>•</span>
          <span>
            Font: <strong className="text-neutral-300">{fontSize}px</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              Ctrl+,
            </kbd>{' '}
            Studio Settings
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              ⌘K
            </kbd>{' '}
            56 Languages
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              Alt+N
            </kbd>{' '}
            Shuffle Unseen
          </span>
        </div>
      </footer>
    </div>
  );
}
