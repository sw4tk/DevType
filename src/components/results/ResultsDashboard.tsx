'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts';
import { SessionStats, TelemetryPoint } from '@/hooks/useCodeTypingEngine';
import { HistoryRecord } from '@/constants/languages';
import { StudioTheme, STUDIO_THEMES } from '@/constants/themes';
import {
  fetchSupabaseTableStats,
  isSupabaseConfigured,
} from '@/utils/supabaseClient';
import { seedSupabaseCorpusNow } from '@/utils/githubScraper';
import LiveKeyboardDeck from '@/components/typing/LiveKeyboardDeck';
import {
  RotateCcw,
  Flame,
  Trophy,
  Zap,
  Play,
  Keyboard,
  Download,
  Check,
  Terminal,
  Code2,
  Activity,
  Swords,
  Shuffle,
  Cpu,
  CheckCircle2,
  BarChart3,
  Clock,
  AlertTriangle,
  Database,
  Loader2,
} from 'lucide-react';

interface ResultsProps {
  stats: SessionStats;
  history: TelemetryPoint[];
  code: string;
  languageLabel?: string;
  filename?: string;
  personalBest: number;
  sessionLogs?: HistoryRecord[];
  ghostChallengerWpm?: number | null;
  cloudSyncStatus?: 'synced' | 'local' | 'syncing';
  theme?: StudioTheme;
  onRestart: () => void;
  onNextRandom?: () => void;
  onOpenModalTab?: (
    tab: 'languages' | 'themes' | 'github' | 'settings' | 'profile' | 'daily'
  ) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function ResultsDashboard({
  stats,
  history,
  code,
  languageLabel = 'TypeScript',
  filename = 'binarySearch.ts',
  personalBest,
  sessionLogs = [],
  ghostChallengerWpm,
  cloudSyncStatus = 'local',
  theme = STUDIO_THEMES[0],
  onRestart,
  onNextRandom,
  onOpenModalTab,
}: ResultsProps) {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'heatmap' | 'replay'>('telemetry');
  const [replayIndex, setReplayIndex] = useState(0);
  const [ghostLinkCopied, setGhostLinkCopied] = useState(false);
  const [cardExported, setCardExported] = useState(false);

  // Live Supabase DB Row Counter & Seeder State
  const [dbStats, setDbStats] = useState<{ sessionsCount: number; corpusCount: number } | null>(
    null
  );
  const [isSeedingDb, setIsSeedingDb] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchSupabaseTableStats().then((res) => {
        if (!res.error) {
          setDbStats({ sessionsCount: res.sessionsCount, corpusCount: res.corpusCount });
        }
      });
    }
  }, [cloudSyncStatus]);

  const handleSeedDatabaseNow = async () => {
    setIsSeedingDb(true);
    await seedSupabaseCorpusNow();
    const updated = await fetchSupabaseTableStats();
    if (!updated.error) {
      setDbStats({ sessionsCount: updated.sessionsCount, corpusCount: updated.corpusCount });
    }
    setIsSeedingDb(false);
  };

  const metrics = useMemo(() => {
    const isInvalid = Boolean(stats.isFlaggedInvalid || stats.accuracy < 45);
    const earnedXp = isInvalid
      ? 0
      : Math.max(110, code.length * 3 + stats.wpm * 7 + stats.maxStreak * 4);
    const historicalXp = sessionLogs.reduce(
      (acc, r) => acc + (r.chars || 120) * 3 + r.wpm * 7,
      3600
    );
    const totalXp = historicalXp + earnedXp;
    const level = Math.max(1, Math.floor(totalXp / 5000) + 1);
    const levelXp = totalXp % 5000;
    const levelPct = Math.min(100, Math.max(10, Math.round((levelXp / 5000) * 100)));

    const highestWpm = Math.max(
      personalBest,
      isInvalid ? 0 : stats.wpm,
      sessionLogs.reduce((m, r) => Math.max(m, r.wpm), 0)
    );
    const bestAccuracy = Math.max(
      stats.accuracy,
      sessionLogs.reduce((m, r) => Math.max(m, r.accuracy), 0)
    );
    const totalMisses = Object.values(stats.errorBreakdown).reduce((a, b) => a + b, 0);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const todayIdx = (new Date().getDay() + 6) % 7;
    const weekDays = dayLabels.map((d, idx) => ({
      label: d,
      done: idx <= todayIdx,
    }));

    return {
      isInvalid,
      earnedXp,
      level,
      levelXp,
      levelPct,
      highestWpm,
      bestAccuracy,
      totalMisses,
      weekDays,
      streakDays: Math.max(1, sessionLogs.length + 1),
    };
  }, [code.length, stats, personalBest, sessionLogs]);

  // Edge Case Guard: If a short snippet finished in <1.5s before the periodic ticker fired,
  // synthesize a smooth multi-point curve directly from `keystrokeLog` so the chart never flatlines!
  const chartData = useMemo(() => {
    if (history.length >= 2) {
      return history.map((h, idx) => ({
        time: `${Math.max(1, Math.round(h.ms / 1000)) || idx + 1}s`,
        wpm: h.wpm,
        raw: h.rawWpm,
      }));
    }

    if (stats.keystrokeLog.length >= 4) {
      const slices = 6;
      const step = Math.max(1, Math.floor(stats.keystrokeLog.length / slices));
      const points: { time: string; wpm: number; raw: number }[] = [];
      for (let i = step; i <= stats.keystrokeLog.length; i += step) {
        const entry = stats.keystrokeLog[Math.min(i - 1, stats.keystrokeLog.length - 1)];
        const min = Math.max(entry.ms / 60000, 0.01);
        const correctSlice = stats.keystrokeLog.slice(0, i).filter((k) => !k.isError).length;
        points.push({
          time: `${(entry.ms / 1000).toFixed(1)}s`,
          wpm: Math.min(320, Math.round(correctSlice / 5 / min)),
          raw: Math.min(350, Math.round(i / 5 / min)),
        });
      }
      return points;
    }

    return [
      { time: '0.5s', wpm: Math.round(stats.wpm * 0.82), raw: stats.rawWpm },
      { time: '1.0s', wpm: Math.round(stats.wpm * 0.94), raw: stats.rawWpm },
      { time: '1.5s', wpm: stats.wpm, raw: stats.rawWpm },
    ];
  }, [history, stats.keystrokeLog, stats.wpm, stats.rawWpm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onRestart();
      } else if (e.key === 'Tab' && onNextRandom) {
        e.preventDefault();
        onNextRandom();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart, onNextRandom]);

  useEffect(() => {
    if (activeTab !== 'replay' || stats.keystrokeLog.length === 0) return;
    setReplayIndex(0);
    const timers: NodeJS.Timeout[] = [];
    stats.keystrokeLog.forEach((entry) => {
      const t = setTimeout(() => {
        setReplayIndex(entry.index + 1);
      }, Math.round(entry.ms * 0.65));
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [activeTab, stats.keystrokeLog]);

  const handleCopyGhostRaceLink = useCallback(() => {
    try {
      const compactTimeline = stats.keystrokeLog
        .filter((k) => !k.isError)
        .slice(0, 260)
        .map((k) => Math.round(k.ms));
      const payload = {
        c: code.slice(0, 450),
        l: languageLabel,
        f: filename,
        w: stats.wpm,
        t: compactTimeline,
      };
      const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
      const url = `${window.location.origin}${window.location.pathname}?ghost=${encoded}`;
      navigator.clipboard.writeText(url);
      setGhostLinkCopied(true);
      setTimeout(() => setGhostLinkCopied(false), 2500);
    } catch {}
  }, [code, languageLabel, filename, stats.wpm, stats.keystrokeLog]);

  const handleExportTelemetryCard = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, 1200, 630);

    const grad = ctx.createRadialGradient(600, 90, 20, 600, 240, 560);
    grad.addColorStop(0, `${theme.accent}33`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, 1112, 542);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('>_ DevType', 84, 108);

    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${languageLabel} • ${filename} • +${metrics.earnedXp} XP`, 310, 106);

    const kpis = [
      { label: 'NET WPM', val: `${stats.wpm}`, color: theme.accent },
      { label: 'PRECISION', val: `${stats.accuracy}%`, color: '#ffffff' },
      { label: 'PEAK BURST', val: `${stats.peakWpm || stats.rawWpm}`, color: '#a1a1aa' },
      { label: 'PEAK STREAK', val: `${stats.maxStreak}x`, color: '#f59e0b' },
      { label: 'CONSISTENCY', val: `${stats.consistency}%`, color: '#22d3ee' },
    ];

    kpis.forEach((k, idx) => {
      const x = 84 + idx * 210;
      const y = 148;
      ctx.fillStyle = theme.surface;
      ctx.fillRect(x, y, 190, 125);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.strokeRect(x, y, 190, 125);

      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(k.label, x + 18, y + 36);

      ctx.fillStyle = k.color;
      ctx.font = 'bold 42px monospace';
      ctx.fillText(k.val, x + 18, y + 94);
    });

    ctx.fillStyle = '#07070a';
    ctx.fillRect(84, 300, 1032, 240);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(84, 300, 1032, 240);

    const pts = chartData.map((d) => d.wpm);
    const maxW = Math.max(...pts, 80) * 1.15;

    ctx.beginPath();
    pts.forEach((val, idx) => {
      const px = 114 + (idx / Math.max(1, pts.length - 1)) * 972;
      const py = 510 - (val / maxW) * 170;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `devtype-${stats.wpm}wpm-${languageLabel.toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();

    setCardExported(true);
    setTimeout(() => setCardExported(false), 2500);
  }, [stats, chartData, languageLabel, filename, theme, metrics.earnedXp]);

  return (
    <div
      style={{ backgroundColor: theme.bg }}
      className="relative w-screen h-dvh max-h-dvh text-neutral-300 font-mono flex flex-col justify-between overflow-hidden select-none px-6 py-4"
    >
      <div
        className="pointer-events-none absolute -top-44 left-1/2 -translate-x-1/2 w-[960px] h-[380px] blur-3xl opacity-90"
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

      {/* TOP STUDIO DOCK */}
      <header className="relative z-10 w-full max-w-6xl mx-auto shrink-0">
        <div
          style={{ backgroundColor: `${theme.surface}e0` }}
          className="flex flex-wrap items-center justify-between gap-3 backdrop-blur-2xl border border-white/[0.08] px-4 py-2 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_15px_35px_rgba(0,0,0,0.6)]"
        >
          {/* Left: Brand + Build Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-xl border border-white/15 bg-black/40"
                style={{ color: theme.accent }}
              >
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-sm">
                Dev<span style={{ color: theme.accent }}>Type</span>
              </span>
            </div>

            <div className="h-4 w-[1px] bg-white/10" />

            {metrics.isInvalid ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>BUILD FAILED: SYNTAX CORRUPTION (&lt;45% ACC)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/45 border border-white/[0.07] text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                <span className="text-white font-bold">BUILD SUCCEEDED</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300">{filename}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] font-bold"
                  style={{ color: theme.accent }}
                >
                  +{metrics.earnedXp} XP
                </span>
              </div>
            )}

            {/* Live Supabase Database Status & 1-Click Seeder Pill */}
            {dbStats !== null && (
              <button
                onClick={handleSeedDatabaseNow}
                disabled={isSeedingDb}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold cursor-pointer transition-all"
                title="Click to harvest & seed 150+ fresh GitHub snippets into your Supabase code_corpus table"
              >
                {isSeedingDb ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                <span>
                  DB: {dbStats.sessionsCount} runs • {dbStats.corpusCount} snippets
                  {dbStats.corpusCount === 0 ? ' (Click to Seed DB!)' : ''}
                </span>
              </button>
            )}
          </div>

          {/* Right: Action Bar */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => onOpenModalTab?.('profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-white/[0.07] border border-white/[0.08] text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="hidden sm:inline">Career Dossier</span>
            </button>

            <button
              onClick={handleExportTelemetryCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-white/[0.07] border border-white/[0.08] text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              {cardExported ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                  <span className="hidden sm:inline">OG PNG</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyGhostRaceLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all cursor-pointer"
            >
              {ghostLinkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Swords className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ghost Link</span>
                </>
              )}
            </button>

            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>

            {onNextRandom && (
              <button
                onClick={onNextRandom}
                style={{ backgroundColor: theme.accent }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-neutral-950 font-extrabold transition-all cursor-pointer shadow-lg hover:opacity-90"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Next Code (Tab)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CENTER STAGE: UNIFIED IDE PROFILER & TELEMETRY WINDOW */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col justify-center gap-3.5 py-2"
      >
        <motion.div
          variants={itemVariants}
          style={{ backgroundColor: `${theme.surface}e6` }}
          className="relative flex flex-col rounded-2xl backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_25px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          <div
            className="w-full h-[2.5px] shrink-0"
            style={{
              backgroundColor: metrics.isInvalid ? '#ef4444' : theme.accent,
              boxShadow: `0 0 12px ${metrics.isInvalid ? '#ef4444' : theme.accent}`,
            }}
          />

          {/* IDE Window Titlebar + View Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-2.5 border-b border-white/[0.06] bg-black/35 text-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90" />
              </div>
              <div className="h-3.5 w-[1px] bg-white/10" />

              <div className="flex items-center gap-1 bg-black/45 p-0.5 rounded-lg border border-white/[0.06]">
                <button
                  onClick={() => setActiveTab('telemetry')}
                  style={
                    activeTab === 'telemetry'
                      ? { color: theme.accent, borderColor: `${theme.accent}44` }
                      : undefined
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'telemetry'
                      ? 'bg-white/[0.08] border'
                      : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>profiler.trace</span>
                </button>

                <button
                  onClick={() => setActiveTab('heatmap')}
                  style={
                    activeTab === 'heatmap'
                      ? { color: theme.accent, borderColor: `${theme.accent}44` }
                      : undefined
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'heatmap'
                      ? 'bg-white/[0.08] border'
                      : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <Keyboard className="w-3 h-3" />
                  <span>keymatrix.map ({metrics.totalMisses} errs)</span>
                </button>

                <button
                  onClick={() => setActiveTab('replay')}
                  style={
                    activeTab === 'replay'
                      ? { color: theme.accent, borderColor: `${theme.accent}44` }
                      : undefined
                  }
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'replay'
                      ? 'bg-white/[0.08] border'
                      : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>ghost.replay</span>
                </button>
              </div>
            </div>

            {/* Right Token Diagnostics Readout */}
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-neutral-500">
                brackets:{' '}
                <strong
                  className={
                    stats.errorBreakdown.brackets > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }
                >
                  {stats.errorBreakdown.brackets}
                </strong>
              </span>
              <span className="text-neutral-500">
                operators:{' '}
                <strong
                  className={
                    stats.errorBreakdown.operators > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }
                >
                  {stats.errorBreakdown.operators}
                </strong>
              </span>
              <span className="text-neutral-500">
                punctuation:{' '}
                <strong
                  className={
                    stats.errorBreakdown.punctuation > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }
                >
                  {stats.errorBreakdown.punctuation}
                </strong>
              </span>
              <span className="text-neutral-500 hidden sm:inline">
                jitter:{' '}
                <strong className="text-cyan-300">±{stats.jitterMs || 12}ms</strong>
              </span>
            </div>
          </div>

          {/* 5-Column Compiler Telemetry Strip Inside the IDE Window */}
          <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-white/[0.06] bg-black/20 divide-x divide-white/[0.06]">
            <div className="px-5 py-3">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                <span>Net Velocity</span>
                <Zap className="w-3 h-3" style={{ color: theme.accent }} />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold" style={{ color: theme.accent }}>
                  {stats.wpm}
                </span>
                <span className="text-xs text-neutral-500">WPM</span>
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">
                Precision
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-white">{stats.accuracy}%</span>
                <span
                  className={`text-[10px] ${
                    stats.accuracy >= 95
                      ? 'text-emerald-400'
                      : stats.accuracy < 45
                      ? 'text-red-400'
                      : 'text-amber-300'
                  }`}
                >
                  {stats.accuracy >= 95 ? 'OPTIMAL' : stats.accuracy < 45 ? 'CORRUPT' : 'NOMINAL'}
                </span>
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">
                Peak Burst / Raw
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-neutral-200">
                  {stats.peakWpm || stats.rawWpm}
                </span>
                <span className="text-xs text-neutral-500">({stats.rawWpm} raw)</span>
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                <span>Max Combo</span>
                <Flame className="w-3 h-3 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-amber-400">{stats.maxStreak}x</span>
              </div>
            </div>

            <div className="px-5 py-3 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                <span>Consistency</span>
                <Cpu className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-cyan-300">{stats.consistency}%</span>
              </div>
            </div>
          </div>

          {/* Center Interactive Viewport */}
          <div className="relative h-[215px] sm:h-[240px] px-5 py-3 flex flex-col justify-center">
            {activeTab === 'telemetry' && (
              <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ideWpmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.accent} stopOpacity={0.38} />
                        <stop offset="95%" stopColor={theme.accent} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.04)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#3f3f46"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#3f3f46"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme.bg,
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="raw"
                      stroke="#52525b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={0}
                    />
                    <Area
                      type="monotone"
                      dataKey="wpm"
                      stroke={theme.accent}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ideWpmGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'heatmap' && (
              <div className="w-full flex items-center justify-center overflow-x-auto">
                <LiveKeyboardDeck
                  missedKeys={stats.missedKeys}
                  mode="heatmap"
                  accentColor={theme.accent}
                />
              </div>
            )}

            {activeTab === 'replay' && (
              <pre className="w-full h-full text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-y-auto bg-black/45 p-4 rounded-xl border border-white/[0.06]">
                <span style={{ color: theme.accent }}>{code.slice(0, replayIndex)}</span>
                <span
                  style={{ backgroundColor: theme.accent }}
                  className="text-black px-0.5 font-bold"
                >
                  {code[replayIndex] || ' '}
                </span>
                <span className="text-neutral-600">{code.slice(replayIndex + 1)}</span>
              </pre>
            )}
          </div>
        </motion.div>

        {/* BOTTOM 3-PANE IDE STATUS INSPECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 shrink-0">
          <motion.div
            variants={itemVariants}
            style={{ backgroundColor: `${theme.surface}d9` }}
            className="rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Code2 className="w-4 h-4" style={{ color: theme.accent }} />
                <span>COMPILER XP & LEVEL</span>
              </div>
              <span className="text-xs font-extrabold" style={{ color: theme.accent }}>
                LVL {metrics.level}
              </span>
            </div>

            <div className="my-2.5">
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.levelPct}%`,
                    backgroundColor: theme.accent,
                    boxShadow: `0 0 10px ${theme.accent}`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Earned +{metrics.earnedXp} XP</span>
              <span>{metrics.levelXp.toLocaleString()} / 5,000 XP</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{ backgroundColor: `${theme.surface}d9` }}
            className="rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>BENCHMARK LEDGER</span>
              </div>
              <span className="text-[10px] text-neutral-500 uppercase">{languageLabel}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-black/35 rounded-xl p-2 border border-white/[0.05]">
              <div>
                <div className="text-[9px] text-neutral-500 uppercase">Peak WPM</div>
                <div className="text-sm font-extrabold text-white mt-0.5">
                  {metrics.highestWpm}
                </div>
              </div>
              <div className="border-x border-white/[0.06]">
                <div className="text-[9px] text-neutral-500 uppercase">Best Acc</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  {metrics.bestAccuracy}%
                </div>
              </div>
              <div>
                <div className="text-[9px] text-neutral-500 uppercase">Combo</div>
                <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                  {stats.maxStreak}x
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{ backgroundColor: `${theme.surface}d9` }}
            className="rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Clock className="w-4 h-4" style={{ color: theme.accent }} />
                <span>COMMIT STREAK</span>
              </div>
              <span className="text-xs font-extrabold text-amber-400">
                {metrics.streakDays} DAYS
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/35 rounded-xl px-3 py-2 border border-white/[0.05]">
              {metrics.weekDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    style={
                      d.done
                        ? {
                            borderColor: theme.accent,
                            backgroundColor: `${theme.accent}33`,
                          }
                        : undefined
                    }
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      d.done ? '' : 'border-white/15 bg-white/[0.02]'
                    }`}
                  >
                    {d.done && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    )}
                  </div>
                  <span className="text-[9px] text-neutral-500">{d.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.main>

      <footer className="relative z-10 w-full max-w-6xl mx-auto shrink-0 flex items-center justify-between text-[11px] text-neutral-500 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" style={{ color: theme.accent }} />
          <span>
            Theme: <strong className="text-neutral-300">{theme.name}</strong> • Cloud Sync:{' '}
            <strong className="text-emerald-400 uppercase">{cloudSyncStatus}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              Tab
            </kbd>{' '}
            Next Random Snippet
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              Enter
            </kbd>{' '}
            Retry Same
          </span>
        </div>
      </footer>
    </div>
  );
}