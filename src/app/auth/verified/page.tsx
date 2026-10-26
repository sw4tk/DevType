'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { STUDIO_THEMES, StudioTheme } from '@/constants/themes';
import { CheckCircle2, ArrowRight, Terminal, Sparkles } from 'lucide-react';

export default function AuthVerifiedPage() {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [username, setUsername] = useState<string>('');
  const [theme, setTheme] = useState<StudioTheme>(STUDIO_THEMES[0]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    try {
      const savedThemeId = localStorage.getItem('dt_theme');
      if (savedThemeId) {
        const found = STUDIO_THEMES.find((t) => t.id === savedThemeId);
        if (found) setTheme(found);
      }
    } catch {}

    if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
      window.history.replaceState(null, '', '/auth/verified');
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.user_name ||
          user.user_metadata?.preferred_username ||
          user.email?.split('@')[0] ||
          'Developer';
        setUsername(name);
      }
    });

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [supabase]);

  // Navigate outside of the state updater to prevent React render conflicts
  useEffect(() => {
    if (secondsLeft === 0) {
      router.push('/');
    }
  }, [secondsLeft, router]);

  const progressPercent = Math.min(100, Math.max(0, ((5 - secondsLeft) / 5) * 100));

  return (
    <div
      style={{ backgroundColor: theme.bg }}
      className="min-h-screen text-neutral-100 font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden select-none transition-colors duration-300"
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[380px] blur-3xl opacity-60 transition-all duration-500"
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
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 100%)',
        }}
      />

      <div
        style={{ backgroundColor: `${theme.surface}f2` }}
        className="w-full max-w-md rounded-2xl border border-white/15 backdrop-blur-2xl p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_25px_70px_rgba(0,0,0,0.95)] relative z-10 space-y-6 animate-studio-enter text-center"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            <span className="text-neutral-400 ml-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              auth://session-verified
            </span>
          </div>
          <span
            style={{
              color: theme.accent,
              borderColor: `${theme.accent}55`,
              backgroundColor: `${theme.accent}1a`,
            }}
            className="text-[10px] px-2 py-0.5 rounded border font-bold"
          >
            200 OK
          </span>
        </div>

        <div className="py-2 flex flex-col items-center space-y-4">
          <div
            style={{
              backgroundColor: `${theme.accent}1f`,
              borderColor: `${theme.accent}66`,
              boxShadow: `0 0 35px ${theme.accent}33`,
            }}
            className="w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300"
          >
            <CheckCircle2 className="w-9 h-9" style={{ color: theme.accent }} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black font-poppins text-white tracking-tight">
              Sign In Successful
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {username ? (
                <>
                  Welcome back,{' '}
                  <span className="font-bold" style={{ color: theme.accent }}>
                    @{username}
                  </span>
                  ! Your developer profile and telemetry matrix are now synced.
                </>
              ) : (
                'Your email has been verified and your developer session is now active.'
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2 bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              Launching Typing Studio...
            </span>
            <span className="font-bold" style={{ color: theme.accent }}>
              {secondsLeft}s
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: theme.accent,
                boxShadow: `0 0 12px ${theme.accent}`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Link
            href="/"
            style={{ backgroundColor: theme.accent }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-neutral-950 font-extrabold text-xs transition-all cursor-pointer hover:opacity-90 shadow-lg active:scale-98"
          >
            <span>Enter Studio Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}