'use client';
import React, { useState, useEffect, memo } from 'react';
import { VIM_DRILLS } from '@/constants/vimDrills';
import { StudioTheme } from '@/constants/themes';
import { Crosshair } from 'lucide-react';

interface VimDojoArenaProps {
  theme: StudioTheme;
  disabled: boolean;
  onPlayKeystroke: (isError: boolean) => void;
}

const VimDojoArena = memo(function VimDojoArena({
  theme,
  disabled,
  onPlayKeystroke,
}: VimDojoArenaProps) {
  const [vimIndex, setVimIndex] = useState<number>(0);
  const [vimBuffer, setVimBuffer] = useState<string>('');
  const [vimScore, setVimScore] = useState<number>(0);
  const [vimStreak, setVimStreak] = useState<number>(0);

  const activeDrill = VIM_DRILLS[vimIndex % VIM_DRILLS.length];

  useEffect(() => {
    if (disabled) return;

    const onVimKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setVimBuffer('');
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setVimBuffer((prev) => prev.slice(0, -1));
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();
      const nextBuf = vimBuffer + e.key;

      if (nextBuf === activeDrill.command) {
        onPlayKeystroke(false);
        setVimScore((s) => s + 1);
        setVimStreak((s) => s + 1);
        setVimBuffer('');
        setVimIndex((idx) => idx + 1);
      } else if (activeDrill.command.startsWith(nextBuf)) {
        onPlayKeystroke(false);
        setVimBuffer(nextBuf);
      } else {
        onPlayKeystroke(true);
        setVimStreak(0);
        setVimBuffer('');
      }
    };

    window.addEventListener('keydown', onVimKey);
    return () => window.removeEventListener('keydown', onVimKey);
  }, [disabled, activeDrill, vimBuffer, onPlayKeystroke]);

  return (
    <div
      style={{ backgroundColor: `${theme.surface}e6` }}
      className="relative flex flex-col rounded-2xl backdrop-blur-2xl border border-white/[0.08] p-6 shadow-2xl space-y-5"
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-lg text-xs font-extrabold border"
            style={{ color: theme.accent, borderColor: `${theme.accent}55` }}
          >
            NEOVIM MOTION DOJO
          </span>
          <div>
            <h2 className="text-base font-bold text-white">{activeDrill.task}</h2>
            <p className="text-xs text-neutral-400">{activeDrill.explanation}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Solved</div>
            <div className="text-2xl font-bold text-white">{vimScore}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Streak</div>
            <div className="text-2xl font-bold" style={{ color: theme.accent }}>
              {vimStreak}x
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/50 border border-white/[0.07] rounded-xl p-5 font-mono text-base sm:text-lg text-neutral-200">
        {activeDrill.code.split(activeDrill.highlightToken).map((part, idx, arr) => (
          <React.Fragment key={idx}>
            <span>{part}</span>
            {idx < arr.length - 1 && (
              <span className="bg-amber-500/25 border-b-2 border-amber-400 text-amber-200 px-1 rounded">
                {activeDrill.highlightToken}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between bg-black/40 border border-white/[0.06] px-5 py-3 rounded-xl">
        <div className="flex items-center gap-3 text-xs">
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span className="text-neutral-400">Type the exact Vim motion sequence:</span>
          <kbd className="px-2.5 py-1 rounded bg-white/10 text-emerald-300 font-bold text-sm">
            {activeDrill.command}
          </kbd>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Command Buffer:</span>
          <span className="min-w-[80px] text-center px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm">
            {vimBuffer || 'NORMAL'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default VimDojoArena;