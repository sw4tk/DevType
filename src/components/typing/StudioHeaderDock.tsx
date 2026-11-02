'use client';
import React, { memo, useState, useRef, useEffect } from 'react';
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

const PRIMARY_MODES: { id: GameMode; label: string }[] = [
  { id: 'standard', label: 'Sprint' },
  { id: '15', label: '15s' },
  { id: '30', label: '30s' },
  { id: '60', label: '60s' },
];

const MORE_MODES: { id: GameMode; label: string }[] = [
  { id: 'zen', label: 'Zen' },
  { id: 'vim', label: 'Vim' },
  { id: 'daily', label: 'Daily' },
  { id: 'smartcoach', label: 'Weak spots' },
  { id: 'suddendeath', label: '1HP' },
];

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
}: StudioHeaderDockProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [moreOpen]);

  const activeMoreMode = MORE_MODES.find((m) => m.id === gameMode);

  return (
    <header
      className={`relative z-30 w-full max-w-7xl mx-auto shrink-0 transition-opacity duration-300 ${
        dimChrome ? 'opacity-20 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div
        style={{ backgroundColor: `${theme.surface}e6` }}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 overflow-visible transition-all duration-300 ${uiStyle.cardClass}`}
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
            aria-label={`Select programming language, current is ${currentLangSpec.name}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer text-xs shrink-0 ${uiStyle.buttonClass}`}
          >
            <span className="font-bold text-white">{currentLangSpec.name}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] font-semibold"
              style={{ color: theme.accent }}
            >
              .{currentLangSpec.ext}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          <div className={`hidden xl:flex items-center p-0.5 shrink-0 ${uiStyle.pillClass}`}>
            {(['beginner', 'short', 'medium', 'long'] as SnippetLength[]).map((len) => (
              <button
                key={len}
                onClick={() => onSelectLength(len)}
                aria-label={`Snippet length: ${len}`}
                style={lengthMode === len ? { color: theme.accent } : undefined}
                className={`px-2 py-1 text-[10px] uppercase font-semibold rounded-lg cursor-pointer transition-all ${
                  lengthMode === len
                    ? 'bg-white/[0.08] shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {len === 'beginner' ? 'B' : len === 'short' ? 'S' : len === 'medium' ? 'M' : 'L'}
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 2 (CENTER): Primary Modes (Sprint, 15s, 30s, 60s) + "More" Dropdown */}
        <div className={`hidden lg:flex items-center gap-0.5 p-1 ${uiStyle.pillClass}`}>
          {PRIMARY_MODES.map((m) => {
            const active = gameMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setMoreOpen(false);
                  onSelectGameMode(m.id);
                }}
                style={
                  active ? { color: theme.accent, borderColor: `${theme.accent}44` } : undefined
                }
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'bg-white/[0.08] border shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                }`}
              >
                {m.label}
              </button>
            );
          })}

          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label="More game modes"
              style={
                activeMoreMode
                  ? { color: theme.accent, borderColor: `${theme.accent}44` }
                  : undefined
              }
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                activeMoreMode
                  ? 'bg-white/[0.08] border shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <span>{activeMoreMode ? `More: ${activeMoreMode.label}` : 'More'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {moreOpen && (
              <div
                role="menu"
                style={{ backgroundColor: theme.surface }}
                className="absolute right-0 top-full mt-1.5 w-40 py-1 rounded-xl border border-white/15 shadow-2xl z-50"
              >
                {MORE_MODES.map((m) => {
                  const active = gameMode === m.id;
                  return (
                    <button
                      key={m.id}
                      role="menuitem"
                      onClick={() => {
                        onSelectGameMode(m.id);
                        setMoreOpen(false);
                      }}
                      style={active ? { color: theme.accent } : undefined}
                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-white/[0.08] cursor-pointer ${
                        active ? 'bg-white/[0.05]' : 'text-neutral-300'
                      }`}
                    >
                      <span>{m.label}</span>
                      {active && <span className="text-[10px]">●</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ZONE 3 (RIGHT): Accessible Icon Cluster with Visible Hover Labels + Auth Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center gap-0.5 p-1 ${uiStyle.pillClass}`}>
            <button
              onClick={onRollRandom}
              aria-label="Shuffle Snippet"
              className="group relative p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Shuffle (Alt+N)
              </span>
            </button>

            <button
              onClick={onToggleKeyboard}
              aria-label={showKeyboard ? 'Hide Keyboard Deck' : 'Show Keyboard Deck'}
              style={
                !showKeyboard
                  ? { backgroundColor: `${theme.accent}22`, color: theme.accent }
                  : undefined
              }
              className="group relative p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Keyboard
                className="w-3.5 h-3.5"
                style={{ color: showKeyboard ? theme.accent : '#a1a1aa' }}
              />
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {showKeyboard ? 'Hide Deck' : 'Show Deck'}
              </span>
            </button>

            <button
              onClick={onCycleUiStyle}
              aria-label={`Cycle UI Style, current is ${uiStyle.name}`}
              className="group relative px-2 py-1 rounded-lg hover:bg-white/[0.08] flex items-center gap-1 text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="hidden xl:inline text-[10px] font-bold uppercase">
                {uiStyle.badge}
              </span>
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                UI: {uiStyle.name}
              </span>
            </button>

            <button
              onClick={onToggleAmbient}
              aria-label={ambientPlaying ? 'Disable Ambient Noise' : 'Enable Ambient Noise'}
              style={
                ambientPlaying
                  ? { backgroundColor: `${theme.accent}22`, color: theme.accent }
                  : undefined
              }
              className="group relative p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Headphones
                className="w-3.5 h-3.5"
                style={{ color: ambientPlaying ? theme.accent : '#a1a1aa' }}
              />
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Ambient Noise
              </span>
            </button>

            <button
              onClick={onCycleTheme}
              aria-label={`Cycle Theme, current is ${theme.name}`}
              className="group relative p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Theme: {theme.name}
              </span>
            </button>

            <button
              onClick={onCycleSound}
              aria-label={`Switch Sound: ${soundProfile}`}
              className="group relative p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              {soundProfile === 'off' ? (
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              )}
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Sound: {soundProfile.toUpperCase()}
              </span>
            </button>

            <button
              onClick={onOpenSettingsPage}
              aria-label="Open Studio Settings"
              className="group relative p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/95 border border-white/15 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Settings (Ctrl+,)
              </span>
            </button>
          </div>

          <AuthButtons />
        </div>
      </div>
    </header>
  );
});

export default StudioHeaderDock;
