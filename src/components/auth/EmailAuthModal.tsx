'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import { Mail, Lock, X, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailAuthModal({ isOpen, onClose }: EmailAuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/verified`,
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          // Supabase returns an empty identities array if the email is already registered (e.g. via GitHub)
          setError('This email is already registered. Try signing in instead or continue with GitHub.');
        } else if (data.session) {
          // If "Confirm email" is disabled in Supabase, log them in immediately
          setEmail('');
          setPassword('');
          onClose();
          window.location.reload();
        } else {
          // Clear both inputs so the user gets a clean sense of completion
          setEmail('');
          setPassword('');
          setMessage('Account created! Check your inbox (or spam folder) for the activation link.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
        } else {
          setEmail('');
          setPassword('');
          onClose();
          window.location.reload();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      onKeyDown={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-studio-enter"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b0d13] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative space-y-5 font-mono"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1.5 pr-6">
          <h2 className="text-xl font-bold font-poppins text-white tracking-tight">
            {isSignUp ? 'Create Developer Account' : 'Sign In'}
          </h2>
          <p className="text-xs text-neutral-400">
            {isSignUp
              ? 'Register with email and password to save your typing progress.'
              : 'Enter your credentials to load your developer profile.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/25 flex items-center gap-2.5 text-xs text-[#10b981]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-neutral-400">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-neutral-400">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] hover:bg-[#0ea572] text-black font-bold text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-xs text-neutral-400 hover:text-[#10b981] transition-colors cursor-pointer"
          >
            {isSignUp
              ? 'Already have an account? Sign in instead'
              : "Don't have an account? Create one with Email"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
