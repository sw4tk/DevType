'use client';
import React, { memo } from 'react';
import AuthButtons from '@/components/auth/AuthButtons';
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
  Keyboard,
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
  showKeyboard: boolean;
  user: DeveloperUser | null;
  onOpenPaletteTab: (tab: ModalTab) => void;
  onOpenSettingsPage: () => void;
  onToggleKeyboard: () => void;
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
  ambientPlaying,
  showKeyboard,
  user,
  onOpenPaletteTab,
  onOpenSettingsPage,
  onToggleKeyboard,
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
      className={`relative z-10 w-full max-w-7xl mx-auto shrink-0 transition-opacity duration-300 ${
        dimChrome ? 'opacity-20 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div
        style={{ backgroundColor: `${theme.surface}e6` }}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 overflow-hidden transition-all duration-300 ${uiStyle.cardClass}`}
      >
        {/* ZONE 1 (LEFT): Brand + Language Selector + Compact Length Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 ${uiStyle.pillClass}`} style={{ color: theme.accent }}>
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-poppins font-extrabold tracking-tight text-white text-[15px]">
              Dev<span style={{ color: theme.accent }}>Type</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <button
            onClick={() => onOpenPaletteTab('languages')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer text-xs shrink-0 ${uiStyle.buttonClass}`}
            title="Switch among 56 Programming Languages (Cmd + K)"
          >
            <span className="font-bold text-white">{currentLangSpec.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] font-semibold"
              style={{ color: theme.accent }}
            >
              .{currentLangSpec.ext}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          <div className={`hidden xl:flex items-center p-0.5 shrink-0 ${uiStyle.pillClass}`}>
            {(['beginner', 'short', 'medium', 'long'] as SnippetLength[]).map((len) => (
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
                {len === 'beginner' ? 'B' : len === 'short' ? 'S' : len === 'medium' ? 'M' : 'L'}
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 2 (CENTER): Segmented Game Mode Bar */}
        <div
          className={`hidden lg:flex items-center gap-0.5 p-1 min-w-0 overflow-x-auto ${uiStyle.pillClass}`}
        >
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
                className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
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

        {/* ZONE 3 (RIGHT): Unified Control Strip + Auth Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Grouped Icon Cluster */}
          <div className={`flex items-center gap-0.5 p-1 ${uiStyle.pillClass}`}>
            <button
              onClick={onRollRandom}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Roll Guaranteed-Unseen Code Snippet (Alt + N)"
            >
              <Shuffle className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            </button>

            <button
              onClick={onToggleKeyboard}
              style={
                !showKeyboard
                  ? { backgroundColor: `${theme.accent}22`, color: theme.accent }
                  : undefined
              }
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={
                showKeyboard
                  ? 'Hide On-Screen Keyboard & Expand IDE'
                  : 'Show On-Screen 65% Mechanical Keyboard'
              }
            >
              <Keyboard
                className="w-3.5 h-3.5"
                style={{ color: showKeyboard ? theme.accent : '#a1a1aa' }}
              />
            </button>

            <button
              onClick={onCycleUiStyle}
              className="px-2 py-1 rounded-lg hover:bg-white/[0.08] flex items-center gap-1 text-neutral-200 hover:text-white transition-colors cursor-pointer"
              title={`UI Architecture: ${uiStyle.name} (Click to cycle)`}
            >
              <Layers className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="hidden xl:inline text-[10px] font-bold uppercase">
                {uiStyle.badge}
              </span>
            </button>

            <button
              onClick={onToggleAmbient}
              style={
                ambientPlaying
                  ? { backgroundColor: `${theme.accent}22`, color: theme.accent }
                  : undefined
              }
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Ambient Flow-State Brown Noise Synth"
            >
              <Headphones
                className="w-3.5 h-3.5"
                style={{ color: ambientPlaying ? theme.accent : '#a1a1aa' }}
              />
            </button>

            <button
              onClick={onCycleTheme}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={`Theme: ${theme.name} (Click to cycle)`}
            >
              <Palette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            </button>

            <button
              onClick={onCycleSound}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={`Switch Sound: ${soundProfile.toUpperCase()}`}
            >
              {soundProfile === 'off' ? (
                <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              )}
            </button>

            <button
              onClick={onOpenSettingsPage}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Open Full-Page Studio Settings (Ctrl + ,)"
            >
              <Settings2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            </button>
          </div>

          <AuthButtons />
        </div>
      </div>
    </header>
  );
});

export default StudioHeaderDock;