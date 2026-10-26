'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  DeveloperUser,
  DeveloperSocials,
  HistoryRecord,
  LANGUAGES,
} from '@/constants/languages';
import { StudioTheme, STUDIO_THEMES } from '@/constants/themes';
import {
  isSupabaseConfigured,
  signInWithGitHubOAuth,
  getSupabaseCredentials,
  saveSupabaseCredentialsRuntime,
  fetchSupabaseTableStats,
} from '@/utils/supabaseClient';
import { seedSupabaseCorpusNow } from '@/utils/githubScraper';
import { createSeededRandom } from '@/utils/codeSynthesizer';
import {
  Trophy,
  Flame,
  Clock,
  Zap,
  Globe,
  LogOut,
  Cloud,
  Sparkles,
  Award,
  Activity,
  Download,
  UserCheck,
  Terminal,
  Calendar,
  ArrowLeft,
  Code2,
  MapPin,
  ExternalLink,
  Edit3,
  Check,
  Share2,
  Database,
  Loader2,
} from 'lucide-react';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DeveloperUser | null;
  onLoginUser: (user: DeveloperUser) => void;
  onLogoutUser: () => void;
  sessionLogs: HistoryRecord[];
  todayStr: string;
  accentColor: string;
  theme?: StudioTheme;
}

type IdeTab = 'dossier' | 'socials' | 'mastery' | 'leaderboard' | 'commits' | 'cloud';

export default function DeveloperProfileModal({
  isOpen,
  onClose,
  user,
  onLoginUser,
  onLogoutUser,
  sessionLogs,
  todayStr,
  accentColor,
  theme = STUDIO_THEMES[0],
}: DeveloperProfileModalProps) {
  const [activeTab, setActiveTab] = useState<IdeTab>('dossier');
  const [githubHandleInput, setGithubHandleInput] = useState('sw4tk');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('Full-Stack Systems Engineer');
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    bestWpm: number;
  } | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  // Supabase Runtime Cloud Inspector State
  const [sbUrlInput, setSbUrlInput] = useState('');
  const [sbKeyInput, setSbKeyInput] = useState('');
  const [dbStats, setDbStats] = useState<{
    sessionsCount: number;
    corpusCount: number;
    error?: string;
  } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');

  const cloudActive = isSupabaseConfigured();

  // Socials Form State
  const [socialsForm, setSocialsForm] = useState<DeveloperSocials>({
    github: user?.socials?.github || user?.username || 'sw4tk',
    twitter: user?.socials?.twitter || '',
    linkedin: user?.socials?.linkedin || '',
    website: user?.socials?.website || '',
    youtube: user?.socials?.youtube || '',
    leetcode: user?.socials?.leetcode || '',
    discord: user?.socials?.discord || '',
    location: user?.socials?.location || 'India',
    bio:
      user?.socials?.bio ||
      'Building high-frequency web apps, low-latency engines & clean developer tools.',
  });

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setSbUrlInput(creds.url);
      setSbKeyInput(creds.key);
      if (creds.configured) {
        fetchSupabaseTableStats().then(setDbStats);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setSocialsForm({
        github: user.socials?.github || user.username || '',
        twitter: user.socials?.twitter || '',
        linkedin: user.socials?.linkedin || '',
        website: user.socials?.website || '',
        youtube: user.socials?.youtube || '',
        leetcode: user.socials?.leetcode || '',
        discord: user.socials?.discord || '',
        location: user.socials?.location || 'India',
        bio:
          user.socials?.bio ||
          'Building high-frequency web apps, low-latency engines & clean developer tools.',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const analytics = useMemo(() => {
    const totalRuns = sessionLogs.length;
    const totalChars = sessionLogs.reduce((acc, r) => acc + (r.chars || 0), 0);

    const totalSeconds = sessionLogs.reduce((acc, r) => {
      if (r.durationSec && r.durationSec > 0) return acc + r.durationSec;
      const estimatedMin = (r.chars || 120) / 5 / Math.max(r.wpm || 60, 25);
      return acc + Math.round(estimatedMin * 60);
    }, 0);

    const hoursTyped = (totalSeconds / 3600).toFixed(2);
    const minutesTyped = Math.round(totalSeconds / 60);

    const avgWpm =
      totalRuns > 0
        ? Math.round(sessionLogs.reduce((acc, r) => acc + r.wpm, 0) / totalRuns)
        : 0;
    const peakWpm = sessionLogs.reduce((max, r) => Math.max(max, r.wpm), 0);
    const avgAccuracy =
      totalRuns > 0
        ? (sessionLogs.reduce((acc, r) => acc + r.accuracy, 0) / totalRuns).toFixed(1)
        : '100.0';

    const totalXp = totalChars * 2 + totalRuns * 50;
    const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 120)) + 1);
    const nextLevelXp = Math.pow(level, 2) * 120;
    const prevLevelXp = Math.pow(level - 1, 2) * 120;
    const levelProgress = Math.min(
      100,
      Math.max(
        6,
        Math.round(((totalXp - prevLevelXp) / Math.max(1, nextLevelXp - prevLevelXp)) * 100)
      )
    );

    const dateMap = new Map<string, { count: number; bestWpm: number }>();
    sessionLogs.forEach((log) => {
      const prev = dateMap.get(log.date) || { count: 0, bestWpm: 0 };
      dateMap.set(log.date, {
        count: prev.count + 1,
        bestWpm: Math.max(prev.bestWpm, log.wpm),
      });
    });

    const heatmapDays: { date: string; count: number; bestWpm: number }[] = [];
    const now = new Date();
    for (let i = 181; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const stat = dateMap.get(iso) || { count: 0, bestWpm: 0 };
      heatmapDays.push({ date: iso, count: stat.count, bestWpm: stat.bestWpm });
    }

    let currentStreak = 0;
    for (let i = heatmapDays.length - 1; i >= 0; i--) {
      if (heatmapDays[i].count > 0) {
        currentStreak++;
      } else if (i === heatmapDays.length - 1) {
        continue;
      } else {
        break;
      }
    }

    const langStats = LANGUAGES.map((spec) => {
      const runs = sessionLogs.filter((r) => r.langId === spec.id);
      if (runs.length === 0) return null;
      const best = runs.reduce((m, r) => Math.max(m, r.wpm), 0);
      const avg = Math.round(runs.reduce((a, r) => a + r.wpm, 0) / runs.length);
      const acc = (runs.reduce((a, r) => a + r.accuracy, 0) / runs.length).toFixed(1);
      const chars = runs.reduce((a, r) => a + (r.chars || 0), 0);
      const sec = runs.reduce((a, r) => a + (r.durationSec || 18), 0);
      return {
        spec,
        runs: runs.length,
        best,
        avg,
        acc,
        chars,
        minutes: Math.max(1, Math.round(sec / 60)),
      };
    })
      .filter(Boolean)
      .sort((a, b) => b!.best - a!.best) as {
      spec: (typeof LANGUAGES)[0];
      runs: number;
      best: number;
      avg: number;
      acc: string;
      chars: number;
      minutes: number;
    }[];

    const rng = createSeededRandom(`global_rank_${todayStr}`);
    const baseCompetitors = [
      { handle: 'torvalds_rs', title: 'Kernel Architect', lang: 'Rust', wpm: 148, acc: 99.7 },
      { handle: 'primeagen_vim', title: 'Neovim Zealot', lang: 'TypeScript', wpm: 136, acc: 99.2 },
      { handle: 'mitchellh_zig', title: 'Ghostty Creator', lang: 'Zig', wpm: 129, acc: 98.9 },
      { handle: 'rauchg_vercel', title: 'Edge Pioneer', lang: 'TypeScript', wpm: 121, acc: 98.5 },
      { handle: 'karpathy_ai', title: 'CUDA Whisperer', lang: 'Python', wpm: 115, acc: 98.2 },
      { handle: 'antirez_redis', title: 'ANSI C Master', lang: 'C', wpm: 109, acc: 98.0 },
      { handle: 'dan_abramov', title: 'UI Alchemist', lang: 'TypeScript', wpm: 102, acc: 97.8 },
    ].map((c) => ({
      ...c,
      wpm: c.wpm + Math.floor(rng() * 6) - 3,
      isUser: false,
    }));

    const userEffectiveWpm = peakWpm || 0;
    const fullBoard = [
      ...baseCompetitors,
      {
        handle: user?.username || 'you_local',
        title: user?.title || 'Systems Engineer',
        lang: langStats[0]?.spec.name || 'TypeScript',
        wpm: userEffectiveWpm,
        acc: parseFloat(avgAccuracy),
        isUser: true,
      },
    ].sort((a, b) => b.wpm - a.wpm);

    const userRankIndex = fullBoard.findIndex((r) => r.isUser) + 1;
    const globalPercentile =
      userEffectiveWpm >= 120
        ? 'Top 0.4%'
        : userEffectiveWpm >= 95
        ? 'Top 2.1%'
        : userEffectiveWpm >= 75
        ? 'Top 8.5%'
        : userEffectiveWpm >= 50
        ? 'Top 24%'
        : 'Active';

    return {
      totalRuns,
      totalChars,
      hoursTyped,
      minutesTyped,
      avgWpm,
      peakWpm,
      avgAccuracy,
      totalXp,
      level,
      levelProgress,
      currentStreak,
      heatmapDays,
      langStats,
      fullBoard,
      userRankIndex,
      globalPercentile,
    };
  }, [sessionLogs, todayStr, user]);

  if (!isOpen) return null;

  const handleInstantLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = githubHandleInput.trim().replace(/^@/, '') || 'developer';
    const newUser: DeveloperUser = {
      id: `dev_${cleanHandle.toLowerCase()}`,
      username: cleanHandle,
      email: emailInput.trim() || `${cleanHandle}@github.user`,
      avatarUrl: `https://github.com/${cleanHandle}.png`,
      githubHandle: cleanHandle,
      title: roleInput.trim() || 'Full-Stack Systems Engineer',
      isCloudSynced: isSupabaseConfigured(),
      joinedAt: todayStr,
      socials: {
        ...socialsForm,
        github: cleanHandle,
      },
    };
    onLoginUser(newUser);
  };

  const handleSaveSocials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updatedUser: DeveloperUser = {
      ...user,
      title: roleInput.trim() || user.title || 'Full-Stack Systems Engineer',
      socials: {
        ...socialsForm,
        github: user.username,
      },
    };
    onLoginUser(updatedUser);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2200);
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentialsRuntime(sbUrlInput, sbKeyInput);
    const stats = await fetchSupabaseTableStats();
    setDbStats(stats);
  };

  const handleBulkSeedCorpus = async () => {
    setIsSeeding(true);
    setSeedSuccessMsg('');
    const res = await seedSupabaseCorpusNow();
    const stats = await fetchSupabaseTableStats();
    setDbStats(stats);
    setIsSeeding(false);
    setSeedSuccessMsg(`Seeded ${res.totalInserted} open-source snippets into Supabase!`);
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ user, sessionLogs }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtype-telemetry-backup-${todayStr}.json`;
    a.click();
  };

  const activeSocialBadges = [
    {
      key: 'github',
      label: 'GitHub',
      val: user?.socials?.github || user?.username,
      href: (v: string) => (v.startsWith('http') ? v : `https://github.com/${v.replace(/^@/, '')}`),
    },
    {
      key: 'twitter',
      label: 'X / Twitter',
      val: user?.socials?.twitter,
      href: (v: string) => (v.startsWith('http') ? v : `https://x.com/${v.replace(/^@/, '')}`),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      val: user?.socials?.linkedin,
      href: (v: string) =>
        v.startsWith('http') ? v : `https://linkedin.com/in/${v.replace(/^@/, '')}`,
    },
    {
      key: 'youtube',
      label: 'YouTube',
      val: user?.socials?.youtube,
      href: (v: string) =>
        v.startsWith('http') ? v : `https://youtube.com/@${v.replace(/^@/, '')}`,
    },
    {
      key: 'leetcode',
      label: 'LeetCode',
      val: user?.socials?.leetcode,
      href: (v: string) =>
        v.startsWith('http') ? v : `https://leetcode.com/u/${v.replace(/^@/, '')}`,
    },
    {
      key: 'website',
      label: 'Portfolio',
      val: user?.socials?.website,
      href: (v: string) => (v.startsWith('http') ? v : `https://${v}`),
    },
  ].filter((b) => Boolean(b.val && b.val.trim().length > 0));

  return (
    <div
      style={{ backgroundColor: theme.bg }}
      className="fixed inset-0 z-50 w-screen h-dvh max-h-dvh text-neutral-300 font-mono flex flex-col justify-between overflow-hidden select-none px-6 py-4"
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

      {/* TOP STUDIO NAVIGATION DOCK */}
      <header className="relative z-10 w-full max-w-6xl mx-auto shrink-0">
        <div
          style={{ backgroundColor: `${theme.surface}e0` }}
          className="flex flex-wrap items-center justify-between gap-3 backdrop-blur-2xl border border-white/[0.08] px-4 py-2 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_15px_35px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>Back to Studio (Esc)</span>
            </button>

            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
              <Terminal className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>~/devtype/users/</span>
              <span className="text-white font-bold">@{user?.username || 'guest'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('cloud')}
              className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/25"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {cloudActive ? 'Supabase Cloud Connected' : 'Connect Supabase DB'}
            </button>

            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Backup JSON</span>
            </button>

            {user && (
              <button
                onClick={onLogoutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN FULL-PAGE MAC IDE WORKSPACE */}
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col justify-center py-2.5">
        <div
          style={{ backgroundColor: `${theme.surface}e6` }}
          className="relative flex-1 min-h-0 flex flex-col rounded-2xl backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          <div
            className="w-full h-[2.5px] shrink-0"
            style={{ backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}` }}
          />

          {/* macOS Window Chrome + IDE File Buffer Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-white/[0.06] bg-black/40 text-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onClose}
                  className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] hover:opacity-80 cursor-pointer"
                  title="Close Workspace"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90" />
              </div>

              <div className="h-3.5 w-[1px] bg-white/10" />

              <div className="flex flex-wrap items-center gap-1 bg-black/50 p-0.5 rounded-xl border border-white/[0.06]">
                {(
                  [
                    { id: 'dossier', file: 'dossier.tsx', icon: Activity },
                    { id: 'socials', file: 'socials.config.ts', icon: Share2 },
                    { id: 'mastery', file: `mastery.rs (${analytics.langStats.length})`, icon: Globe },
                    { id: 'leaderboard', file: `rank_#${analytics.userRankIndex}.sql`, icon: Trophy },
                    { id: 'commits', file: 'commits.log', icon: Clock },
                    { id: 'cloud', file: 'supabase.env', icon: Database },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      style={
                        active
                          ? { color: accentColor, borderColor: `${accentColor}44` }
                          : undefined
                      }
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-white/[0.08] border shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{t.file}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-[11px] text-neutral-500">
              <span>UTF-8</span>
              <span>•</span>
              <span style={{ color: accentColor }}>LVL {analytics.level} ENGINEER</span>
            </div>
          </div>

          {/* 2-PANE IDE BODY */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06] overflow-hidden">
            {/* LEFT PANE (4 COLS): DEVELOPER IDENTITY, BIO & SOCIAL LINKS */}
            <div className="lg:col-span-4 p-5 bg-black/20 flex flex-col justify-between overflow-y-auto">
              {!user ? (
                <div className="space-y-4 my-auto p-2">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                    <Cloud className="w-3.5 h-3.5" /> Verified Supabase Auth
                  </div>
                  <h2 className="text-base font-bold text-white leading-snug">
                    Authenticate Your Developer Account
                  </h2>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Sign in with your verified account to prevent stat spoofing, sync your WPM telemetry to Supabase, and unlock your Career Dossier.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => signInWithGitHubOAuth()}
                      style={{ backgroundColor: accentColor }}
                      className="w-full py-2.5 rounded-xl text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all shadow-lg"
                    >
                      <Terminal className="w-4 h-4" />
                      Continue with GitHub OAuth
                    </button>

                    <a
                      href="/login"
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <UserCheck className="w-4 h-4" style={{ color: accentColor }} />
                      Sign In / Create Account
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://github.com/identicons/devtype.png';
                      }}
                      style={{ borderColor: accentColor }}
                      className="w-16 h-16 rounded-2xl border-2 object-cover bg-black shrink-0 avatar-3d"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-white truncate">
                          @{user.username}
                        </h2>
                        <span
                          style={{
                            color: accentColor,
                            borderColor: `${accentColor}55`,
                            backgroundColor: `${accentColor}1a`,
                          }}
                          className="px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0"
                        >
                          LVL {analytics.level}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 truncate mt-0.5">{user.title}</p>
                      {user.socials?.location && (
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{user.socials.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
                    <span className="text-neutral-500 select-none">// bio: </span>
                    {user.socials?.bio ||
                      'Building high-frequency web apps, low-latency engines & clean developer tools.'}
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400 font-semibold">COMPILER XP</span>
                      <span className="font-bold" style={{ color: accentColor }}>
                        {analytics.totalXp.toLocaleString()} XP ({analytics.globalPercentile})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${analytics.levelProgress}%`,
                          backgroundColor: accentColor,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-500">
                      <span>Connected Socials & Links</span>
                      <button
                        onClick={() => setActiveTab('socials')}
                        className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Socials
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {activeSocialBadges.map((b) => (
                        <a
                          key={b.key}
                          href={b.href(b.val!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] text-[11px] text-neutral-200 transition-all group"
                        >
                          <div className="truncate pr-1">
                            <span className="text-neutral-500 block text-[9px] uppercase">
                              {b.label}
                            </span>
                            <span className="font-semibold truncate block">{b.val}</span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-white shrink-0" />
                        </a>
                      ))}
                      {user.socials?.discord && (
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] text-neutral-200">
                          <div className="truncate">
                            <span className="text-neutral-500 block text-[9px] uppercase">
                              Discord
                            </span>
                            <span className="font-semibold truncate block">
                              {user.socials.discord}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
                <span>Joined {user?.joinedAt || todayStr}</span>
                <button
                  onClick={() => setActiveTab('socials')}
                  style={{ color: accentColor }}
                  className="font-bold hover:underline cursor-pointer"
                >
                  + Add Social Links
                </button>
              </div>
            </div>

            {/* RIGHT PANE (8 COLS): ACTIVE IDE BUFFER CONTENT */}
            <div className="lg:col-span-8 p-5 flex flex-col justify-between overflow-y-auto">
              {/* BUFFER 1: DOSSIER.TSX */}
              {activeTab === 'dossier' && (
                <div className="space-y-4 my-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-black/45 border border-white/[0.07] p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase text-neutral-500 flex items-center justify-between">
                        <span>Hours Typed</span>
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white mt-1">
                        {analytics.hoursTyped}h
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {analytics.minutesTyped} mins active
                      </div>
                    </div>

                    <div className="bg-black/45 border border-white/[0.07] p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase text-neutral-500 flex items-center justify-between">
                        <span>Daily Global Rank</span>
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-amber-400 mt-1">
                        #{analytics.userRankIndex}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {analytics.globalPercentile}
                      </div>
                    </div>

                    <div className="bg-black/45 border border-white/[0.07] p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase text-neutral-500 flex items-center justify-between">
                        <span>Commit Streak</span>
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-orange-400 mt-1">
                        {analytics.currentStreak}d
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {analytics.totalRuns} total sessions
                      </div>
                    </div>

                    <div className="bg-black/45 border border-white/[0.07] p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase text-neutral-500 flex items-center justify-between">
                        <span>Career Peak WPM</span>
                        <Zap className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      </div>
                      <div
                        className="text-2xl font-extrabold mt-1"
                        style={{ color: accentColor }}
                      >
                        {analytics.peakWpm}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Career Avg: {analytics.avgWpm} WPM
                      </div>
                    </div>

                    <div className="bg-black/45 border border-white/[0.07] p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase text-neutral-500 flex items-center justify-between">
                        <span>Precision</span>
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white mt-1">
                        {analytics.avgAccuracy}%
                      </div>
                      <div className="text-[10px] text-neutral-500">Mean token accuracy</div>
                    </div>

                    <div className="bg-black/45 border border-white/[0.07] p-3.5 rounded-2xl">
                      <div className="text-[10px] uppercase text-neutral-500 flex items-center justify-between">
                        <span>Code Compiled</span>
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-cyan-300 mt-1">
                        {(analytics.totalChars / 1000).toFixed(1)}k
                      </div>
                      <div className="text-[10px] text-neutral-500">keystrokes logged</div>
                    </div>
                  </div>

                  <div className="bg-black/45 border border-white/[0.07] p-4 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" style={{ color: accentColor }} />
                          182-Day Developer Consistency & Streak Matrix
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Every completed code sprint illuminates your daily contribution graph
                        </p>
                      </div>
                      <div className="text-xs font-semibold" style={{ color: accentColor }}>
                        {hoveredDay
                          ? `${hoveredDay.date}: ${hoveredDay.count} runs (Best: ${hoveredDay.bestWpm} WPM)`
                          : 'Hover any cell to inspect daily telemetry'}
                      </div>
                    </div>

                    <div className="grid grid-cols-26 gap-1.5 pt-1">
                      {analytics.heatmapDays.map((d) => {
                        const intensity =
                          d.count === 0
                            ? 'bg-white/[0.04] border-white/[0.04]'
                            : d.count === 1
                            ? 'bg-emerald-500/35 border-emerald-400/40'
                            : d.count <= 3
                            ? 'bg-emerald-500/65 border-emerald-400/60'
                            : 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.6)]';

                        return (
                          <div
                            key={d.date}
                            onMouseEnter={() => setHoveredDay(d)}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`h-3.5 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${intensity}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* BUFFER 2: SOCIALS.CONFIG.TS */}
              {activeTab === 'socials' && (
                <form onSubmit={handleSaveSocials} className="space-y-3.5 my-auto">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Code2 className="w-4 h-4" style={{ color: accentColor }} />
                        export const developerSocials = &#123; ... &#125;
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Configure your social handles, portfolio domain, and developer bio
                      </p>
                    </div>
                    {savedBanner && (
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Saved to Profile!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        GitHub Handle (Auto-loads Avatar)
                      </label>
                      <input
                        type="text"
                        value={socialsForm.github || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, github: e.target.value })
                        }
                        placeholder="sw4tk"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        X (Twitter) Handle
                      </label>
                      <input
                        type="text"
                        value={socialsForm.twitter || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, twitter: e.target.value })
                        }
                        placeholder="@swastik_dev"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        LinkedIn Handle or URL
                      </label>
                      <input
                        type="text"
                        value={socialsForm.linkedin || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, linkedin: e.target.value })
                        }
                        placeholder="swastik-mandal"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        Portfolio Website (.in / .dev)
                      </label>
                      <input
                        type="text"
                        value={socialsForm.website || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, website: e.target.value })
                        }
                        placeholder="https://swastik.in"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        YouTube Channel Handle
                      </label>
                      <input
                        type="text"
                        value={socialsForm.youtube || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, youtube: e.target.value })
                        }
                        placeholder="@swastikcreates"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        LeetCode Username
                      </label>
                      <input
                        type="text"
                        value={socialsForm.leetcode || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, leetcode: e.target.value })
                        }
                        placeholder="sw4tk_lc"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        Discord Tag
                      </label>
                      <input
                        type="text"
                        value={socialsForm.discord || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, discord: e.target.value })
                        }
                        placeholder="sw4tk#0001"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={socialsForm.location || ''}
                        onChange={(e) =>
                          setSocialsForm({ ...socialsForm, location: e.target.value })
                        }
                        placeholder="India"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Developer Bio / Status Line
                    </label>
                    <input
                      type="text"
                      value={socialsForm.bio || ''}
                      onChange={(e) => setSocialsForm({ ...socialsForm, bio: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: accentColor }}
                    className="w-full py-2.5 rounded-xl text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:opacity-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Save Socials & Compile Dossier
                  </button>
                </form>
              )}

              {/* BUFFER 3: MASTERY.RS */}
              {activeTab === 'mastery' && (
                <div className="space-y-3 my-auto">
                  {analytics.langStats.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 bg-black/40 rounded-2xl border border-white/[0.06]">
                      Complete a typing sprint in any of the 56 languages to unlock per-language
                      mastery telemetry.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analytics.langStats.slice(0, 6).map((item) => {
                        const masteryPct = Math.min(100, Math.round((item.best / 120) * 100));
                        const rankTitle =
                          item.best >= 100
                            ? 'Principal'
                            : item.best >= 80
                            ? 'Staff'
                            : item.best >= 60
                            ? 'Senior'
                            : 'Engineer';
                        return (
                          <div
                            key={item.spec.id}
                            className="p-4 rounded-2xl bg-black/45 border border-white/[0.07] space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white">
                                    {item.spec.name}
                                  </span>
                                  <span
                                    style={{
                                      color: accentColor,
                                      borderColor: `${accentColor}44`,
                                    }}
                                    className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border font-bold"
                                  >
                                    {rankTitle}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 mt-0.5">
                                  {item.runs} runs • {item.minutes}m typed •{' '}
                                  {item.chars.toLocaleString()} chars
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className="text-lg font-extrabold"
                                  style={{ color: accentColor }}
                                >
                                  {item.best} WPM
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  Avg {item.avg} • {item.acc}% ACC
                                </div>
                              </div>
                            </div>

                            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${masteryPct}%`, backgroundColor: accentColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* BUFFER 4: LEADERBOARD.SQL */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-2 my-auto">
                  {analytics.fullBoard.slice(0, 7).map((entry, idx) => (
                    <div
                      key={`${entry.handle}_${idx}`}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                        entry.isUser
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                          : 'bg-black/45 border-white/[0.06] text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-xs font-extrabold w-6 text-amber-400">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            <span>@{entry.handle}</span>
                            {entry.isUser && (
                              <span
                                style={{ backgroundColor: accentColor }}
                                className="text-[9px] px-1.5 py-0.5 rounded text-black font-extrabold"
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500">{entry.title}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400 text-[10px]">
                          {entry.lang}
                        </span>
                        <span className="text-neutral-400">{entry.acc}%</span>
                        <span
                          className="text-sm font-extrabold w-20 text-right"
                          style={{ color: accentColor }}
                        >
                          {entry.wpm} WPM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BUFFER 5: COMMITS.LOG */}
              {activeTab === 'commits' && (
                <div className="space-y-2 my-auto">
                  {sessionLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 bg-black/40 rounded-2xl border border-white/[0.06]">
                      No runs recorded yet. Start typing to populate your commit log!
                    </div>
                  ) : (
                    sessionLogs
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/45 border border-white/[0.06] text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-500">{r.date}</span>
                            <span className="font-bold text-white uppercase">{r.langId}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400">
                              {r.chars} chars
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-neutral-400">{r.accuracy}% ACC</span>
                            <span className="font-extrabold" style={{ color: accentColor }}>
                              {r.wpm} WPM
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* BUFFER 6: SUPABASE.ENV (LIVE CLOUD CONNECTOR & 1-CLICK SEEDER) */}
              {activeTab === 'cloud' && (
                <div className="space-y-4 my-auto">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4" style={{ color: accentColor }} />
                        Supabase PostgreSQL Cloud Connector & Corpus Seeder
                      </h3>
                      <p className="text-[11px] text-neutral-500">
                        Connect your Supabase project and seed 150+ real GitHub code chunks in one
                        click
                      </p>
                    </div>
                    {dbStats && !dbStats.error && (
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                        Live DB: {dbStats.sessionsCount} runs • {dbStats.corpusCount} snippets
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        NEXT_PUBLIC_SUPABASE_URL
                      </label>
                      <input
                        type="text"
                        value={sbUrlInput}
                        onChange={(e) => setSbUrlInput(e.target.value)}
                        placeholder="https://your-project-id.supabase.co"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                        NEXT_PUBLIC_SUPABASE_ANON_KEY
                      </label>
                      <input
                        type="password"
                        value={sbKeyInput}
                        onChange={(e) => setSbKeyInput(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs cursor-pointer transition-all"
                      >
                        Save & Test Connection
                      </button>

                      <button
                        type="button"
                        onClick={handleBulkSeedCorpus}
                        disabled={isSeeding || !cloudActive}
                        style={{ backgroundColor: accentColor }}
                        className="flex-1 py-2.5 rounded-xl text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-lg"
                      >
                        {isSeeding ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Seeding GitHub Corpus...
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            Seed 150+ Snippets to Supabase Now
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {dbStats?.error && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                      Status: {dbStats.error}
                    </div>
                  )}

                  {seedSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 font-bold">
                      {seedSuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM IDE STATUS BAR FOOTER */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto shrink-0 flex items-center justify-between text-[11px] text-neutral-500 px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" style={{ color: accentColor }} />
          <span>
            Workspace: <strong className="text-neutral-300">Developer Telemetry IDE</strong> •{' '}
            {analytics.totalRuns} total sessions compiled
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
              Esc
            </kbd>{' '}
            Return to Typing Studio
          </span>
        </div>
      </footer>
    </div>
  );
}