'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  fetchUserTelemetry,
  TypingSessionRecord,
} from '@/utils/telemetry';
import {
  ArrowLeft,
  Flame,
  Zap,
  Target,
  Trophy,
  Share2,
  Terminal,
  Code2,
  Check,
  Award,
  Activity,
  Layers,
  Cpu,
  Keyboard,
  LogOut,
  Clock,
  Sparkles,
  Edit3,
} from 'lucide-react';

function TelemetryBootFallback({ bootStep = 1 }: { bootStep?: number }) {
  const bootLogs = [
    'ESTABLISHING TLS 1.3 HANDSHAKE WITH SUPABASE...',
    'AUTHENTICATING @SW4TK SESSION TOKENS...',
    'AGGREGATING 365-DAY SYNTAX HEATMAP MATRIX...',
    'COMPUTING WPM VELOCITY & LANGUAGE TELEMETRY...',
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center font-mono">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0d13] p-6 shadow-2xl space-y-5 animate-studio-enter">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="text-xs text-neutral-400 ml-2">devtype://telemetry-sync</span>
          </div>
          <span className="text-[10px] text-[#10b981] animate-pulse">120Hz SYNC</span>
        </div>
        <div className="space-y-2.5 text-xs">
          {bootLogs.map((log, index) => (
            <div
              key={log}
              className={`flex items-center gap-2.5 transition-opacity duration-200 ${
                index <= bootStep ? 'opacity-100' : 'opacity-20'
              }`}
            >
              <span className="text-[#10b981] font-bold">
                {index < bootStep ? '✓' : index === bootStep ? '›' : '·'}
              </span>
              <span
                className={
                  index === bootStep ? 'text-white font-semibold' : 'text-neutral-400'
                }
              >
                {log}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-[#10b981] transition-all duration-300 shadow-[0_0_12px_#10b981]"
            style={{ width: `${((bootStep + 1) / bootLogs.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileTelemetry() {
  const [user, setUser] = useState<any | null>(null);
  const [sessions, setSessions] = useState<TypingSessionRecord[]>([]);
  const [bio, setBio] = useState('Synthesizing real-world syntax at 120Hz.');
  const [gear, setGear] = useState('Custom 65% Mechanical Deck');
  const [editingBio, setEditingBio] = useState(false);

  const [loading, setLoading] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let active = true;
    const stepInterval = setInterval(() => {
      setBootStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 180);

    Promise.all([
      fetchUserTelemetry(),
      new Promise((r) => setTimeout(r, 720)),
    ]).then(([{ user: u, sessions: s, profileMeta }]) => {
      clearInterval(stepInterval);
      if (!active) return;
      setUser(u);
      setSessions(s);
      setBio(profileMeta.bio);
      setGear(profileMeta.keyboard_gear);
      setLoading(false);
    });

    return () => {
      active = false;
      clearInterval(stepInterval);
    };
  }, []);

  const handleSaveProfileMeta = async () => {
    setEditingBio(false);
    if (user) {
      await supabase.from('developer_profiles').upsert({
        user_id: user.id,
        username: user.user_metadata?.user_name || 'dev',
        bio,
        keyboard_gear: gear,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const username =
    user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'sw4tk';
  const fullName = user?.user_metadata?.full_name || username;
  const avatarUrl =
    user?.user_metadata?.avatar_url || 'https://github.com/identicons/devtype.png';

  const computed = useMemo(() => {
    const totalTests = sessions.length;
    const peakWpm = totalTests > 0 ? Math.max(...sessions.map((s) => s.wpm)) : 0;
    const rawBurst = totalTests > 0 ? Math.max(...sessions.map((s) => s.raw_wpm || s.wpm)) : 0;
    const avgWpm =
      totalTests > 0
        ? Math.round(sessions.reduce((acc, s) => acc + s.wpm, 0) / totalTests)
        : 0;
    const avgAcc =
      totalTests > 0
        ? (sessions.reduce((acc, s) => acc + Number(s.accuracy), 0) / totalTests).toFixed(1)
        : '0.0';
    const totalLines = sessions.reduce((acc, s) => acc + (s.lines_typed || 5), 0);
    const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 30), 0);

    const dateCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      const dayKey = new Date(s.created_at).toISOString().split('T')[0];
      dateCounts[dayKey] = (dateCounts[dayKey] || 0) + 1;
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const count = dateCounts[key] || 0;

      if (count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (i === 0) continue;
        if (currentStreak === 0 && tempStreak > 0) currentStreak = tempStreak;
        tempStreak = 0;
      }
    }
    if (currentStreak === 0 && tempStreak > 0) currentStreak = tempStreak;

    const totalDays = 52 * 7;
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (totalDays - 1));

    const weeks: { date: string; count: number; level: number }[][] = [];
    for (let w = 0; w < 52; w++) {
      const weekCol: { date: string; count: number; level: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d;
        const cellDate = new Date(startDay);
        cellDate.setDate(startDay.getDate() + idx);
        const iso = cellDate.toISOString().split('T')[0];
        const count = dateCounts[iso] || 0;
        const level =
          count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
        weekCol.push({ date: iso, count, level });
      }
      weeks.push(weekCol);
    }

    const langMap: Record<
      string,
      { lang: string; ext: string; runs: number; bestWpm: number }
    > = {};
    const colorPalette: Record<string, string> = {
      Python: '#38bdf8',
      TypeScript: '#3178c6',
      JavaScript: '#facc15',
      Rust: '#f97316',
      Go: '#00add8',
      C: '#a855f7',
      'C++': '#ec4899',
    };

    sessions.forEach((s) => {
      if (!langMap[s.language]) {
        langMap[s.language] = {
          lang: s.language,
          ext: s.ext || '.code',
          runs: 0,
          bestWpm: 0,
        };
      }
      langMap[s.language].runs += 1;
      if (s.wpm > langMap[s.language].bestWpm) langMap[s.language].bestWpm = s.wpm;
    });

    const stackBreakdown = Object.values(langMap)
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percent: totalTests > 0 ? Math.round((item.runs / totalTests) * 100) : 0,
        color: colorPalette[item.lang] || '#10b981',
      }));

    const mainStack =
      stackBreakdown.length > 0
        ? stackBreakdown
            .slice(0, 2)
            .map((s) => s.lang)
            .join(' / ')
        : 'Unranked Pilot';

    const totalXp = totalTests * 120 + totalLines * 8;
    const level = Math.max(1, Math.floor(totalXp / 500) + 1);
    const xpProgress = Math.min(99, Math.round(((totalXp % 500) / 500) * 100));

    const tier =
      peakWpm >= 110
        ? 'Grandmaster Synthesizer'
        : peakWpm >= 85
        ? 'Senior Code Architect'
        : peakWpm >= 60
        ? 'Syntax Engineer'
        : totalTests > 0
        ? 'Junior Committer'
        : 'Initiate Pilot';

    return {
      totalTests,
      peakWpm,
      rawBurst,
      avgWpm,
      avgAcc,
      totalLines,
      totalMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      currentStreak,
      longestStreak,
      weeks,
      stackBreakdown,
      mainStack,
      level,
      xpProgress,
      tier,
    };
  }, [sessions]);

  const getHeatmapCellStyle = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-[#161b22] border border-[#10b981]/15';
      case 1:
        return 'bg-[#0e4429] border border-[#10b981]/30';
      case 2:
        return 'bg-[#006d32] border border-[#10b981]/50';
      case 3:
        return 'bg-[#26a641] border border-[#10b981]/70';
      default:
        return 'bg-[#39d353] border border-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    }
  };

  const handleCopyFlex = () => {
    const text = `⚡ DevType Telemetry — @${username}\n🏆 Tier: ${computed.tier} (LVL ${computed.level})\n🚀 Peak Speed: ${computed.peakWpm} WPM | Avg: ${computed.avgWpm} WPM (${computed.avgAcc}% Acc)\n🔥 Streak: ${computed.currentStreak} Days (${computed.totalTests} Runs)\n💻 Main Stack: ${computed.mainStack}\n\nChallenge me: https://codewithdevtype.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `⚡ Hitting ${computed.peakWpm} WPM (${computed.avgAcc}% syntax accuracy) on DevType!\n🏆 ${computed.tier} • LVL ${computed.level}\n💻 Main Stack: ${computed.mainStack}\n\nTest your syntax speed:`
    );
    const url = encodeURIComponent('https://codewithdevtype.vercel.app');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  if (loading) {
    return <TelemetryBootFallback bootStep={bootStep} />;
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-6 space-y-6">
      <div
        style={{ animationDelay: '40ms' }}
        className="animate-studio-enter flex flex-wrap items-center justify-end gap-2.5 -mt-2"
      >
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
      </div>

      <div
        style={{ animationDelay: '80ms' }}
        className="animate-studio-enter relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#10131c] via-[#0b0d13] to-[#08090d] p-8 shadow-2xl"
      >
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
                LVL {computed.level}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black font-poppins text-white tracking-tight">
                  {fullName}
                </h1>
                <span className="text-sm font-mono text-neutral-400">@{username}</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  <Award className="w-3.5 h-3.5" /> {computed.tier}
                </span>
              </div>
              {editingBio ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-black/60 border border-[#10b981]/50 rounded-lg px-3 py-1 text-xs font-mono text-white w-72"
                    placeholder="Your developer bio..."
                  />
                  <input
                    value={gear}
                    onChange={(e) => setGear(e.target.value)}
                    className="bg-black/60 border border-white/20 rounded-lg px-3 py-1 text-xs font-mono text-neutral-300 w-56"
                    placeholder="Keyboard gear..."
                  />
                  <button
                    onClick={handleSaveProfileMeta}
                    className="px-3 py-1 rounded-lg bg-[#10b981] text-black font-mono text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm text-neutral-300 font-mono max-w-xl">
                    {bio}
                  </p>
                  <button
                    onClick={() => setEditingBio(true)}
                    className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    title="Edit Bio & Hardware Rig"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="pt-1 max-w-md space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                  <span>EXPERIENCE TELEMETRY</span>
                  <span className="text-[#10b981]">
                    {computed.xpProgress}% to LVL {computed.level + 1}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded-full shadow-[0_0_10px_#10b981] transition-all duration-700"
                    style={{ width: `${computed.xpProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-400 font-mono">
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5"
                >
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  github.com/{username}
                </a>
                <span className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5 text-neutral-300">
                  <Cpu className="w-3.5 h-3.5 text-[#10b981]" /> Stack: {computed.mainStack}
                </span>
                <span className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5 text-neutral-300">
                  <Keyboard className="w-3.5 h-3.5 text-amber-400" /> {gear}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5 bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 shrink-0">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                Total Sprints
              </p>
              <p className="text-3xl font-black font-mono text-[#10b981]">
                {computed.totalTests}
              </p>
              <p className="text-[10px] font-mono text-neutral-500">
                {computed.totalMinutes} mins in flow
              </p>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                Active Streak
              </p>
              <p className="text-3xl font-black font-mono text-orange-400 flex items-center gap-1">
                {computed.currentStreak} <Flame className="w-5 h-5 fill-orange-400" />
              </p>
              <p className="text-[10px] font-mono text-neutral-500">
                Best: {computed.longestStreak} Days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ animationDelay: '140ms' }}
        className="animate-studio-enter grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] hover:border-[#10b981]/40 transition-all space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Peak Speed (PB)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black font-mono text-white">
            {computed.peakWpm}{' '}
            <span className="text-xs font-normal text-neutral-500">WPM</span>
          </p>
          <p className="text-[11px] font-mono text-neutral-500">
            Raw Burst: {computed.rawBurst} WPM
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] hover:border-[#10b981]/40 transition-all space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Average Pace</span>
            <Keyboard className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black font-mono text-white">
            {computed.avgWpm}{' '}
            <span className="text-xs font-normal text-neutral-500">WPM</span>
          </p>
          <p className="text-[11px] font-mono text-neutral-500">
            Across {computed.totalTests} Verified Runs
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] hover:border-[#10b981]/40 transition-all space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Syntax Accuracy</span>
            <Target className="w-4 h-4 text-[#10b981]" />
          </div>
          <p className="text-3xl font-black font-mono text-white">{computed.avgAcc}%</p>
          <p className="text-[11px] font-mono text-[#10b981]">Real-Time Compiler Checked</p>
        </div>
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0c0e14] hover:border-[#10b981]/40 transition-all space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase">Lines Synthesized</span>
            <Terminal className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black font-mono text-white">
            {computed.totalLines.toLocaleString()}
          </p>
          <p className="text-[11px] font-mono text-neutral-500">Production AST Snippets</p>
        </div>
      </div>

      <div
        style={{ animationDelay: '200ms' }}
        className="animate-studio-enter p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              365-Day Syntax Contribution Matrix
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              ({computed.totalTests} verified runs)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-[#161b22] border border-[#10b981]/15" />
            <div className="w-3 h-3 rounded-[2px] bg-[#0e4429] border border-[#10b981]/30" />
            <div className="w-3 h-3 rounded-[2px] bg-[#006d32] border border-[#10b981]/50" />
            <div className="w-3 h-3 rounded-[2px] bg-[#26a641] border border-[#10b981]/70" />
            <div className="w-3 h-3 rounded-[2px] bg-[#39d353] border border-[#10b981]" />
            <span>More</span>
          </div>
        </div>

        <div className="w-full pt-2">
          <div className="flex items-start gap-4 w-full">
            <div className="grid grid-rows-7 gap-[5px] text-[9px] font-mono text-neutral-500 pr-2 leading-[13px] shrink-0 pt-0.5">
              <span className="h-[13px] flex items-center">Mon</span>
              <span className="h-[13px] flex items-center">Tue</span>
              <span className="h-[13px] flex items-center">Wed</span>
              <span className="h-[13px] flex items-center">Thu</span>
              <span className="h-[13px] flex items-center">Fri</span>
              <span className="h-[13px] flex items-center">Sat</span>
              <span className="h-[13px] flex items-center">Sun</span>
            </div>

            <div className="flex justify-between items-center w-full gap-[4px]">
              {computed.weeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-[5px] flex-1">
                  {week.map((day, dIdx) => (
                    <div
                      key={day.date}
                      style={{ animationDelay: `${wIdx * 12 + dIdx * 6}ms` }}
                      className={`animate-heatmap-cell aspect-square w-full rounded-[2px] transition-transform hover:scale-150 hover:z-20 cursor-pointer ${getHeatmapCellStyle(
                        day.level
                      )}`}
                      title={`${day.date}: ${day.count} sprints completed`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ animationDelay: '260ms' }}
        className="animate-studio-enter grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Tech Stack Practiced
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {computed.stackBreakdown.length} Languages Logged
            </span>
          </div>
          {computed.stackBreakdown.length === 0 ? (
            <div className="py-10 text-center space-y-3 border border-dashed border-white/10 rounded-xl">
              <p className="text-xs font-mono text-neutral-400">
                No typing sprints recorded in database yet.
              </p>
              <Link
                href="/"
                className="inline-block px-3.5 py-1.5 rounded-lg bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-xs font-mono cursor-pointer hover:bg-[#10b981]/25"
              >
                + Launch Studio & Complete a Sprint
              </Link>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {computed.stackBreakdown.map((item) => (
                <div key={item.lang} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{item.lang}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-300">
                        {item.ext}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#10b981] font-bold">
                        Peak {item.bestWpm} WPM
                      </span>
                      <span className="text-neutral-400">
                        {item.runs} {item.runs === 1 ? 'run' : 'runs'} ({item.percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Developer Honors & Badges
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#10b981]">
              Real-Time Verification
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              {
                title: 'First Blood Commit',
                desc: 'Complete 1+ Verified Sprint',
                unlocked: computed.totalTests >= 1,
                icon: Sparkles,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              },
              {
                title: '100+ WPM Demon',
                desc: 'Reach 100+ WPM Peak Speed',
                unlocked: computed.peakWpm >= 100,
                icon: Zap,
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              },
              {
                title: 'Polyglot Architect',
                desc: 'Practice 3+ Programming Languages',
                unlocked: computed.stackBreakdown.length >= 3,
                icon: Layers,
                color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
              },
              {
                title: 'Zero-Bug Compiler',
                desc: 'Maintain 98%+ Avg Syntax Accuracy',
                unlocked: computed.totalTests > 0 && Number(computed.avgAcc) >= 98,
                icon: Target,
                color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              },
            ].map((b) => {
              const IconComp = b.icon;
              return (
                <div
                  key={b.title}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                    b.unlocked
                      ? 'bg-white/[0.04] border-white/15'
                      : 'bg-white/[0.01] border-white/5 opacity-45 grayscale'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${b.color}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white">{b.title}</p>
                      {b.unlocked && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#10b981]">
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 font-mono">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{ animationDelay: '320ms' }}
        className="animate-studio-enter p-6 rounded-2xl border border-white/10 bg-[#0c0e14] space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#10b981]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Recent Verified Telemetry Log
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Latest {Math.min(10, sessions.length)} Sprints
          </span>
        </div>
        {sessions.length === 0 ? (
          <p className="text-xs font-mono text-neutral-500 py-4">
            Complete a typing test in the studio to see your live session telemetry here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Raw</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.slice(0, 10).map((s, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {s.language}{' '}
                      <span className="text-[10px] text-[#10b981]">{s.ext}</span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 uppercase">
                      {s.mode} ({s.length_tier})
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#10b981]">{s.wpm} WPM</td>
                    <td className="py-2.5 px-3 text-neutral-400">{s.raw_wpm} WPM</td>
                    <td className="py-2.5 px-3 text-white">{s.accuracy}%</td>
                    <td className="py-2.5 px-3 text-neutral-500">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-neutral-100 font-sans selection:bg-[#10b981]/30 pb-24">
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 animate-studio-dock">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-neutral-300 hover:text-white transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#10b981]" />
          Return to Typing Studio
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-mono transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </nav>

      <Suspense fallback={<TelemetryBootFallback />}>
        <ProfileTelemetry />
      </Suspense>
    </div>
  );
}
