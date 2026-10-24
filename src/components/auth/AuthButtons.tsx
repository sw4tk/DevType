'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loginGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (user) {
    const avatarUrl =
      user.user_metadata?.avatar_url || 'https://github.com/identicons/devtype.png';
    const username =
      user.user_metadata?.user_name || user.email?.split('@')[0] || 'dev';

    return (
      <Link
        href="/profile"
        style={{
          borderColor: 'rgba(16, 185, 129, 0.45)',
          background:
            'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.04) 100%)',
          boxShadow:
            '0 4px 0 0 #060609, 0 6px 14px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.22)',
        }}
        className="group flex items-center gap-2.5 pl-2 pr-3.5 py-1 rounded-xl border active:translate-y-[2px] transition-all cursor-pointer select-none shrink-0"
        title="Open Developer Telemetry & Full Profile"
      >
        <div className="relative shrink-0">
          <img
            src={avatarUrl}
            alt={username}
            className="w-6 h-6 rounded-lg object-cover border-[1.5px] border-[#10b981] bg-black avatar-3d"
          />
          <span
            style={{ boxShadow: '0 0 6px #10b981' }}
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black bg-[#10b981]"
          />
        </div>
        <span className="font-poppins text-xs font-bold text-white tracking-tight whitespace-nowrap">
          @{username}
        </span>
      </Link>
    );
  }

  return (
    <button
      onClick={loginGitHub}
      style={{
        boxShadow:
          '0 4px 0 0 #060609, 0 6px 14px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.22)',
      }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/15 transition-all text-xs font-mono active:translate-y-[2px] cursor-pointer shrink-0"
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
      Sign In
    </button>
  );
}
