'use client';
import React, { memo } from 'react';
import {
  LanguageSpec,
  SnippetLength,
  GameMode,
  CaretSmoothness,
  DeveloperUser,
} from '@/constants/languages';
import { StudioTheme } from '@/constants/themes';
import { UIStyleSpec } from '@/constants/uiStyles';
import { SwitchProfile } from '@/hooks/useMechanicalAudio';
import { ModalTab } from '@/components/typing/CommandPaletteModal';
import {
  Terminal,
  ChevronDown,
  Shuffle,
  Headphones,
  Palette,
  Volume2,
  VolumeX,
  Settings2,
  User,
  Layers,
} from 'lucide-react';

interface StudioHeaderDockProps {
  theme: StudioTheme;
  uiStyle: UIStyleSpec;
  dimChrome: boolean;
  currentLangSpec: LanguageSpec;
  lengthMode: SnippetLength;
  gameMode: GameMode;
  soundProfile: SwitchProfile;
  caretSmoothness: CaretSmoothness;
  ambientPlaying: boolean;
  user: DeveloperUser | null;
  onOpenPaletteTab: (tab: ModalTab) => void;
  onSelectLength: (len: SnippetLength) => void;
  onSelectGameMode: (mode: GameMode) => void;
  onRollRandom: () => void;
  onToggleAmbient: () => void;
  onCycleTheme: () => void;
  onCycleUiStyle: () => void;
  onCycleSound: () => void;
  onOpenProfile: () => void;
}

const StudioHeaderDock = memo(function StudioHeaderDock({
  theme,
  uiStyle,
  dimChrome,
  currentLangSpec,
  lengthMode,
  gameMode,
  soundProfile,
  caretSmoothness,
  ambientPlaying,
  user,
  onOpenPaletteTab,
  onSelectLength,
  onSelectGameMode,
  onRollRandom,
  onToggleAmbient,
  onCycleTheme,
  onCycleUiStyle,
  onCycleSound,
  onOpenProfile,
}: StudioHeaderDockProps) {
  return (
    <header
      className={`relative z-10 w-full max-w-6xl mx-auto shrink-0 transition-opacity duration-300 ${
        dimChrome ? 'opacity-20 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div
        style={{ backgroundColor: `${theme.surface}e0` }}
        className={`flex items-center justify-between gap-3 px-4 py-2 transition-all duration-300 ${uiStyle.cardClass}`}
      >
        {/* ZONE 1 (LEFT): Brand + Language Pill + Length Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 ${uiStyle.pillClass}`}
              style={{ color: theme.accent }}
            >
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold tracking-tight text-white text-sm">
              Dev<span style={{ color: theme.accent }}>Type</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <button
            onClick={() => onOpenPaletteTab('languages')}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs ${uiStyle.buttonClass}`}
            title="Switch among 56 Programming Languages (Cmd + K)"
          >
            <span className="font-bold text-white">{currentLangSpec.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] font-semibold"
              style={{ color: theme.accent }}
            >
              .{currentLangSpec.ext}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          <div className={`hidden xl:flex items-center p-0.5 ${uiStyle.pillClass}`}>
            {(['short', 'medium', 'long'] as SnippetLength[]).map((len) => (
              <button
                key={len}
                onClick={() => onSelectLength(len)}
                style={lengthMode === len ? { color: theme.accent } : undefined}
                className={`px-2 py-1 text-[10px] uppercase font-semibold rounded-lg cursor-pointer transition-all ${
                  lengthMode === len
                    ? 'bg-white/[0.08] shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {len === 'medium' ? 'med' : len}
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 2 (CENTER): Segmented Game Mode Bar */}
        <div className={`hidden md:flex items-center gap-0.5 p-1 ${uiStyle.pillClass}`}>
          {(
            [
              { id: 'standard', label: 'Sprint' },
              { id: '15', label: '15s' },
              { id: '30', label: '30s' },
              { id: '60', label: '60s' },
              { id: 'suddendeath', label: '1HP' },
              { id: 'zen', label: 'Zen' },
              { id: 'smartcoach', label: 'Coach' },
              { id: 'daily', label: 'Daily' },
              { id: 'vim', label: 'Vim' },
            ] as { id: GameMode; label: string }[]
          ).map((m) => {
            const active = gameMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectGameMode(m.id)}
                style={
                  active ? { color: theme.accent, borderColor: `${theme.accent}44` } : undefined
                }
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  active
                    ? 'bg-white/[0.08] border shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* ZONE 3 (RIGHT): Quick Utility Icons + UI Style Switcher + User Cloud Identity Pill */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onRollRandom}
            className={`p-2 text-neutral-300 hover:text-white cursor-pointer ${uiStyle.buttonClass}`}
            title="Roll Guaranteed-Unseen Code Snippet (Alt + N)"
          >
            <Shuffle className="w-3.5 h-3.5" style={{ color: theme.accent }} />
          </button>

          {/* Direct 1-Click UI Style Cycle Button (Glassmorphism -> Claymorphism -> Neumorphism -> etc.) */}
          <button
            onClick={onCycleUiStyle}
            className={`px-2.5 py-1.5 flex items-center gap-1.5 text-neutral-200 hover:text-white cursor-pointer ${uiStyle.buttonClass}`}
            title={`UI Architecture: ${uiStyle.name} (Click to cycle Glass / Clay / Brutalist / Holo)`}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span className="hidden lg:inline text-[10px] font-bold uppercase tracking-wider">
              {uiStyle.badge}
            </span>
          </button>

          <button
            onClick={onToggleAmbient}
            style={
              ambientPlaying
                ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                : undefined
            }
            className={`p-2 text-neutral-300 hover:text-white cursor-pointer ${uiStyle.buttonClass}`}
            title="Toggle Ambient Flow-State Brown Noise Synth"
          >
            <Headphones
              className="w-3.5 h-3.5"
              style={{ color: ambientPlaying ? theme.accent : '#a1a1aa' }}
            />
          </button>

          <button
            onClick={onCycleTheme}
            className={`p-2 text-neutral-300 hover:text-white cursor-pointer ${uiStyle.buttonClass}`}
            title={`Theme: ${theme.name} (Click to cycle)`}
          >
            <Palette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
          </button>

          <button
            onClick={onCycleSound}
            className={`p-2 text-neutral-300 hover:text-white cursor-pointer ${uiStyle.buttonClass}`}
            title={`Switch Sound: ${soundProfile.toUpperCase()}`}
          >
            {soundProfile === 'off' ? (
              <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            )}
          </button>

          <button
            onClick={() => onOpenPaletteTab('settings')}
            className={`p-2 text-neutral-300 hover:text-white cursor-pointer ${uiStyle.buttonClass}`}
            title={`UI Style & Caret Settings: ${caretSmoothness.toUpperCase()} (Ctrl + ,)`}
          >
            <Settings2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          <button
            onClick={onOpenProfile}
            style={{ borderColor: user ? `${theme.accent}55` : undefined }}
            className={`flex items-center gap-2 pl-2 pr-3 py-1 cursor-pointer ${uiStyle.buttonClass}`}
            title="Open Full-Screen Developer Telemetry Workspace"
          >
            {user ? (
              <>
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://github.com/identicons/devtype.png';
                  }}
                  className="w-5 h-5 rounded-full object-cover border border-white/20"
                />
                <span className="text-[11px] font-bold text-white max-w-[90px] truncate">
                  {user.username}
                </span>
              </>
            ) : (
              <>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10"
                  style={{ color: theme.accent }}
                >
                  <User className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold text-white">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

export default StudioHeaderDock;