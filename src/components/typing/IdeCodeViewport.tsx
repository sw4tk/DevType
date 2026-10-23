'use client';
import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
} from 'react';
import {
  SnippetItem,
  GameMode,
  CaretSmoothness,
  CaretShape,
} from '@/constants/languages';
import { StudioTheme } from '@/constants/themes';
import { UIStyleSpec, UI_STYLES } from '@/constants/uiStyles';
import { SessionStats, EngineStatus } from '@/hooks/useCodeTypingEngine';
import { tokenizeSyntaxColors } from '@/utils/codeSynthesizer';
import CharNode, { CharNodeProps } from '@/components/typing/CharNode';
import {
  Code2,
  BrainCircuit,
  Swords,
  Skull,
  Infinity as InfinityIcon,
  Timer,
  Flame,
  Trophy,
  RotateCcw,
  GitBranch,
  CheckCircle2,
} from 'lucide-react';

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

interface IdeCodeViewportProps {
  code: string;
  activeSnippet: SnippetItem;
  currentIndex: number;
  ghostIndex: number;
  status: EngineStatus;
  timeLeft: number;
  timeLimitSec: number;
  errors: Set<number>;
  errorVersion: number;
  stats: SessionStats;
  streak: number;
  personalBest: number;
  capsLockOn: boolean;
  afkPausedWarning: boolean;
  gameMode: GameMode;
  ghostChallengerWpm: number | null;
  pacemakerWpm: number;
  hasGhostTimeline: boolean;
  theme: StudioTheme;
  uiStyle?: UIStyleSpec;
  showKeyboard?: boolean;
  fontSize?: number;
  caretShape: CaretShape;
  caretSmoothness: CaretSmoothness;
  velocityStretch: boolean;
  caretGlow: boolean;
  sparkTriggerRef: React.MutableRefObject<(() => void) | null>;
  onFinishZen: () => void;
  onOpenProfile: () => void;
  onResetEngine: () => void;
}

const IdeCodeViewport = memo(function IdeCodeViewport({
  code,
  activeSnippet,
  currentIndex,
  ghostIndex,
  status,
  timeLeft,
  timeLimitSec,
  errors,
  errorVersion,
  stats,
  streak,
  personalBest,
  capsLockOn,
  afkPausedWarning,
  gameMode,
  ghostChallengerWpm,
  pacemakerWpm,
  hasGhostTimeline,
  theme,
  uiStyle = UI_STYLES[0],
  showKeyboard = true,
  fontSize = 15,
  caretShape,
  caretSmoothness,
  velocityStretch,
  caretGlow,
  sparkTriggerRef,
  onFinishZen,
  onOpenProfile,
  onResetEngine,
}: IdeCodeViewportProps) {
  const [scrollOffsetY, setScrollOffsetY] = useState<number>(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const caretRef = useRef<HTMLDivElement | null>(null);
  const ghostCaretRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sparkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<SparkParticle[]>([]);

  // When keyboard is hidden, gently boost effective font scale by +2px so code fills the expanded IDE naturally
  const effectiveFontSize = showKeyboard ? fontSize : fontSize + 2;
  const lineHeightPx = Math.round(effectiveFontSize * 1.75);

  const caretPhysicsRef = useRef({
    currX: 0,
    currY: 0,
    currW: 9.5,
    currH: lineHeightPx,
    targetX: 0,
    targetY: 0,
    targetW: 9.5,
    targetH: lineHeightPx,
    velX: 0,
    velY: 0,
    initialized: false,
  });

  useEffect(() => {
    sparkTriggerRef.current = () => {
      if (streak < 10) return;
      const p = caretPhysicsRef.current;
      for (let i = 0; i < 4; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const speed = 45 + Math.random() * 95;
        sparksRef.current.push({
          x: p.currX + p.currW / 2,
          y: p.currY + p.currH / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          size: 1.5 + Math.random() * 2,
        });
      }
    };
  }, [sparkTriggerRef, streak]);

  const setCharRef = useCallback((index: number, el: HTMLSpanElement | null) => {
    charRefs.current[index] = el;
  }, []);

  const syntaxColors = useMemo(() => tokenizeSyntaxColors(code), [code]);
  const lineCount = useMemo(() => code.split('\n').length, [code]);

  // Compute live cursor Line & Column for the bottom IDE status bar
  const cursorPosition = useMemo(() => {
    const sliced = code.slice(0, currentIndex);
    const lines = sliced.split('\n');
    return {
      ln: lines.length,
      col: (lines[lines.length - 1]?.length || 0) + 1,
    };
  }, [code, currentIndex]);

  const progressPercent =
    timeLimitSec > 0
      ? Math.min(100, Math.round(((timeLimitSec - timeLeft) / timeLimitSec) * 100))
      : Math.min(100, Math.round((currentIndex / Math.max(1, code.length)) * 100));

  useLayoutEffect(() => {
    const targetSpan = charRefs.current[currentIndex];
    const lineHighlight = activeLineRef.current;
    const viewport = viewportRef.current;

    if (status !== 'finished' && targetSpan) {
      const x = targetSpan.offsetLeft;
      const y = targetSpan.offsetTop;
      const charW = code[currentIndex] === '\n' ? 10 : Math.max(targetSpan.offsetWidth, 8.5);
      const charH = targetSpan.offsetHeight || lineHeightPx;

      const p = caretPhysicsRef.current;
      p.targetX = x;
      p.targetY = y;
      p.targetW = caretShape === 'beam' ? 2.5 : charW;
      p.targetH = caretShape === 'underline' ? 3 : charH;

      if (!p.initialized || currentIndex === 0) {
        p.currX = x;
        p.currY = y;
        p.currW = p.targetW;
        p.currH = p.targetH;
        p.velX = 0;
        p.velY = 0;
        p.initialized = true;
      }

      if (lineHighlight) {
        lineHighlight.style.transform = `translate3d(0px, ${y}px, 0)`;
        lineHighlight.style.height = `${charH}px`;
      }

      if (viewport) {
        const viewH = viewport.clientHeight;
        const targetScroll = Math.max(0, y - viewH * 0.38);
        setScrollOffsetY(targetScroll);
      }
    }
  }, [currentIndex, status, code, caretShape, effectiveFontSize, lineHeightPx, showKeyboard]);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const stepPhysics = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const p = caretPhysicsRef.current;
      const el = caretRef.current;

      if (el && p.initialized) {
        if (caretSmoothness === 'instant') {
          p.currX = p.targetX;
          p.currY = p.targetY;
          p.currW = p.targetW;
          p.currH = p.targetH;
        } else if (caretSmoothness === 'spring') {
          const stiffness = 420;
          const damping = 26;
          const ax = (p.targetX - p.currX) * stiffness - p.velX * damping;
          const ay = (p.targetY - p.currY) * stiffness - p.velY * damping;
          p.velX += ax * dt;
          p.velY += ay * dt;
          p.currX += p.velX * dt;
          p.currY += p.velY * dt;
          p.currW = p.targetW;
          p.currH = p.targetH;
        } else {
          const lambda =
            caretSmoothness === 'snappy' ? 32 : caretSmoothness === 'butter' ? 18 : 10.5;
          const factor = 1 - Math.exp(-lambda * dt);
          const yFactor = Math.abs(p.targetY - p.currY) > 10 ? Math.min(1, factor * 1.45) : factor;

          p.currX += (p.targetX - p.currX) * factor;
          p.currY += (p.targetY - p.currY) * yFactor;
          p.currW += (p.targetW - p.currW) * factor;
          p.currH += (p.targetH - p.currH) * factor;
        }

        const dx = Math.abs(p.targetX - p.currX);
        const sameLine = Math.abs(p.targetY - p.currY) < 8;
        const stretchExtra =
          velocityStretch && sameLine && caretSmoothness !== 'instant'
            ? Math.min(dx * 0.38, 14)
            : 0;

        const topOffset = caretShape === 'underline' ? lineHeightPx - 3 : 0;
        el.style.transform = `translate3d(${p.currX.toFixed(2)}px, ${(p.currY + topOffset).toFixed(2)}px, 0)`;
        el.style.width = `${(p.currW + stretchExtra).toFixed(2)}px`;
        el.style.height = `${p.currH.toFixed(2)}px`;
      }

      const canvas = sparkCanvasRef.current;
      if (canvas && sparksRef.current.length > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = sparksRef.current.length - 1; i >= 0; i--) {
            const sp = sparksRef.current[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 260 * dt;
            sp.alpha -= dt * 2.4;
            if (sp.alpha <= 0) {
              sparksRef.current.splice(i, 1);
              continue;
            }
            ctx.fillStyle = theme.accent;
            ctx.globalAlpha = Math.max(0, sp.alpha);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      rafId = requestAnimationFrame(stepPhysics);
    };

    rafId = requestAnimationFrame(stepPhysics);
    return () => cancelAnimationFrame(rafId);
  }, [caretSmoothness, caretShape, velocityStretch, theme.accent, lineHeightPx]);

  useLayoutEffect(() => {
    const ghostSpan = charRefs.current[ghostIndex];
    const ghostEl = ghostCaretRef.current;
    const hasGhostActive = status === 'typing' && (pacemakerWpm > 0 || hasGhostTimeline);
    if (hasGhostActive && ghostSpan && ghostEl) {
      const x = ghostSpan.offsetLeft;
      const y = ghostSpan.offsetTop;
      const w = Math.max(ghostSpan.offsetWidth, 9.5);
      const h = ghostSpan.offsetHeight || lineHeightPx;
      ghostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ghostEl.style.width = `${w}px`;
      ghostEl.style.height = `${h}px`;
    }
  }, [ghostIndex, status, pacemakerWpm, hasGhostTimeline, lineHeightPx]);

  return (
    <div
      style={{ backgroundColor: `${theme.surface}e6` }}
      className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        !showKeyboard ? 'flex-1 max-h-[520px]' : ''
      } ${uiStyle.cardClass}`}
    >
      {/* Top Laser Progress Bar */}
      <div className="w-full h-[2.5px] bg-white/[0.04] shrink-0">
        <div
          className="h-full transition-all duration-150 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor:
              timeLimitSec > 0 && timeLeft <= 5 && status === 'typing'
                ? '#ef4444'
                : theme.accent,
            boxShadow: `0 0 12px ${theme.accent}`,
          }}
        />
      </div>

      {/* IDE Window Titlebar + Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-2.5 border-b border-white/[0.06] bg-black/35 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90" />
          </div>
          <div className="h-3.5 w-[1px] bg-white/10" />
          <div className={`flex items-center gap-2 px-2.5 py-0.5 ${uiStyle.pillClass}`}>
            <Code2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span className="text-neutral-200 font-medium text-[11px]">
              {activeSnippet.filename}
            </span>
            <span className="text-[10px] text-neutral-500">{activeSnippet.badge}</span>
          </div>

          {capsLockOn && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-extrabold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              ⇪ CAPS LOCK ON
            </span>
          )}

          {afkPausedWarning && status === 'typing' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
              ⏸ AFK COMPENSATED
            </span>
          )}

          {gameMode === 'smartcoach' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
              <BrainCircuit className="w-3 h-3" /> SMART WEAKNESS COACH
            </span>
          )}

          {ghostChallengerWpm && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
              <Swords className="w-3 h-3" /> RACING GHOST ({ghostChallengerWpm} WPM)
            </span>
          )}

          {gameMode === 'suddendeath' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold">
              <Skull className="w-3 h-3" /> SUDDEN DEATH
            </span>
          )}

          {gameMode === 'zen' && (
            <button
              onClick={onFinishZen}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold cursor-pointer"
            >
              <InfinityIcon className="w-3 h-3" /> FINISH ZEN (Ctrl+Enter)
            </button>
          )}
        </div>

        <div className="flex items-center gap-5">
          {timeLimitSec > 0 && (
            <div className={`flex items-baseline gap-1.5 px-2.5 py-0.5 ${uiStyle.pillClass}`}>
              <Timer
                className="w-3.5 h-3.5 self-center"
                style={{ color: timeLeft <= 5 ? '#ef4444' : theme.accent }}
              />
              <span className="text-lg font-extrabold leading-none text-white">{timeLeft}s</span>
            </div>
          )}

          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">WPM</span>
            <span className="text-lg font-bold leading-none" style={{ color: theme.accent }}>
              {stats.wpm}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">ACC</span>
            <span className="text-lg font-bold leading-none text-white">{stats.accuracy}%</span>
          </div>

          <div className="flex items-center gap-1">
            <Flame
              className="w-3.5 h-3.5"
              style={{ color: streak > 0 ? theme.accent : '#52525b' }}
            />
            <span className="text-sm font-bold leading-none text-neutral-200">{streak}x</span>
          </div>

          <div className="h-3.5 w-[1px] bg-white/10 hidden sm:block" />

          <button
            onClick={onOpenProfile}
            className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white cursor-pointer"
          >
            <Trophy className="w-3 h-3" style={{ color: theme.accent }} />
            PB {personalBest}
          </button>

          <button
            onClick={onResetEngine}
            className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
            title="Restart Snippet (Esc)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Viewport */}
      <div
        ref={viewportRef}
        className={`relative overflow-hidden px-6 py-5 transition-all duration-300 ${
          showKeyboard ? 'h-[225px] sm:h-[250px]' : 'flex-1 min-h-[320px]'
        }`}
      >
        <div
          className="relative flex transition-transform duration-150 ease-out"
          style={{ transform: `translate3d(0px, -${scrollOffsetY}px, 0px)` }}
        >
          <div
            ref={activeLineRef}
            className="pointer-events-none absolute -left-6 -right-6 top-0 bg-white/[0.03] border-l-2 transition-transform duration-75 ease-out"
            style={{ height: `${lineHeightPx}px`, borderColor: theme.accent }}
          />

          <div
            style={{ fontSize: `${effectiveFontSize}px`, lineHeight: `${lineHeightPx}px` }}
            className="select-none pr-6 text-right text-neutral-600 font-mono"
          >
            {Array.from({ length: lineCount }).map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>

          <div
            data-error-version={errorVersion}
            style={{ fontSize: `${effectiveFontSize}px`, lineHeight: `${lineHeightPx}px` }}
            className="relative flex-1 tracking-wide whitespace-pre font-mono"
          >
            <canvas
              ref={sparkCanvasRef}
              width={950}
              height={550}
              className="pointer-events-none absolute top-0 left-0 z-20"
            />

            {status === 'typing' && (pacemakerWpm > 0 || hasGhostTimeline) && (
              <div
                ref={ghostCaretRef}
                className="pointer-events-none absolute top-0 left-0 bg-amber-400/20 border-b-2 border-amber-400 rounded-[2px] transition-transform duration-75 ease-linear"
                style={{ width: '9.5px', height: `${lineHeightPx}px` }}
              />
            )}

            <div
              ref={caretRef}
              style={{
                backgroundColor:
                  caretShape === 'outline'
                    ? 'transparent'
                    : caretShape === 'beam' || caretShape === 'underline'
                    ? theme.accent
                    : `${theme.accent}3d`,
                borderColor: theme.accent,
                boxShadow: caretGlow ? `0 0 16px ${theme.accent}` : 'none',
              }}
              className={`pointer-events-none absolute top-0 left-0 rounded-[2.5px] will-change-transform ${
                caretShape === 'outline'
                  ? 'border-[1.5px]'
                  : caretShape === 'block'
                  ? 'border-l-[2.5px]'
                  : ''
              }`}
            />

            {code.split('').map((char, i) => {
              let charState: any = 'untyped';
              if (i < currentIndex) {
                charState = errors.has(i) ? 'error' : 'correct';
              } else if (i === currentIndex) {
                charState = errors.has(i) ? 'active-error' : 'active';
              }

              if (status === "typing" && i < currentIndex - 1 && gameMode === "zen") {
                 // Confidence Mode: Fade out text immediately after typing to prevent visual backspacing
                 charState = "faded";
              }

              return (
                <div key={i} style={{ opacity: charState === "faded" ? 0.15 : 1, transition: "opacity 0.3s ease", display: "inline" }}>
                  <CharNode
                    index={i}
                    char={char}
                    state={charState}
                    syntaxColor={syntaxColors[i]}
                    setRef={setCharRef}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Authentic macOS / VS Code Bottom Status Bar Inside the IDE Window */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-2 border-t border-white/[0.06] bg-black/45 text-[11px] text-neutral-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: theme.accent }}>
            <GitBranch className="w-3 h-3" />
            main*
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {errors.size} errors
          </span>
          <span className="hidden sm:inline text-neutral-500">
            Syntax Acc: <strong className="text-neutral-300">{stats.syntaxAccuracy ?? 100}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[10.5px]">
          <span>
            Ln <strong className="text-white">{cursorPosition.ln}</strong>, Col{' '}
            <strong className="text-white">{cursorPosition.col}</strong>
          </span>
          <span className="hidden md:inline">Spaces: 2</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="uppercase font-bold" style={{ color: theme.accent }}>
            {activeSnippet.label}
          </span>
        </div>
      </div>
    </div>
  );
});

export default IdeCodeViewport;
