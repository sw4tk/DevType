'use client';
import React, { useEffect } from 'react';
import {
  CaretShape,
  CaretSmoothness,
  ErrorMode,
} from '@/constants/languages';
import { StudioTheme } from '@/constants/themes';
import { UI_STYLES, UIStyleId } from '@/constants/uiStyles';
import { SwitchProfile } from '@/hooks/useMechanicalAudio';
import {
  ArrowLeft,
  Keyboard,
  Type,
  Sparkles,
  Sliders,
  Layers,
  ShieldAlert,
  Eye,
  Ghost,
  Volume2,
  Terminal,
  RotateCcw,
} from 'lucide-react';

export interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: StudioTheme;
  uiStyleId: UIStyleId;
  onSelectUiStyle: (id: UIStyleId) => void;
  showKeyboard: boolean;
  onChangeShowKeyboard: (val: boolean) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  caretSmoothness: CaretSmoothness;
  onChangeCaretSmoothness: (val: CaretSmoothness) => void;
  caretShape: CaretShape;
  onChangeCaretShape: (val: CaretShape) => void;
  errorMode: ErrorMode;
  onChangeErrorMode: (val: ErrorMode) => void;
  velocityStretch: boolean;
  onChangeVelocityStretch: (val: boolean) => void;
  caretGlow: boolean;
  onChangeCaretGlow: (val: boolean) => void;
  focusZenDim: boolean;
  onChangeFocusZenDim: (val: boolean) => void;
  pacemakerWpm: number;
  onChangePacemaker: (wpm: number) => void;
  soundProfile: SwitchProfile;
  onChangeSoundProfile: (profile: SwitchProfile) => void;
}

const SMOOTHNESS_PRESETS: {
  id: CaretSmoothness;
  label: string;
  desc: string;
  badge: string;
}[] = [
  { id: 'instant', label: 'Instant', desc: '0ms raw terminal snap', badge: '0ms' },
  { id: 'snappy', label: 'Snappy', desc: 'Crisp high-velocity glide', badge: '80ms' },
  { id: 'butter', label: 'Like Butter', desc: 'Silky sub-pixel flow', badge: '140ms' },
  { id: 'liquid', label: 'Liquid Silk', desc: 'Cinematic weighty glide', badge: '210ms' },
  { id: 'spring', label: 'Spring Physics', desc: 'Harmonic damped bounce', badge: 'Spring' },
];

const FONT_SIZE_PRESETS = [
  { size: 13, label: '13px • Compact', desc: 'High-density code view' },
  { size: 15, label: '15px • Default IDE', desc: 'Balanced studio standard' },
  { size: 18, label: '18px • Large', desc: 'Relaxed eye-comfort reading' },
  { size: 22, label: '22px • Presentation', desc: 'Oversized focus typography' },
];

export default function StudioSettingsModal({
  isOpen,
  onClose,
  theme,
  uiStyleId,
  onSelectUiStyle,
  showKeyboard,
  onChangeShowKeyboard,
  fontSize,
  onChangeFontSize,
  caretSmoothness,
  onChangeCaretSmoothness,
  caretShape,
  onChangeCaretShape,
  errorMode,
  onChangeErrorMode,
  velocityStretch,
  onChangeVelocityStretch,
  caretGlow,
  onChangeCaretGlow,
  focusZenDim,
  onChangeFocusZenDim,
  pacemakerWpm,
  onChangePacemaker,
  soundProfile,
  onChangeSoundProfile,
}: StudioSettingsModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      style={{ backgroundColor: theme.bg }}
      className="fixed inset-0 z-50 w-screen h-dvh max-h-dvh text-neutral-300 font-mono flex flex-col justify-between overflow-hidden select-none px-6 py-4"
    >
      {/* Ambient Spotlight */}
      <div
        className="pointer-events-none absolute -top-44 left-1/2 -translate-x-1/2 w-[960px] h-[380px] blur-3xl opacity-90"
        style={{
          background: `radial-gradient(circle at center, ${theme.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto shrink-0">
        <div
          style={{ backgroundColor: `${theme.surface}e0` }}
          className="flex items-center justify-between gap-3 backdrop-blur-2xl border border-white/[0.08] px-4 py-2.5 rounded-2xl shadow-xl"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span>Back to Typing Studio (Esc)</span>
            </button>
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
              <Terminal className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span>~/devtype/config/</span>
              <span className="text-white font-bold">studio.settings.json</span>
            </div>
          </div>

          <button
            onClick={() => {
              onChangeShowKeyboard(true);
              onChangeFontSize(15);
              onChangeCaretSmoothness('butter');
              onChangeCaretShape('block');
              onChangeErrorMode('forgiving');
              onSelectUiStyle('glassmorphism');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-neutral-300 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </header>

      {/* Main Full-Page Settings Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col justify-center py-2.5">
        <div
          style={{ backgroundColor: `${theme.surface}e6` }}
          className="relative flex-1 min-h-0 flex flex-col rounded-2xl backdrop-blur-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
        >
          <div
            className="w-full h-[2.5px] shrink-0"
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }}
          />

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SECTION 1: ON-SCREEN KEYBOARD & IDE FONT SIZE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* On-Screen 65% Mechanical Keyboard Toggle */}
              <div className="lg:col-span-5 bg-black/40 border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Keyboard className="w-4 h-4" style={{ color: theme.accent }} />
                      On-Screen 65% Mechanical Keyboard
                    </span>
                    <span
                      style={{
                        color: showKeyboard ? theme.accent : '#a1a1aa',
                        borderColor: showKeyboard ? `${theme.accent}55` : 'rgba(255,255,255,0.1)',
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-md border font-extrabold uppercase"
                    >
                      {showKeyboard ? 'VISIBLE' : 'HIDDEN (EXPANDED IDE)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    When turned OFF, the 2.5D keyboard deck hides and the IDE code container
                    automatically expands downward to fill the studio viewport.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <button
                    onClick={() => onChangeShowKeyboard(true)}
                    style={
                      showKeyboard
                        ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                        : undefined
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      showKeyboard
                        ? 'text-white'
                        : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Show 2.5D Keyboard
                  </button>
                  <button
                    onClick={() => onChangeShowKeyboard(false)}
                    style={
                      !showKeyboard
                        ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                        : undefined
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      !showKeyboard
                        ? 'text-white'
                        : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Hide & Expand IDE
                  </button>
                </div>
              </div>

              {/* IDE Code Viewport Font Size */}
              <div className="lg:col-span-7 bg-black/40 border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Type className="w-4 h-4" style={{ color: theme.accent }} />
                      IDE Editor Font Size & Line Scale
                    </span>
                    <span
                      style={{ color: theme.accent }}
                      className="text-xs font-extrabold"
                    >
                      {fontSize}px
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Scales the code viewport typography, line-number gutter, and sub-pixel caret
                    dimensions simultaneously.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  {FONT_SIZE_PRESETS.map((preset) => {
                    const active = fontSize === preset.size;
                    return (
                      <button
                        key={preset.size}
                        onClick={() => onChangeFontSize(preset.size)}
                        style={
                          active
                            ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                            : undefined
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          active
                            ? 'text-white'
                            : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 2: CARET GLIDE PHYSICS & GEOMETRY */}
            <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                  Caret Glide Smoothness & Geometry
                </span>
                <span className="text-[10px] uppercase text-neutral-400">
                  Active: {caretSmoothness} • {caretShape}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {SMOOTHNESS_PRESETS.map((preset) => {
                  const active = caretSmoothness === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onChangeCaretSmoothness(preset.id)}
                      style={
                        active
                          ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                          : undefined
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'text-white'
                          : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{preset.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
                          {preset.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500">{preset.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'block', label: 'Filled Block', preview: '█' },
                    { id: 'beam', label: 'Thin Beam', preview: '▏' },
                    { id: 'underline', label: 'Underline', preview: '▁' },
                    { id: 'outline', label: 'Hollow Box', preview: '▯' },
                  ] as { id: CaretShape; label: string; preview: string }[]
                ).map((s) => {
                  const active = caretShape === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onChangeCaretShape(s.id)}
                      style={
                        active
                          ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                          : undefined
                      }
                      className={`py-2 px-3 text-xs rounded-xl border font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        active
                          ? 'text-white'
                          : 'bg-black/40 border-white/[0.06] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span style={{ color: theme.accent }}>{s.preview}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: COMPILER ERROR POLICY & BEHAVIOR TOGGLES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6 bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Compiler Error Policy
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'forgiving', label: 'Forgiving', desc: 'Advance on error; fix anytime' },
                      { id: 'strict', label: 'Strict Stop', desc: 'Must type correct key to advance' },
                      { id: 'no-backspace', label: 'No Backspace', desc: 'Hardcore permanent input' },
                    ] as { id: ErrorMode; label: string; desc: string }[]
                  ).map((em) => {
                    const active = errorMode === em.id;
                    return (
                      <button
                        key={em.id}
                        onClick={() => onChangeErrorMode(em.id)}
                        style={
                          active
                            ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                            : undefined
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          active
                            ? 'text-white'
                            : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{em.label}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{em.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-6 bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4" style={{ color: theme.accent }} />
                  Visual & Audio Behavior
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => onChangeVelocityStretch(!velocityStretch)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                      velocityStretch
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-black/40 border-white/[0.07] text-neutral-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Velocity Stretch</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      {velocityStretch ? 'ENABLED' : 'OFF'}
                    </div>
                  </button>

                  <button
                    onClick={() => onChangeCaretGlow(!caretGlow)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                      caretGlow
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-black/40 border-white/[0.07] text-neutral-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Caret Bloom</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      {caretGlow ? 'ENABLED' : 'OFF'}
                    </div>
                  </button>

                  <button
                    onClick={() => onChangeFocusZenDim(!focusZenDim)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                      focusZenDim
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-black/40 border-white/[0.07] text-neutral-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Auto-Dim HUD</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      {focusZenDim ? 'ENABLED' : 'OFF'}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const order: SwitchProfile[] = ['thock', 'clack', 'click', 'off'];
                      onChangeSoundProfile(order[(order.indexOf(soundProfile) + 1) % order.length]);
                    }}
                    className="p-2.5 rounded-xl border bg-black/40 border-white/[0.07] text-left cursor-pointer hover:border-white/20"
                  >
                    <div className="text-[11px] font-bold text-white flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Switch Audio
                    </div>
                    <div className="text-[10px] uppercase mt-0.5" style={{ color: theme.accent }}>
                      {soundProfile}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 4: 12 UI VISUAL ARCHITECTURES */}
            <div className="bg-black/40 border border-white/[0.08] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: theme.accent }} />
                  12 Studio Surface Architectures (Glassmorphism / Claymorphism / Brutalism)
                </span>
                <span className="text-[10px] uppercase font-bold" style={{ color: theme.accent }}>
                  Active: {uiStyleId}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {UI_STYLES.map((style) => {
                  const active = uiStyleId === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => onSelectUiStyle(style.id)}
                      style={
                        active
                          ? { borderColor: theme.accent, backgroundColor: `${theme.accent}22` }
                          : undefined
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'text-white'
                          : 'bg-black/40 border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold truncate pr-1">{style.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 shrink-0">
                          {style.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight">
                        {style.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto shrink-0 flex items-center justify-between text-[11px] text-neutral-500 px-1">
        <span>All settings are saved automatically to your browser profile</span>
        <span>
          Press{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-neutral-300">
            Esc
          </kbd>{' '}
          to return to typing
        </span>
      </footer>
    </div>
  );
}
