'use client';
import { createClient } from '@/utils/supabase/client';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useCodeTypingEngine } from '@/hooks/useCodeTypingEngine';
import { useMechanicalAudio, SwitchProfile } from '@/hooks/useMechanicalAudio';
import LiveKeyboardDeck from '@/components/typing/LiveKeyboardDeck';
import StudioHeaderDock from '@/components/typing/StudioHeaderDock';
import VimDojoArena from '@/components/typing/VimDojoArena';
import IdeCodeViewport from '@/components/typing/IdeCodeViewport';
import { ModalTab } from '@/components/typing/CommandPaletteModal';
import StudioModalsHost from '@/components/typing/StudioModalsHost';
import ResultsViewContainer from '@/components/typing/ResultsViewContainer';
import { useSettingsStore } from '@/store/settings';
import {
  LANGUAGES,
  SnippetItem,
  SnippetLength,
  GameMode,
  HistoryRecord,
  DeveloperUser,
} from '@/constants/languages';
import { STUDIO_THEMES } from '@/constants/themes';
import { UI_STYLES } from '@/constants/uiStyles';
import {
  pick,
  applyMistakeTimeDecay,
} from '@/utils/codeSynthesizer';
import {
  getInstantUnseenSnippet,
  getNextCorpusSnippet,
  getWeakSpotsSnippet,
} from '@/utils/githubScraper';
import { Zap, Layers, Terminal, Loader2, Keyboard } from 'lucide-react';

export default function TypingTest() {
  const {
    theme: themeId,
    uiStyle: uiStyleId,
    caretShape,
    caretSmoothness,
    errorMode,
    fontSize,
    showKeyboard,
    lastLang: selectedLang,
    setLastLang: setSelectedLang,
    toggleShowKeyboard,
    cycleTheme,
    cycleUiStyle,
    hydrateAndMigrateLegacy,
  } = useSettingsStore();

  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [bootStepText, setBootStepText] = useState<string>(
    'Downloading user data & telemetry profile...'
  );

  const [lengthMode, setLengthMode] = useState<SnippetLength>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [activeSnippet, setActiveSnippet] = useState<SnippetItem | null>(null);

  const [importedChunks, setImportedChunks] = useState<string[]>([]);
  const [importedMeta, setImportedMeta] = useState<{ title: string; badge: string } | null>(null);

  const [ghostTimeline, setGhostTimeline] = useState<number[] | null>(null);
  const [ghostChallengerWpm, setGhostChallengerWpm] = useState<number | null>(null);

  const [soundProfile, setSoundProfile] = useState<SwitchProfile>('thock');
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
  const [todayStr, setTodayStr] = useState<string>('2026-10-23');
  const [lastRunSlowestKeys, setLastRunSlowestKeys] = useState<{ key: string; avgMs: number }[]>([]);

  const sparkTriggerRef = useRef<(() => void) | null>(null);

  const currentLangSpec = useMemo(
    () => LANGUAGES.find((l) => l.id === selectedLang) || LANGUAGES[0],
    [selectedLang]
  );

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
    const initializeDevType = async () => {
      hydrateAndMigrateLegacy();
      const currentIsoDate = new Date().toISOString().slice(0, 10);
      setTodayStr(currentIsoDate);

      const storeLang = useSettingsStore.getState().lastLang;
      const initialLang = LANGUAGES.some((l) => l.id === storeLang && l.enabled)
        ? storeLang
        : 'typescript';
      if (initialLang !== storeLang) {
        setSelectedLang(initialLang);
      }

      try {
        const savedLogs = localStorage.getItem('dt_session_logs');
        const savedDaily = localStorage.getItem(`dt_daily_pb_${currentIsoDate}`);
        const savedUser = localStorage.getItem('dt_user_profile');
        const savedMisses = localStorage.getItem('dt_missed_keys');
        const savedPatterns = localStorage.getItem('dt_weak_patterns');

        if (savedLogs) setSessionLogs(JSON.parse(savedLogs));
        if (savedDaily) setDailyBestWpm(parseInt(savedDaily, 10));

        const supabase = createClient();
        const {
          data: { user: realAuthUser },
        } = await supabase.auth.getUser();
        if (realAuthUser) {
          const savedParsed = savedUser ? JSON.parse(savedUser) : null;
          const handle =
            realAuthUser.user_metadata?.user_name ||
            realAuthUser.user_metadata?.preferred_username ||
            realAuthUser.email?.split('@')[0] ||
            'developer';
          const verifiedUser: DeveloperUser = {
            id: realAuthUser.id,
            username: handle,
            email: realAuthUser.email || `${handle}@github.user`,
            avatarUrl:
              realAuthUser.user_metadata?.avatar_url || `https://github.com/${handle}.png`,
            githubHandle: handle,
            title: savedParsed?.title || 'Full-Stack Systems Engineer',
            isCloudSynced: true,
            joinedAt: (realAuthUser.created_at || currentIsoDate).slice(0, 10),
            socials: savedParsed?.socials || {
              github: handle,
              location: 'India',
              bio: 'Building high-frequency web apps, low-latency engines & clean developer tools.',
            },
          };
          setUser(verifiedUser);
          localStorage.setItem('dt_user_profile', JSON.stringify(verifiedUser));
        } else {
          localStorage.removeItem('dt_user_profile');
          setUser(null);
        }

        const savedMistakesTsRaw = localStorage.getItem('dt_mistakes_updated_at');
        const savedMistakesTs = savedMistakesTsRaw ? parseInt(savedMistakesTsRaw, 10) : null;
        const nowMs = Date.now();
        let didDecayAny = false;

        if (savedMisses) {
          const parsedMisses = JSON.parse(savedMisses) as Record<string, number>;
          const { decayed, didDecay } = applyMistakeTimeDecay(
            parsedMisses,
            savedMistakesTs,
            nowMs
          );
          setCumulativeMissedKeys(decayed);
          if (didDecay) {
            localStorage.setItem('dt_missed_keys', JSON.stringify(decayed));
            didDecayAny = true;
          }
        }
        if (savedPatterns) {
          const parsedPatterns = JSON.parse(savedPatterns) as Record<string, number>;
          const { decayed, didDecay } = applyMistakeTimeDecay(
            parsedPatterns,
            savedMistakesTs,
            nowMs
          );
          setCumulativeWeakPatterns(decayed);
          if (didDecay) {
            localStorage.setItem('dt_weak_patterns', JSON.stringify(decayed));
            didDecayAny = true;
          }
        }
        if (!savedMistakesTs || didDecayAny) {
          localStorage.setItem('dt_mistakes_updated_at', String(nowMs));
        }
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

      setBootStepText('Loading code snippet from local corpus...');
      let freshSnippet = await getNextCorpusSnippet(initialLang, 'medium');
      if (!freshSnippet) {
        freshSnippet = getInstantUnseenSnippet(initialLang, 'medium');
      }
      setActiveSnippet(freshSnippet);

      setTimeout(() => setIsBooting(false), 550);
    };

    initializeDevType();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user;
      if (authUser) {
        const handle =
          authUser.user_metadata?.user_name ||
          authUser.user_metadata?.preferred_username ||
          authUser.email?.split('@')[0] ||
          'developer';
        setUser((prev) => {
          const verified: DeveloperUser = {
            id: authUser.id,
            username: handle,
            email: authUser.email || `${handle}@github.user`,
            avatarUrl:
              authUser.user_metadata?.avatar_url || `https://github.com/${handle}.png`,
            githubHandle: handle,
            title: prev?.title || 'Full-Stack Systems Engineer',
            isCloudSynced: true,
            joinedAt: (authUser.created_at || new Date().toISOString()).slice(0, 10),
            socials: prev?.socials || {
              github: handle,
              location: 'India',
              bio: 'Building high-frequency web apps, low-latency engines & clean developer tools.',
            },
          };
          try {
            localStorage.setItem('dt_user_profile', JSON.stringify(verified));
          } catch {}
          return verified;
        });
      } else {
        setUser(null);
        try {
          localStorage.removeItem('dt_user_profile');
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrateAndMigrateLegacy, setSelectedLang]);

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
        const coachItem = getWeakSpotsSnippet(
          targetLang,
          targetLen,
          cumulativeMissedKeys,
          cumulativeWeakPatterns
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
    ]
  );

  const startDailyChallenge = useCallback(() => {
    setGhostTimeline(null);
    setGhostChallengerWpm(null);
    setGameMode('daily');
    setActiveSnippet(getInstantUnseenSnippet(selectedLang, 'medium'));
  }, [selectedLang]);

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
  } = useCodeTypingEngine({
    initialSnippet: activeSnippet?.code || 'export const ready = true;',
    onKeystrokeFeedback: handleKeystrokeFeedback,
    pacemakerWpm,
    disabled: paletteOpen || profileModalOpen || settingsModalOpen || isVimMode || isBooting,
    timeLimitSec,
    onRequestNextSnippet: requestStreamChunk,
    suddenDeath: isSuddenDeath,
    endlessMode: isZenMode,
    ghostTimestampsMs: ghostTimeline,
    errorMode,
  });

  const handleSelectLanguage = useCallback(
    (langId: string) => {
      setSelectedLang(langId);
      if (gameMode === 'daily') {
        setActiveSnippet(getInstantUnseenSnippet(langId, 'medium'));
      } else {
        rollRandomSnippet(langId, lengthMode);
      }
    },
    [setSelectedLang, gameMode, lengthMode, rollRandomSnippet]
  );

  const handleSelectGameMode = useCallback(
    (mode: GameMode) => {
      if (mode === 'daily') {
        startDailyChallenge();
      } else if (mode === 'smartcoach') {
        setGameMode('smartcoach');
        setActiveSnippet(
          getWeakSpotsSnippet(
            selectedLang,
            lengthMode,
            cumulativeMissedKeys,
            cumulativeWeakPatterns
          )
        );
      } else {
        setGameMode(mode);
      }
    },
    [
      startDailyChallenge,
      selectedLang,
      lengthMode,
      cumulativeMissedKeys,
      cumulativeWeakPatterns,
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
                DevType // Studio Boot
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
      <ResultsViewContainer
        user={user}
        stats={stats}
        maxStreak={maxStreak}
        history={history}
        code={code}
        currentIndex={currentIndex}
        timeLimitSec={timeLimitSec}
        activeSnippet={activeSnippet}
        selectedLang={selectedLang}
        gameMode={gameMode}
        lengthMode={lengthMode}
        todayStr={todayStr}
        personalBest={personalBest}
        onUpdatePersonalBest={(pb) => {
          setPersonalBest(pb);
          try {
            localStorage.setItem(`devtype_pb_${selectedLang}_${gameMode}`, String(pb));
          } catch {}
        }}
        dailyBestWpm={dailyBestWpm}
        onUpdateDailyBestWpm={(pb) => {
          setDailyBestWpm(pb);
          try {
            localStorage.setItem(`dt_daily_pb_${todayStr}`, String(pb));
          } catch {}
        }}
        sessionLogs={sessionLogs}
        onAppendSessionLog={(newEntry) => {
          try {
            setSessionLogs((prev) => {
              const updated = [...prev.slice(-399), newEntry];
              localStorage.setItem('dt_session_logs', JSON.stringify(updated));
              return updated;
            });
          } catch {}
        }}
        onRecordMistakes={(missedKeys, weakPatterns) => {
          if (stats.keystrokeLog && stats.keystrokeLog.length > 0) {
            const sums = new Map<string, { totalMs: number; count: number }>();
            for (const ks of stats.keystrokeLog) {
              if (ks.deltaMs <= 15 || ks.deltaMs >= 2500) continue;
              const label =
                ks.expected === '\n'
                  ? 'Enter'
                  : ks.expected === ' '
                  ? 'Space'
                  : ks.expected;
              const prev = sums.get(label) || { totalMs: 0, count: 0 };
              sums.set(label, { totalMs: prev.totalMs + ks.deltaMs, count: prev.count + 1 });
            }
            const slowest = Array.from(sums.entries())
              .map(([key, v]) => ({ key, avgMs: Math.round(v.totalMs / v.count) }))
              .sort((a, b) => b.avgMs - a.avgMs)
              .slice(0, 3);
            setLastRunSlowestKeys(slowest);
          }
          setCumulativeMissedKeys((prev) => {
            const next = { ...prev };
            Object.entries(missedKeys).forEach(([k, v]) => {
              next[k] = (next[k] || 0) + v;
            });
            try {
              localStorage.setItem('dt_missed_keys', JSON.stringify(next));
            } catch {}
            return next;
          });

          setCumulativeWeakPatterns((prev) => {
            const next = { ...prev };
            Object.entries(weakPatterns).forEach(([k, v]) => {
              next[k] = (next[k] || 0) + v;
            });
            try {
              localStorage.setItem('dt_weak_patterns', JSON.stringify(next));
              localStorage.setItem('dt_mistakes_updated_at', String(Date.now()));
            } catch {}
            return next;
          });
        }}
        ghostChallengerWpm={ghostChallengerWpm}
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
      <StudioModalsHost
        theme={theme}
        settingsModalOpen={settingsModalOpen}
        onCloseSettingsModal={() => setSettingsModalOpen(false)}
        paletteOpen={paletteOpen}
        paletteTab={paletteTab}
        onClosePalette={() => setPaletteOpen(false)}
        profileModalOpen={profileModalOpen}
        onCloseProfileModal={() => setProfileModalOpen(false)}
        selectedLang={selectedLang}
        onSelectLanguage={handleSelectLanguage}
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
        user={user}
        onChangeUser={setUser}
        sessionLogs={sessionLogs}
        todayStr={todayStr}
        dailyBestWpm={dailyBestWpm}
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

      <div className="relative z-20 w-full animate-studio-dock">
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
          showKeyboard={showKeyboard}
          user={user}
          onOpenPaletteTab={(tab) => {
            setPaletteTab(tab);
            setPaletteOpen(true);
          }}
          onOpenSettingsPage={() => setSettingsModalOpen(true)}
          onToggleKeyboard={toggleShowKeyboard}
          onSelectLength={(len) => {
            setLengthMode(len);
            rollRandomSnippet(selectedLang, len);
          }}
          onSelectGameMode={handleSelectGameMode}
          onRollRandom={() => rollRandomSnippet()}
          onToggleAmbient={toggleAmbientDrone}
          onCycleTheme={cycleTheme}
          onCycleUiStyle={cycleUiStyle}
          onCycleSound={() => {
            const order: SwitchProfile[] = ['thock', 'clack', 'click', 'off'];
            setSoundProfile(order[(order.indexOf(soundProfile) + 1) % order.length]);
          }}
          onOpenProfile={() => setProfileModalOpen(true)}
        />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 min-h-0 flex flex-col justify-center gap-3.5 py-2 animate-studio-ide">
        {isVimMode ? (
          <VimDojoArena
            theme={theme}
            disabled={paletteOpen || profileModalOpen || settingsModalOpen}
            onPlayKeystroke={playKeystroke}
          />
        ) : (
          <>
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
          {lengthMode === 'short' && lastRunSlowestKeys.length > 0 && (
            <div className="flex items-center justify-center gap-3 text-[11px] text-neutral-400 px-3 py-1">
              <span className="text-neutral-500">Slowest keys (previous run):</span>
              {lastRunSlowestKeys.map((item) => (
                <span
                  key={item.key}
                  className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-neutral-200 font-mono"
                >
                  <strong style={{ color: theme.accent }}>{item.key}</strong> {item.avgMs}ms
                </span>
              ))}
            </div>
          )}
          </>
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
        className={`relative z-10 w-full max-w-7xl mx-auto shrink-0 flex items-center justify-center text-[11px] text-neutral-400 py-1 animate-studio-footer transition-opacity duration-300 ${
          dimChrome ? 'opacity-15' : 'opacity-100'
        }`}
      >
        <span>Esc restart · Tab skip indent · Ctrl+K commands</span>
      </footer>
    </div>
  );
}
