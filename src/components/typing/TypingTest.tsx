'use client';
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
import { Zap, Layers } from 'lucide-react';

export default function TypingTest() {
  const [selectedLang, setSelectedLang] = useState<string>('typescript');
  const [lengthMode, setLengthMode] = useState<SnippetLength>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [errorMode, setErrorMode] = useState<ErrorMode>('forgiving');
  const [uiStyleId, setUiStyleId] = useState<UIStyleId>('glassmorphism');

  const [activeSnippet, setActiveSnippet] = useState<SnippetItem>(() => ({
    langId: 'typescript',
    label: 'TypeScript',
    filename: 'boot_stream.ts',
    badge: 'SYNTHETIC • TS 5.8',
    category: 'Web',
    code: 'export const ready = true;',
  }));

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

  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [personalBest, setPersonalBest] = useState<number>(0);
  const [dailyBestWpm, setDailyBestWpm] = useState<number>(0);
  const [sessionLogs, setSessionLogs] = useState<HistoryRecord[]>([]);
  const [cumulativeMissedKeys, setCumulativeMissedKeys] = useState<Record<string, number>>({});
  const [cumulativeWeakPatterns, setCumulativeWeakPatterns] = useState<Record<string, number>>({});
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'local' | 'syncing'>('local');

  const sparkTriggerRef = useRef<(() => void) | null>(null);

  // SSR-safe date initialization (avoids calling new Date() during Next.js 16 prerender)
  const [todayStr, setTodayStr] = useState<string>('2026-10-20');

  const theme = useMemo(
    () => STUDIO_THEMES.find((t) => t.id === themeId) || STUDIO_THEMES[0],
    [themeId]
  );

  const uiStyle = useMemo(
    () => UI_STYLES.find((s) => s.id === uiStyleId) || UI_STYLES[0],
    [uiStyleId]
  );

  const { playKeystroke, ambientPlaying, toggleAmbientDrone } = useMechanicalAudio(soundProfile);

  useEffect(() => {
    const currentIsoDate = new Date().toISOString().slice(0, 10);
    setTodayStr(currentIsoDate);

    try {
      const params = new URLSearchParams(window.location.search);
      const ghostParam = params.get('ghost');
      if (ghostParam) {
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
        }
      } else {
        const savedLang = localStorage.getItem('dt_last_lang') || pick(QUICK_LANGUAGES);
        setSelectedLang(savedLang);
        setActiveSnippet(getInstantUnseenSnippet(savedLang, 'medium'));
        harvestGitHubCorpusForLanguage(savedLang, true).catch(() => {});
      }

      const savedSmooth = localStorage.getItem('dt_smoothness') as CaretSmoothness | null;
      const savedShape = localStorage.getItem('dt_shape') as CaretShape | null;
      const savedTheme = localStorage.getItem('dt_theme');
      const savedUiStyle = localStorage.getItem('dt_ui_style') as UIStyleId | null;
      const savedErrorMode = localStorage.getItem('dt_error_mode') as ErrorMode | null;
      const savedLogs = localStorage.getItem('dt_session_logs');
      const savedDaily = localStorage.getItem(`dt_daily_pb_${currentIsoDate}`);
      const savedUser = localStorage.getItem('dt_user_profile');
      const savedMisses = localStorage.getItem('dt_missed_keys');
      const savedPatterns = localStorage.getItem('dt_weak_patterns');

      if (savedSmooth) setCaretSmoothness(savedSmooth);
      if (savedShape) setCaretShape(savedShape);
      if (savedTheme) setThemeId(savedTheme);
      if (savedUiStyle && UI_STYLES.some((s) => s.id === savedUiStyle)) {
        setUiStyleId(savedUiStyle);
      }
      if (savedErrorMode) setErrorMode(savedErrorMode);
      if (savedLogs) setSessionLogs(JSON.parse(savedLogs));
      if (savedDaily) setDailyBestWpm(parseInt(savedDaily, 10));
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedMisses) setCumulativeMissedKeys(JSON.parse(savedMisses));
      if (savedPatterns) setCumulativeWeakPatterns(JSON.parse(savedPatterns));
    } catch {
      setActiveSnippet(getInstantUnseenSnippet('typescript', 'medium'));
    }
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
      getNextCorpusSnippet(targetLang).catch(() => {});
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
    activeSnippet.code,
    handleKeystrokeFeedback,
    pacemakerWpm,
    paletteOpen || profileModalOpen || isVimMode,
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
    if (status === 'finished') {
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

      const lastMs =
        stats.keystrokeLog.length > 0
          ? stats.keystrokeLog[stats.keystrokeLog.length - 1].ms
          : 15000;
      const durationSec = Math.max(1, Math.round(lastMs / 1000));

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
        setCloudSyncStatus(res.ok ? 'synced' : 'local');
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
        setPaletteTab('settings');
        setPaletteOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        rollRandomSnippet();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [rollRandomSnippet]);

  if (status === 'finished') {
    return (
      <ResultsDashboard
        stats={{ ...stats, maxStreak }}
        history={history}
        code={code}
        languageLabel={activeSnippet.label}
        filename={activeSnippet.filename}
        personalBest={personalBest}
        sessionLogs={sessionLogs}
        ghostChallengerWpm={ghostChallengerWpm}
        cloudSyncStatus={cloudSyncStatus}
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
          } else {
            setPaletteTab(tab);
            setPaletteOpen(true);
          }
        }}
      />
    );
  }

  const dimChrome = focusZenDim && status === 'typing';
  const currentLangSpec = LANGUAGES.find((l) => l.id === selectedLang) || LANGUAGES[0];

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

      <StudioHeaderDock
        theme={theme}
        uiStyle={uiStyle}
        dimChrome={dimChrome}
        currentLangSpec={currentLangSpec}
        lengthMode={lengthMode}
        gameMode={gameMode}
        soundProfile={soundProfile}
        caretSmoothness={caretSmoothness}
        ambientPlaying={ambientPlaying}
        user={user}
        onOpenPaletteTab={(tab) => {
          setPaletteTab(tab);
          setPaletteOpen(true);
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
      />

      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col justify-center gap-3.5 py-2">
        {isVimMode ? (
          <VimDojoArena
            theme={theme}
            disabled={paletteOpen || profileModalOpen}
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
      </main>

      <footer
        className={`relative z-10 w-full max-w-6xl mx-auto shrink-0 flex items-center justify-between text-[11px] text-neutral-500 px-1 transition-opacity duration-300 ${
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
            onClick={() => {
              setPaletteTab('settings');
              setPaletteOpen(true);
            }}
            className="flex items-center gap-1 hover:text-white cursor-pointer"
          >
            <Layers className="w-3 h-3" style={{ color: theme.accent }} />
            UI: <strong className="text-neutral-300 uppercase">{uiStyle.name}</strong>
          </button>
          <span>•</span>
          <span>
            Policy: <strong className="text-neutral-300 uppercase">{errorMode}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              Ctrl+,
            </kbd>{' '}
            UI Style & Caret
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