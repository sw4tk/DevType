'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, ArrowRight, Terminal, Sparkles } from 'lucide-react';

export default function AuthVerifiedPage() {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [username, setUsername] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Clear any leftover hash or query params from the URL bar cleanly
    if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
      window.history.replaceState(null, '', '/auth/verified');
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.user_name ||
          user.email?.split('@')[0] ||
          'Developer';
        setUsername(name);
      }
    });

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="min-h-screen bg-[#06070a] text-neutral-100 font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Ambient Emerald Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[340px] blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(circle at center, #10b981 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b0d13]/95 backdrop-blur-xl p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative z-10 space-y-6 animate-studio-enter text-center">
        {/* Top Terminal Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="text-neutral-400 ml-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#10b981]" />
              auth://session-verified
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-bold">
            200 OK
          </span>
        </div>

        {/* Animated Checkmark Icon */}
        <div className="py-2 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-9 h-9 text-[#10b981]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black font-poppins text-white tracking-tight">
              Sign In Successful
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {username ? (
                <>
                  Welcome back, <span className="text-[#10b981] font-bold">@{username}</span>! Your developer profile and telemetry matrix are now synced.
                </>
              ) : (
                'Your email has been verified and your developer session is now active.'
              )}
            </p>
          </div>
        </div>

        {/* 5-Second Countdown Bar */}
        <div className="space-y-2 bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-[11px] text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
              Launching Typing Studio...
            </span>
            <span className="text-[#10b981] font-bold">{secondsLeft}s</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-[#10b981] transition-all duration-1000 ease-linear shadow-[0_0_12px_#10b981]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Manual Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] hover:bg-[#0ea572] text-black font-bold text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <span>Enter Studio Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
