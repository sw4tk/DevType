'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Flame,
  Zap,
  Target,
  Trophy,
  Share2,
  Globe,
  Terminal,
  Code2,
  Check,
  Award,
  Activity,
  Layers,
  Cpu,
  Keyboard,
  LogOut,
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const username =
    user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'sw4tk';
  const fullName = user?.user_metadata?.full_name || username;
  const avatarUrl =
    user?.user_metadata?.avatar_url || 'https://github.com/identicons/devtype.png';
  const userBio =
    user?.user_metadata?.bio ||
    'Synthesizing real-world syntax at 120Hz. Full-stack builder & DevType pilot.';

  const stats = {
    peakWpm: 128,
    avgWpm: 94,
    rawWpm: 136,
    syntaxAccuracy: '99.4%',
    testsCompleted: 342,
    linesTyped: '4,890',
    currentStreak: 18,
    longestStreak: 24,
    globalRank: '#42',
    level: 38,
    xpProgress: 78,
    tier: 'Grandmaster Synthesizer',
    mainStack: 'Python / TypeScript',
  };

  const stackBreakdown = [
    { lang: 'Python', ext: '.py', percent: 38, wpm: 128, tests: 130, color: '#38bdf8' },
    { lang: 'TypeScript', ext: '.tsx', percent: 29, wpm: 118, tests: 99, color: '#3178c6' },
    { lang: 'Rust', ext: '.rs', percent: 19, wpm: 104, tests: 65, color: '#f97316' },
    { lang: 'Go', ext: '.go', percent: 14, wpm: 112, tests: 48, color: '#00add8' },
  ];

  const heatmapDays = Array.from({ length: 112 }, (_, i) => {
    const wave = Math.sin(i * 0.45) + Math.cos(i * 0.2);
    if (i > 95) return 3;
    if (wave > 0.8) return 3;
    if (wave > 0.1) return 2;
    if (wave > -0.6) return 1;
    return 0;
  });

  const getHeatmapColor = (val: number) => {
    if (val === 0) return 'bg-white/[0.04] border border-white/[0.03]';
    if (val === 1) return 'bg-[#10b981]/30 border border-[#10b981]/20';
    if (val === 2) return 'bg-[#10b981]/65 border border-[#10b981]/40';
    return 'bg-[#10b981] border border-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  };

  const handleCopyFlex = () => {
    const text = `⚡ DevType Developer Telemetry — @${username}
🏆 Rank: ${stats.globalRank} (${stats.tier} • LVL ${stats.level})
🚀 Peak Speed: ${stats.peakWpm} WPM | Accuracy: ${stats.syntaxAccuracy}
🔥 Active Streak: ${stats.currentStreak} Days
💻 Main Stack: ${stats.mainStack}

Test your code typing speed: https://codewithdevtype.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `⚡ Hitting ${stats.peakWpm} WPM (${stats.syntaxAccuracy} syntax accuracy) on DevType!\n🏆 Rank ${stats.globalRank} • ${stats.tier}\n💻 Main Stack: ${stats.mainStack}\n\nCan you beat my syntax speed?`
    );
    const url = encodeURIComponent('https://codewithdevtype.vercel.app');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-neutral-100 font-sans selection:bg-[#10b981]/30 pb-20">
      {/* Top Bar */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-neutral-300 hover:text-white transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#10b981]" />
          Return to Typing Studio
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyFlex}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono transition-all cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#10b981]" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-[#10b981]" />
            )}
            <span>{copied ? 'Flex Copied!' : 'Copy Flex Card'}</span>
          </button>

          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#0ea572] text-black font-bold text-xs font-mono transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Flex on X</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-mono transition-all cursor-pointer"
            title="Sign Out of DevType"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="w-full max-w-6xl mx-auto px-6 space-y-6">
        {/* HERO IDENTITY BANNER */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#10131c] via-[#0b0d13] to-[#08090d] p-8 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-[#10b981] shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-black"
                />
                <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-black bg-[#10b981] text-black border-2 border-[#08090d]">
                  LVL {stats.level}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black font-poppins text-white tracking-tight">
                    {fullName}
                  </h1>
                  <span className="text-sm font-mono text-neutral-400">@{username}</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                    <Award className="w-3.5 h-3.5" />
                    {stats.tier}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 font-mono max-w-xl">
                  {userBio}
                </p>

                {/* XP Progress Bar */}
                <div className="pt-1 max-w-md space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                    <span>RANK PROGRESSION</span>
                    <span className="text-[#10b981]">{stats.xpProgress}% to LVL {stats.level + 1}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-[#10b981] rounded-full shadow-[0_0_10px_#10b981]"
                      style={{ width: `${stats.xpProgress}%` }}
                    />
                  </div>
                </div>

                {/* Social & Stack Links */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-neutral-400 font-mono">
                  <a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    github.com/{username}
                  </a>
                  <span className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5 text-neutral-300">
                    <Cpu className="w-3.5 h-3.5 text-[#10b981]" />
                    Main: {stats.mainStack}
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <Globe className="w-3.5 h-3.5" />
                    codewithdevtype.vercel.app
                  </span>
                </div>
              </div>
            </div>

            {/* Global Standing Box */}
            <div className="flex items-center gap-5 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 shrink-0">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                  Global Rank
                </p>
                <p className="text-3xl font-black font-mono text-[#10b981]">{stats.globalRank}</p>
                <p className="text-[10px] font-mono text-neutral-500">Top 0.8% Worldwide</p>
              </div>
              <div className="h-10 w-[1px] bg-white/10" />
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                  Active Streak
                </p>
                <p className="text-3xl font-black font-mono text-orange-400 flex items-center gap-1">
                  {stats.currentStreak} <Flame className="w-5 h-5 fill-orange-400" />
                </p>
                <p className="text-[10px] font-mono text-neutral-500">Best: {stats.longestStreak} Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* TELEMETRY METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-mono uppercase">Peak Speed (PB)</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black font-mono text-white">
              {stats.peakWpm} <span className="text-xs font-normal text-neutral-500">WPM</span>
            </p>
            <p className="text-[11px] font-mono text-neutral-500">Raw Burst: {stats.rawWpm} WPM</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-mono uppercase">Average Pace</span>
              <Keyboard className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-3xl font-black font-mono text-white">
              {stats.avgWpm} <span className="text-xs font-normal text-neutral-500">WPM</span>
            </p>
            <p className="text-[11px] font-mono text-neutral-500">Last 50 Sprints</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-mono uppercase">Syntax Accuracy</span>
              <Target className="w-4 h-4 text-[#10b981]" />
            </div>
            <p className="text-3xl font-black font-mono text-white">{stats.syntaxAccuracy}</p>
            <p className="text-[11px] font-mono text-[#10b981]">Zero Compiler Faults</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-mono uppercase">Volume Typed</span>
              <Terminal className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-black font-mono text-white">{stats.linesTyped}</p>
            <p className="text-[11px] font-mono text-neutral-500">
              Across {stats.testsCompleted} Sessions
            </p>
          </div>
        </div>

        {/* SYNTAX CONTRIBUTION HEATMAP */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#10b981]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Daily Code Synthesis Heatmap (16 Weeks)
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
              <span>Idle</span>
              <div className="w-3 h-3 rounded-sm bg-white/[0.04]" />
              <div className="w-3 h-3 rounded-sm bg-[#10b981]/30" />
              <div className="w-3 h-3 rounded-sm bg-[#10b981]/65" />
              <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
              <span>Peak Flow</span>
            </div>
          </div>

          <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-2">
            {heatmapDays.map((val, idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-[3px] transition-transform hover:scale-125 ${getHeatmapColor(
                  val
                )}`}
                title={`Day ${idx + 1}: ${val * 4} snippets completed`}
              />
            ))}
          </div>
        </div>

        {/* TECH STACK BREAKDOWN + BADGES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Tech Stack Practiced
                </h2>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">4 Core Languages</span>
            </div>

            <div className="space-y-4 pt-1">
              {stackBreakdown.map((item) => (
                <div key={item.lang} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{item.lang}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-300">
                        {item.ext}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#10b981] font-bold">{item.wpm} WPM</span>
                      <span className="text-neutral-400">
                        {item.tests} runs ({item.percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Developer Honors & Badges
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#10b981]">4 / 4 Unlocked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">120Hz Demon</p>
                  <p className="text-[10px] text-neutral-400 font-mono">Surpassed 120+ WPM Peak</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Relentless Committer</p>
                  <p className="text-[10px] text-neutral-400 font-mono">14+ Day Active Streak</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Polyglot Architect</p>
                  <p className="text-[10px] text-neutral-400 font-mono">Mastered 4+ Tech Stacks</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Zero-Bug Syntax</p>
                  <p className="text-[10px] text-neutral-400 font-mono">99.4% Lifetime Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
