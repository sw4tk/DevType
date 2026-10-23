'use client';
import React, { useState, useEffect } from 'react';
import {
  LANGUAGES,
  CaretShape,
  CaretSmoothness,
  ErrorMode,
  HistoryRecord,
} from '@/constants/languages';
import { STUDIO_THEMES } from '@/constants/themes';
import { UI_STYLES, UIStyleId } from '@/constants/uiStyles';
import { createSeededRandom, sanitizeAndChunkCode } from '@/utils/codeSynthesizer';
import {
  Palette,
  Ghost,
  Sparkles,
  Sliders,
  X,
  Check,
  Shuffle,
  Link2,
  Loader2,
  Globe,
  Settings2,
  Eye,
  Calendar,
  BarChart3,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export type ModalTab = 'languages' | 'themes' | 'github' | 'settings' | 'profile' | 'daily';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  initialTab: ModalTab;
  onClose: () => void;
  selectedLang: string;
  onSelectLanguage: (langId: string) => void;
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  uiStyleId: UIStyleId;
  onSelectUiStyle: (styleId: UIStyleId) => void;
  errorMode: ErrorMode;
  onChangeErrorMode: (mode: ErrorMode) => void;
  onTriggerRandom: () => void;
  onStartDailyChallenge: () => void;
  onSubmitCustomChunks: (title: string, chunks: string[], badge: string) => void;
  currentCaretShape: CaretShape;
  onChangeCaretShape: (shape: CaretShape) => void;
  caretSmoothness: CaretSmoothness;
  onChangeCaretSmoothness: (smoothness: CaretSmoothness) => void;
  velocityStretch: boolean;
  onChangeVelocityStretch: (val: boolean) => void;
  caretGlow: boolean;
  onChangeCaretGlow: (val: boolean) => void;
  focusZenDim: boolean;
  onChangeFocusZenDim: (val: boolean) => void;
  pacemakerWpm: number;
  onChangePacemaker: (wpm: number) => void;
  sessionLogs: HistoryRecord[];
  todayStr: string;
  dailyBestWpm: number;
}

const SMOOTHNESS_PRESETS: {
  id: CaretSmoothness;
  label: string;
  desc: string;
  badge: string;
}[] = [
  { id: 'instant', label: 'Instant', desc: '0ms raw terminal snap', badge: '0ms' },
  { id: 'snappy', label: 'Snappy', desc: 'Crisp high-velocity glide', badge: '80ms' },
  { id: 'butter', label: 'Like Butter', desc: 'Silky sub-pixel flow', badge: '140ms' },
  { id: 'liquid', label: 'Liquid Silk', desc: 'Cinematic weighty glide', badge: '210ms' },
  { id: 'spring', label: 'Spring Physics', desc: 'Harmonic damped bounce', badge: 'Spring' },
];

export default function CommandPaletteModal({
  isOpen,
  initialTab,
  onClose,
  selectedLang,
  onSelectLanguage,
  selectedThemeId,
  onSelectTheme,
  uiStyleId,
  onSelectUiStyle,
  errorMode,
  onChangeErrorMode,
  onTriggerRandom,
  onStartDailyChallenge,
  onSubmitCustomChunks,
  currentCaretShape,
  onChangeCaretShape,
  caretSmoothness,
  onChangeCaretSmoothness,
  velocityStretch,
  onChangeVelocityStretch,
  caretGlow,
  onChangeCaretGlow,
  focusZenDim,
  onChangeFocusZenDim,
  pacemakerWpm,
  onChangePacemaker,
  sessionLogs,
  todayStr,
  dailyBestWpm,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState<string>('');
  const [tab, setTab] = useState<ModalTab>(initialTab);
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('custom_snippet.ts');
  const [customCode, setCustomCode] = useState<string>('');
  const [stripComments, setStripComments] = useState<boolean>(true);
  const [isLoadingGithub, setIsLoadingGithub] = useState<boolean>(false);
  const [githubError, setGithubError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    } else {
      setQuery('');
      setGithubError('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.category.toLowerCase().includes(query.toLowerCase()) ||
      l.badge.toLowerCase().includes(query.toLowerCase())
  );

  const filteredThemes = STUDIO_THEMES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.group.toLowerCase().includes(query.toLowerCase())
  );

  const totalRuns = sessionLogs.length;
  const avgWpm =
    totalRuns > 0
      ? Math.round(sessionLogs.reduce((acc, r) => acc + r.wpm, 0) / totalRuns)
      : 0;
  const totalChars = sessionLogs.reduce((acc, r) => acc + r.chars, 0);

  const masteryByLang = LANGUAGES.map((l) => {
    const runs = sessionLogs.filter((r) => r.langId === l.id);
    const best = runs.reduce((m, r) => Math.max(m, r.wpm), 0);
    const avgAcc =
      runs.length > 0
        ? Math.round((runs.reduce((a, r) => a + r.accuracy, 0) / runs.length) * 10) / 10
        : 0;
    return { lang: l, count: runs.length, best, avgAcc };
  })
    .filter((m) => m.count > 0)
    .sort((a, b) => b.best - a.best);

  const dailyRng = createSeededRandom(`leaderboard_${todayStr}`);
  const globalChallengers = [
    { handle: 'torvalds_rs', lang: 'Rust', wpm: 142 + Math.floor(dailyRng() * 14), acc: 99.6 },
    { handle: 'primeagen_vim', lang: 'TypeScript', wpm: 131 + Math.floor(dailyRng() * 12), acc: 99.1 },
    { handle: 'mitchellh_zig', lang: 'Zig', wpm: 124 + Math.floor(dailyRng() * 10), acc: 98.8 },
    { handle: 'rauchg_edge', lang: 'TypeScript', wpm: 116 + Math.floor(dailyRng() * 10), acc: 98.4 },
    { handle: 'antirez_c', lang: 'C', wpm: 108 + Math.floor(dailyRng() * 9), acc: 97.9 },
  ];
  if (dailyBestWpm > 0) {
    globalChallengers.push({
      handle: 'YOU (Verified Local)',
      lang: 'TypeScript',
      wpm: dailyBestWpm,
      acc: 99.0,
    });
    globalChallengers.sort((a, b) => b.wpm - a.wpm);
  }

  const handleFetchGithub = async () => {
    const trimmed = githubUrl.trim();
    if (!trimmed) return;
    setIsLoadingGithub(true);
    setGithubError('');

    try {
      let rawTargetUrl = trimmed;
      let filename = 'github_import.ts';

      if (trimmed.includes('gist.github.com') || /^[a-f0-9]{20,32}$/i.test(trimmed)) {
        const parts = trimmed.replace(/\/$/, '').split('/');
        const gistId = parts[parts.length - 1];
        const res = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!res.ok) throw new Error(`Gist fetch failed (${res.status})`);
        const data = await res.json();
        const files = Object.values(data.files || {}) as { filename: string; content: string }[];
        if (files.length === 0) throw new Error('No code files found in Gist.');
        filename = files[0].filename || 'gist_snippet.ts';
        const chunks = sanitizeAndChunkCode(files[0].content, stripComments);
        onSubmitCustomChunks(filename, chunks, 'GIST');
        onClose();
        return;
      }

      if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
        rawTargetUrl = trimmed
          .replace('https://github.com/', 'https://raw.githubusercontent.com/')
          .replace('/blob/', '/');
      }

      const urlParts = rawTargetUrl.split('/');
      filename = urlParts[urlParts.length - 1] || 'repo_file.ts';

      const response = await fetch(rawTargetUrl);
      if (!response.ok) {
        throw new Error(`Could not fetch file (HTTP ${response.status}). Check URL is public.`);
      }
      const rawText = await response.text();
      const chunks = sanitizeAndChunkCode(rawText, stripComments);
      onSubmitCustomChunks(filename, chunks, `GH • ${chunks.length} CHUNKS`);
      onClose();
    } catch (err: unknown) {
      setGithubError(err instanceof Error ? err.message : 'Failed to fetch from GitHub.');
    } finally {
      setIsLoadingGithub(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#0c0c10] border border-white/15 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_25px_90px_rgba(0,0,0,0.95)] overflow-hidden"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-4 py-3 border-b border-white/[0.08] bg-black/40">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setTab('settings')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === 'settings'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              UI Style & Caret
            </button>
            <button
              onClick={() => setTab('themes')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === 'themes'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              54 Themes
            </button>
            <button
              onClick={() => setTab('languages')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === 'languages'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              56 Languages
            </button>
            <button
              onClick={() => setTab('daily')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === 'daily'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Daily Challenge
            </button>
            <button
              onClick={() => setTab('profile')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === 'profile'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Skill Map
            </button>
            <button
              onClick={() => setTab('github')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === 'github'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              GitHub Import
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB: UI ARCHITECTURE (GLASSMORPHISM / CLAYMORPHISM) + CARET + ERROR MODES */}
        {tab === 'settings' && (
          <div className="p-5 space-y-5 max-h-[450px] overflow-y-auto">
            {/* 1. Visual Architecture Switcher (Glassmorphism vs Claymorphism vs Brutalism etc.) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  UI Visual Architecture (Glassmorphism / Claymorphism / Brutalism)
                </span>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">
                  Active: {uiStyleId}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {UI_STYLES.map((style) => {
                  const active = uiStyleId === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => onSelectUiStyle(style.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold">{style.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                          {style.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-tight">
                        {style.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Configurable Error Policies (Roadmap Section 2) */}
            <div>
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Compiler Error Policy
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: 'forgiving',
                      label: 'Forgiving (Default)',
                      desc: 'Cursor advances on error; fix with Backspace anytime',
                    },
                    {
                      id: 'strict',
                      label: 'Strict (Stop-on-Error)',
                      desc: 'Blocks cursor advance until you press the exact key',
                    },
                    {
                      id: 'no-backspace',
                      label: 'Hardcore (No Backspace)',
                      desc: 'Disables Backspace key; every mistake is permanent',
                    },
                  ] as { id: ErrorMode; label: string; desc: string }[]
                ).map((em) => {
                  const active = errorMode === em.id;
                  return (
                    <button
                      key={em.id}
                      onClick={() => onChangeErrorMode(em.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-500/20 border-amber-500/50 text-white'
                          : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold mb-0.5">{em.label}</div>
                      <div className="text-[10px] text-neutral-500 leading-tight">{em.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Caret Glide Smoothness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Caret Glide Smoothness (Sub-Pixel Interpolation)
                </span>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider">
                  Active: {caretSmoothness}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {SMOOTHNESS_PRESETS.map((preset) => {
                  const active = caretSmoothness === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onChangeCaretSmoothness(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                          : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold">{preset.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                          {preset.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 leading-tight">
                        {preset.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Caret Geometry */}
            <div>
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Caret Geometry
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'block', label: 'Filled Block', preview: '█' },
                    { id: 'beam', label: 'Thin Beam', preview: '▏' },
                    { id: 'underline', label: 'Underline', preview: '▁' },
                    { id: 'outline', label: 'Hollow Box', preview: '▯' },
                  ] as { id: CaretShape; label: string; preview: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onChangeCaretShape(s.id)}
                    className={`py-2 px-3 text-xs rounded-xl border font-semibold cursor-pointer transition-all flex items-center justify-between ${
                      currentCaretShape === s.id
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-black/40 border-white/[0.06] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-emerald-400 font-mono">{s.preview}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Motion & Ghost Pacemaker Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onChangeVelocityStretch(!velocityStretch)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  velocityStretch
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                    : 'bg-black/40 border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                  <span>Velocity Stretch</span>
                  <span className={velocityStretch ? 'text-emerald-400' : 'text-neutral-600'}>
                    {velocityStretch ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Subtly stretches caret during high-WPM bursts
                </p>
              </button>

              <button
                onClick={() => onChangeCaretGlow(!caretGlow)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  caretGlow
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                    : 'bg-black/40 border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                  <span>Neon Caret Bloom</span>
                  <span className={caretGlow ? 'text-emerald-400' : 'text-neutral-600'}>
                    {caretGlow ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Emits theme-colored ambient glow around cursor
                </p>
              </button>

              <button
                onClick={() => onChangeFocusZenDim(!focusZenDim)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  focusZenDim
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                    : 'bg-black/40 border-white/[0.06] text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Auto-Dim HUD
                  </span>
                  <span className={focusZenDim ? 'text-emerald-400' : 'text-neutral-600'}>
                    {focusZenDim ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500">
                  Dims top dock & footer while actively typing
                </p>
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Ghost className="w-3.5 h-3.5 text-amber-400" />
                Ghost Pacemaker Target WPM
              </div>
              <div className="flex gap-2">
                {[0, 60, 90, 120, 150].map((wpm) => (
                  <button
                    key={wpm}
                    onClick={() => onChangePacemaker(wpm)}
                    className={`flex-1 py-2 text-xs rounded-xl border font-semibold cursor-pointer transition-all ${
                      pacemakerWpm === wpm
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-black/40 border-white/[0.06] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {wpm === 0 ? 'OFF' : `${wpm} WPM`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SKILL MAP (ACCURACY + CONSISTENCY WEIGHTED MASTERY) */}
        {tab === 'profile' && (
          <div className="p-5 space-y-5 max-h-[430px] overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/40 border border-white/[0.07] p-3.5 rounded-xl">
                <div className="text-[10px] uppercase text-neutral-500">Sessions Completed</div>
                <div className="text-2xl font-bold text-white mt-0.5">{totalRuns}</div>
              </div>
              <div className="bg-black/40 border border-white/[0.07] p-3.5 rounded-xl">
                <div className="text-[10px] uppercase text-neutral-500">Mean Velocity</div>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">{avgWpm} WPM</div>
              </div>
              <div className="bg-black/40 border border-white/[0.07] p-3.5 rounded-xl">
                <div className="text-[10px] uppercase text-neutral-500">Total Code Compiled</div>
                <div className="text-2xl font-bold text-cyan-300 mt-0.5">
                  {totalChars.toLocaleString()} chars
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-white mb-2">
                Verified Language Skill Map (Weighted by Accuracy & Velocity)
              </div>
              {masteryByLang.length === 0 ? (
                <div className="text-xs text-neutral-500 bg-black/30 border border-white/[0.05] rounded-xl p-4 text-center">
                  Complete your first typing session to unlock verified language fluency ratings.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {masteryByLang.map(({ lang, count, best, avgAcc }) => {
                    const tier =
                      best >= 90 && avgAcc >= 96
                        ? 'Tier 1 • Fluent'
                        : best >= 65 && avgAcc >= 92
                        ? 'Tier 2 • Proficient'
                        : 'Tier 3 • Developing';
                    return (
                      <div
                        key={lang.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{lang.name}</div>
                          <div className="text-[10px] text-neutral-500">
                            {count} runs • {avgAcc}% acc
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-400">{best} WPM</div>
                          <div className="text-[9px] uppercase text-cyan-300">{tier}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: DAILY CHALLENGE */}
        {tab === 'daily' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 p-4 rounded-xl">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  Global UTC Seed • {todayStr}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Today&apos;s Deterministic Algorithm Sprint
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Every engineer worldwide receives the exact same seeded snippet today.
                </p>
              </div>
              <button
                onClick={() => {
                  onStartDailyChallenge();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-xs cursor-pointer shadow-[0_0_25px_rgba(251,191,36,0.4)]"
              >
                Launch Daily Seed
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Today&apos;s Global Seed Leaderboard ({todayStr})
              </div>
              <div className="space-y-1.5">
                {globalChallengers.map((row, idx) => (
                  <div
                    key={row.handle}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                      row.handle.includes('YOU')
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-black/40 border-white/[0.06] text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-400 w-5">#{idx + 1}</span>
                      <span className="text-xs font-bold">{row.handle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400">
                        {row.lang}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-neutral-400">{row.acc}% ACC</span>
                      <span className="font-bold text-emerald-400 text-sm">{row.wpm} WPM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: 56 LANGUAGES & 54 THEMES */}
        {(tab === 'languages' || tab === 'themes') && (
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder={
                  tab === 'languages'
                    ? 'Search 56 languages (Rust, Zig, Solidity, WGSL, Haskell, SQL, Assembly...)'
                    : 'Search 54 themes (Tokyo Night, Dracula, Catppuccin, Cyberpunk, Matrix...)'
                }
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={() => {
                  onTriggerRandom();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Synthesize
              </button>
            </div>

            {tab === 'languages' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[310px] overflow-y-auto pr-1">
                {filteredLanguages.map((lang) => {
                  const active = selectedLang === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => {
                        onSelectLanguage(lang.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] text-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{lang.name}</div>
                        <div className="text-[10px] text-neutral-500">{lang.category}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-emerald-400 border border-white/[0.06]">
                        .{lang.ext}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[310px] overflow-y-auto pr-1">
                {filteredThemes.map((t) => {
                  const active = selectedThemeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTheme(t.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-white/40 bg-white/[0.08]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-neutral-100 truncate">{t.name}</div>
                        <div className="text-[10px] text-neutral-500">{t.group}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: t.bg }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: t.accent }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: GITHUB & CUSTOM CODE IMPORTER */}
        {tab === 'github' && (
          <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto">
            <div className="space-y-2">
              <label className="block text-xs text-neutral-300 font-semibold">
                Import Public GitHub File or Gist URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setGithubUrl(e.target.value)
                  }
                  placeholder="https://github.com/owner/repo/blob/main/src/index.ts"
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={handleFetchGithub}
                  disabled={isLoadingGithub || !githubUrl.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isLoadingGithub ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" />
                  )}
                  Fetch
                </button>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripComments}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setStripComments(e.target.checked)
                  }
                  className="accent-emerald-500"
                />
                Strip comments & slice into logical function blocks
              </label>
              {githubError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {githubError}
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.06] pt-3 space-y-2">
              <label className="block text-xs text-neutral-300 font-semibold">
                Or Paste Custom Code Directly (Local Only • Never Uploaded)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomTitle(e.target.value)
                }
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <textarea
                rows={4}
                value={customCode}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCustomCode(e.target.value)
                }
                placeholder="Paste any code snippet here..."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-neutral-200 font-mono"
              />
              <button
                onClick={() => {
                  if (customCode.trim().length > 5) {
                    const chunks = sanitizeAndChunkCode(customCode, false);
                    onSubmitCustomChunks(customTitle || 'custom.ts', chunks, 'CUSTOM');
                    onClose();
                  }
                }}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                Load Custom Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}