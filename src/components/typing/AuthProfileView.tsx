'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LANGUAGES, HistoryRecord } from '@/constants/languages';
import { UIStyleSpec } from '@/constants/uiStyles';
import { signInWithGitHubOAuth } from '@/utils/supabaseClient';
import {
  User,
  Award,
  Flame,
  Zap,
  Trophy,
  Terminal,
  LogOut,
  CheckCircle2,
  Sparkles,
  Code2,
  ShieldCheck,
  Calendar,
  TrendingUp,
} from 'lucide-react';

export interface DevUserProfile {
  username: string;
  displayName: string;
  roleTitle: string;
  provider: 'github' | 'google' | 'local';
  avatarColor: string;
  joinedAt: string;
}

interface AuthProfileViewProps {
  user: DevUserProfile | null;
  onLogin: (profile: DevUserProfile) => void;
  onLogout: () => void;
  sessionLogs: HistoryRecord[];
  uiStyle: UIStyleSpec;
  accentColor: string;
  onBackToArena: () => void;
}

const AVATAR_GRADIENTS = [
  'from-emerald-400 to-cyan-500',
  'from-violet-500 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-indigo-500',
  'from-rose-400 to-red-500',
];

export default function AuthProfileView({
  user,
  onLogin,
  onLogout,
  sessionLogs,
  uiStyle,
  accentColor,
  onBackToArena,
}: AuthProfileViewProps) {
  const [handleInput, setHandleInput] = useState('swastik_dev');
  const [nameInput, setNameInput] = useState('Swastik Mandal');
  const [roleInput, setRoleInput] = useState('Principal Full-Stack Engineer');
  const [selectedGrad, setSelectedGrad] = useState(AVATAR_GRADIENTS[0]);

  // Career Telemetry Math
  const totalRuns = sessionLogs.length;
  const totalChars = sessionLogs.reduce((acc, r) => acc + r.chars, 0);
  const bestWpm = sessionLogs.reduce((max, r) => Math.max(max, r.wpm), 0);
  const avgWpm =
    totalRuns > 0
      ? Math.round(sessionLogs.reduce((acc, r) => acc + r.wpm, 0) / totalRuns)
      : 0;
  const avgAcc =
    totalRuns > 0
      ? (sessionLogs.reduce((acc, r) => acc + r.accuracy, 0) / totalRuns).toFixed(1)
      : '100.0';

  // XP & Level System (Every 500 chars = 100 XP)
  const totalXp = totalChars * 2 + totalRuns * 150 + bestWpm * 10;
  const currentLevel = Math.max(1, Math.floor(totalXp / 1500) + 1);
  const xpIntoLevel = totalXp % 1500;
  const xpProgressPct = Math.min(100, Math.round((xpIntoLevel / 1500) * 100));

  const uniqueLangs = new Set(sessionLogs.map((s) => s.langId)).size;

  const achievements = [
    {
      id: 'first_compile',
      title: 'Hello World',
      desc: 'Complete your first code sprint',
      unlocked: totalRuns >= 1,
    },
    {
      id: 'speed_80',
      title: 'Senior Velocity',
      desc: 'Reach 80+ Net WPM on any snippet',
      unlocked: bestWpm >= 80,
    },
    {
      id: 'speed_100',
      title: '100x Architect',
      desc: 'Break the 100+ WPM barrier',
      unlocked: bestWpm >= 100,
    },
    {
      id: 'sniper',
      title: 'Zero-Bug Sniper',
      desc: 'Finish a session with 100% accuracy',
      unlocked: sessionLogs.some((s) => s.accuracy >= 100),
    },
    {
      id: 'polyglot',
      title: 'Polyglot Compiler',
      desc: 'Practice across 4+ programming languages',
      unlocked: uniqueLangs >= 4,
    },
    {
      id: 'marathon',
      title: '10K Club',
      desc: 'Compile 10,000+ characters of code',
      unlocked: totalChars >= 10000,
    },
  ];

  const masteryByLang = LANGUAGES.map((l) => {
    const runs = sessionLogs.filter((r) => r.langId === l.id);
    const best = runs.reduce((m, r) => Math.max(m, r.wpm), 0);
    return { lang: l, count: runs.length, best };
  })
    .filter((m) => m.count > 0)
    .sort((a, b) => b.best - a.best);

  const handleQuickOAuth = (provider: 'github' | 'google') => {
    if (provider === 'github') {
      signInWithGitHubOAuth();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl mx-auto my-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch"
      >
        {/* Left Pitch Card */}
        <div className={`md:col-span-5 p-6 flex flex-col justify-between ${uiStyle.cardClass}`}>
          <div className="space-y-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border border-white/15 bg-white/[0.04]"
              style={{ color: accentColor }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              DEVELOPER IDENTITY PASSPORT
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
              Sync your WPM telemetry, language mastery & badges.
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Create your instant developer passport to unlock XP progression, 365-day activity
              heatmaps, verified OG share cards, and Daily Seeded Leaderboard rankings.
            </p>
          </div>

          <div className="space-y-2.5 pt-6 border-t border-white/[0.08] text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tracks mastery across all 56 programming languages</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Custom handle stamped onto 1200×630 PNG OG Cards</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-latency local storage + instant OAuth simulation</span>
            </div>
          </div>
        </div>

        {/* Right Sign-In Form */}
        <div className={`md:col-span-7 p-6 flex flex-col justify-between space-y-4 ${uiStyle.cardClass}`}>
          <div>
            <h2 className="text-base font-bold text-white mb-1">Initialize Developer Profile</h2>
            <p className="text-xs text-neutral-500">
              Choose your handle and connect with 1 click
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  GitHub / Terminal Handle
                </label>
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                Engineering Title / Role Badge
              </label>
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5">
                Avatar Aura Gradient
              </label>
              <div className="flex items-center gap-2.5">
                {AVATAR_GRADIENTS.map((grad) => (
                  <button
                    key={grad}
                    type="button"
                    onClick={() => setSelectedGrad(grad)}
                    className={`w-7 h-7 rounded-full bg-gradient-to-tr ${grad} cursor-pointer transition-transform ${
                      selectedGrad === grad
                        ? 'scale-115 ring-2 ring-white'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => handleQuickOAuth('github')}
              style={{ backgroundColor: accentColor }}
              className="py-2.5 px-4 rounded-xl text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:opacity-95 transition-all"
            >
              <Terminal className="w-4 h-4" />
              Continue with GitHub
            </button>
            <button
              onClick={() => handleQuickOAuth('google')}
              className={`py-2.5 px-4 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${uiStyle.buttonClass}`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Continue with Google
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      className="w-full max-w-6xl mx-auto my-auto flex flex-col gap-3.5 max-h-full overflow-y-auto pr-1"
    >
      {/* Top Identity Banner + Level Progress */}
      <div className={`p-5 flex flex-wrap items-center justify-between gap-4 ${uiStyle.cardClass}`}>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${user.avatarColor} flex items-center justify-center text-neutral-950 font-extrabold text-xl shadow-lg`}
          >
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white">{user.displayName}</h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-emerald-300 font-semibold">
                @{user.username}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                LVL {currentLevel}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {user.roleTitle} • Joined {user.joinedAt}
            </p>
            {/* XP Bar */}
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-44 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpProgressPct}%`, backgroundColor: accentColor }}
                />
              </div>
              <span className="text-[10px] text-neutral-400">
                {totalXp.toLocaleString()} XP ({xpProgressPct}% to LVL {currentLevel + 1})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToArena}
            style={{ backgroundColor: accentColor }}
            className="px-4 py-2 rounded-xl text-neutral-950 font-extrabold text-xs cursor-pointer"
          >
            Back to Typing Arena
          </button>
          <button
            onClick={onLogout}
            className={`px-3.5 py-2 text-xs text-neutral-300 hover:text-red-300 flex items-center gap-1.5 cursor-pointer ${uiStyle.buttonClass}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* 4 Career Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`p-4 ${uiStyle.cardClass}`}>
          <div className="text-[10px] uppercase text-neutral-400 flex justify-between">
            <span>All-Time Peak WPM</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">{bestWpm} WPM</div>
        </div>

        <div className={`p-4 ${uiStyle.cardClass}`}>
          <div className="text-[10px] uppercase text-neutral-400 flex justify-between">
            <span>Career Average</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{avgWpm} WPM</div>
        </div>

        <div className={`p-4 ${uiStyle.cardClass}`}>
          <div className="text-[10px] uppercase text-neutral-400 flex justify-between">
            <span>Mean Precision</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">{avgAcc}%</div>
        </div>

        <div className={`p-4 ${uiStyle.cardClass}`}>
          <div className="text-[10px] uppercase text-neutral-400 flex justify-between">
            <span>Total Code Compiled</span>
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-300 mt-1">
            {totalChars.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bottom Split: 365-Day Heatmap & Achievements + Language Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className={`lg:col-span-7 p-4 space-y-4 ${uiStyle.cardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Contribution & Practice Heatmap
            </span>
            <span className="text-[10px] text-neutral-400">{totalRuns} verified sessions</span>
          </div>

          <div className="grid grid-cols-14 sm:grid-cols-28 gap-1.5">
            {Array.from({ length: 84 }).map((_, idx) => {
              const isToday = idx === 83 && totalRuns > 0;
              const sim = (idx * 13) % 7 === 0;
              return (
                <div
                  key={idx}
                  className={`h-3 rounded-[3px] border border-white/[0.05] ${
                    isToday
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : sim
                      ? 'bg-emerald-500/30'
                      : 'bg-white/[0.04]'
                  }`}
                />
              );
            })}
          </div>

          {/* Unlockable Engineering Badges */}
          <div className="pt-2">
            <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Engineering Achievements
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    ach.unlocked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-black/30 border-white/[0.05] text-neutral-600 opacity-60'
                  }`}
                >
                  <div className="text-[11px] font-bold flex items-center justify-between">
                    <span>{ach.title}</span>
                    {ach.unlocked && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-0.5">{ach.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Language Mastery Bars */}
        <div className={`lg:col-span-5 p-4 flex flex-col justify-between ${uiStyle.cardClass}`}>
          <div>
            <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
              <span>Language Mastery Ranks</span>
              <span className="text-[10px] text-neutral-400">{uniqueLangs} / 56 Unlocked</span>
            </div>

            {masteryByLang.length === 0 ? (
              <div className="text-xs text-neutral-500 py-12 text-center">
                Complete a typing test to populate your language mastery telemetry.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
                {masteryByLang.slice(0, 6).map(({ lang, count, best }) => {
                  const pct = Math.min(100, Math.round((best / 130) * 100));
                  return (
                    <div key={lang.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">
                          {lang.name}{' '}
                          <span className="text-[10px] text-neutral-500">({count} runs)</span>
                        </span>
                        <span className="font-bold text-emerald-400">{best} WPM</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: accentColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
            <span>Verified Local Telemetry</span>
            <span className="text-emerald-400 font-bold">120Hz Engine</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}