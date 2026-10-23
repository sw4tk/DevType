'use client';
import React, { memo } from 'react';

interface KeyboardDeckProps {
  activeKey?: string;
  missedKeys?: Record<string, number>;
  mode?: 'live' | 'heatmap';
  accentColor?: string;
  capsLockOn?: boolean;
}

interface KeyDef {
  id: string;
  label: string;
  shift?: string;
  width?: string;
  homing?: boolean;
  isAccentKey?: boolean;
}

const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { id: '`', label: '`', shift: '~', isAccentKey: true },
    { id: '1', label: '1', shift: '!' },
    { id: '2', label: '2', shift: '@' },
    { id: '3', label: '3', shift: '#' },
    { id: '4', label: '4', shift: '$' },
    { id: '5', label: '5', shift: '%' },
    { id: '6', label: '6', shift: '^' },
    { id: '7', label: '7', shift: '&' },
    { id: '8', label: '8', shift: '*' },
    { id: '9', label: '9', shift: '(' },
    { id: '0', label: '0', shift: ')' },
    { id: '-', label: '-', shift: '_' },
    { id: '=', label: '=', shift: '+' },
    { id: 'BKSP', label: '⌫', width: 'w-14', isAccentKey: true },
  ],
  [
    { id: 'TAB', label: 'TAB', width: 'w-12', isAccentKey: true },
    { id: 'Q', label: 'Q' },
    { id: 'W', label: 'W' },
    { id: 'E', label: 'E' },
    { id: 'R', label: 'R' },
    { id: 'T', label: 'T' },
    { id: 'Y', label: 'Y' },
    { id: 'U', label: 'U' },
    { id: 'I', label: 'I' },
    { id: 'O', label: 'O' },
    { id: 'P', label: 'P' },
    { id: '[', label: '[', shift: '{' },
    { id: ']', label: ']', shift: '}' },
    { id: '\\', label: '\\', shift: '|', width: 'w-10' },
  ],
  [
    { id: 'CAPS', label: 'CAPS', width: 'w-14', isAccentKey: true },
    { id: 'A', label: 'A' },
    { id: 'S', label: 'S' },
    { id: 'D', label: 'D' },
    { id: 'F', label: 'F', homing: true },
    { id: 'G', label: 'G' },
    { id: 'H', label: 'H' },
    { id: 'J', label: 'J', homing: true },
    { id: 'K', label: 'K' },
    { id: 'L', label: 'L' },
    { id: ';', label: ';', shift: ':' },
    { id: "'", label: "'", shift: '"' },
    { id: 'ENTER', label: '↵ RETURN', width: 'w-16', isAccentKey: true },
  ],
  [
    { id: 'SHIFT', label: '⇧ SHIFT', width: 'w-[4.5rem]', isAccentKey: true },
    { id: 'Z', label: 'Z' },
    { id: 'X', label: 'X' },
    { id: 'C', label: 'C' },
    { id: 'V', label: 'V' },
    { id: 'B', label: 'B' },
    { id: 'N', label: 'N' },
    { id: 'M', label: 'M' },
    { id: ',', label: ',', shift: '<' },
    { id: '.', label: '.', shift: '>' },
    { id: '/', label: '/', shift: '?' },
    { id: 'RSHIFT', label: '⇧', width: 'w-[4.5rem]', isAccentKey: true },
  ],
  [
    { id: 'CTRL', label: 'CTRL', width: 'w-11', isAccentKey: true },
    { id: 'CMD', label: '⌘', width: 'w-10', isAccentKey: true },
    { id: 'SPACE', label: '', width: 'w-56' },
    { id: 'ALT', label: 'OPT', width: 'w-10', isAccentKey: true },
    { id: 'FN', label: 'FN', width: 'w-11', isAccentKey: true },
  ],
];

function normalizeKeyToId(rawKey: string): string {
  if (!rawKey) return '';
  const upper = rawKey.toUpperCase();
  const shiftMap: Record<string, string> = {
    '~': '`',
    '!': '1',
    '@': '2',
    '#': '3',
    '$': '4',
    '%': '5',
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    '_': '-',
    '+': '=',
    '{': '[',
    '}': ']',
    '|': '\\',
    ':': ';',
    '"': "'",
    '<': ',',
    '>': '.',
    '?': '/',
  };
  return shiftMap[upper] || upper;
}

const LiveKeyboardDeck = memo(function LiveKeyboardDeck({
  activeKey = '',
  missedKeys = {},
  mode = 'live',
  accentColor = '#10b981',
  capsLockOn = false,
}: KeyboardDeckProps) {
  const normalizedActive = normalizeKeyToId(activeKey);

  return (
    <div
      className="relative flex flex-col items-center select-none py-1"
      style={{
        perspective: '950px',
      }}
    >
      <div
        style={{
          transform: mode === 'live' ? 'rotateX(19deg) translateZ(0px)' : 'rotateX(12deg)',
          transformStyle: 'preserve-3d',
          boxShadow: `
            0 10px 0 0 #07070a,
            0 12px 0 1px rgba(255,255,255,0.07),
            0 28px 55px -8px rgba(0,0,0,0.95),
            0 0 40px -10px ${accentColor}22
          `,
        }}
        className="relative inline-flex flex-col items-center gap-1.5 p-3.5 rounded-[20px] bg-gradient-to-b from-[#16161d] via-[#0d0d12] to-[#09090d] border border-white/[0.12] transition-transform duration-300"
      >
        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-14 h-[3px] rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div
          style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
          className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full opacity-80"
        />

        <div className="flex flex-col items-center gap-[7px] px-2.5 py-2 rounded-[14px] bg-[#050508] border border-black shadow-[inset_0_4px_12px_rgba(0,0,0,0.95)]">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center justify-center gap-[6px]">
              {row.map((k) => {
                const isPressed = mode === 'live' && normalizedActive === k.id;
                const isCapsLocked = k.id === 'CAPS' && capsLockOn;
                const missCount =
                  (missedKeys[k.id] || 0) +
                  (k.shift ? missedKeys[k.shift] || 0 : 0) +
                  (missedKeys[k.id.toLowerCase()] || 0);

                let capBg = k.isAccentKey
                  ? 'linear-gradient(180deg, #1d1d26 0%, #14141b 100%)'
                  : 'linear-gradient(180deg, #23232e 0%, #171720 100%)';
                let capBorder = 'rgba(255,255,255,0.1)';
                let capText = k.isAccentKey ? '#a1a1aa' : '#e4e4e7';
                let capTransform = 'translate3d(0px, -2px, 0px)';
                let capShadow = `
                  inset 0 1px 0 0 rgba(255,255,255,0.18),
                  inset 0 -1px 2px 0 rgba(0,0,0,0.6),
                  0 4px 0 0 #09090d,
                  0 5px 6px 0 rgba(0,0,0,0.85)
                `;

                if (isPressed || isCapsLocked) {
                  const glowHex = isCapsLocked ? '#f59e0b' : accentColor;
                  capBg = `linear-gradient(180deg, ${glowHex}44 0%, ${glowHex}22 100%)`;
                  capBorder = glowHex;
                  capText = '#ffffff';
                  capTransform = isPressed
                    ? 'translate3d(0px, 2px, 0px) scale(0.97)'
                    : 'translate3d(0px, 0px, 0px)';
                  capShadow = `
                    inset 0 1px 2px 0 rgba(255,255,255,0.35),
                    0 1px 0 0 #09090d,
                    0 0 18px 2px ${glowHex}66
                  `;
                } else if (mode === 'heatmap' && missCount > 0) {
                  if (missCount >= 3) {
                    capBg =
                      'linear-gradient(180deg, rgba(239,68,68,0.42) 0%, rgba(185,28,28,0.28) 100%)';
                    capBorder = '#f87171';
                    capText = '#fecaca';
                    capShadow = `
                      inset 0 1px 0 0 rgba(255,255,255,0.25),
                      0 4px 0 0 #450a0a,
                      0 0 16px rgba(239,68,68,0.45)
                    `;
                  } else {
                    capBg =
                      'linear-gradient(180deg, rgba(245,158,11,0.35) 0%, rgba(180,83,9,0.2) 100%)';
                    capBorder = '#fbbf24';
                    capText = '#fde68a';
                    capShadow = `
                      inset 0 1px 0 0 rgba(255,255,255,0.2),
                      0 4px 0 0 #451a03
                    `;
                  }
                }

                return (
                  <div
                    key={k.id}
                    style={{
                      background: capBg,
                      borderColor: capBorder,
                      color: capText,
                      transform: capTransform,
                      boxShadow: capShadow,
                    }}
                    className={`${
                      k.width || 'w-8'
                    } h-7 rounded-[7px] border flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all duration-[45ms] ease-out relative group hover:-translate-y-[3px]`}
                  >
                    <div className="pointer-events-none absolute inset-[2px] rounded-[4px] bg-gradient-to-b from-black/20 to-white/[0.03]" />

                    {/* Physical Caps Lock Hardware LED Dot */}
                    {k.id === 'CAPS' && (
                      <span
                        className={`absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full transition-all ${
                          capsLockOn
                            ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                            : 'bg-white/15'
                        }`}
                      />
                    )}

                    {k.shift ? (
                      <div className="relative z-10 flex items-center gap-0.5 leading-none">
                        <span className="text-[9.5px]">{k.label}</span>
                        <span className="text-[8px] opacity-40">{k.shift}</span>
                      </div>
                    ) : (
                      <span className="relative z-10 leading-none tracking-tight">{k.label}</span>
                    )}

                    {(k.homing || k.id === 'SPACE') && (
                      <span
                        style={{
                          backgroundColor: isPressed ? '#ffffff' : `${accentColor}99`,
                          boxShadow: isPressed ? `0 0 6px #fff` : 'none',
                        }}
                        className={`relative z-10 mt-0.5 rounded-full ${
                          k.id === 'SPACE' ? 'w-9 h-[2px]' : 'w-2.5 h-[2px]'
                        }`}
                      />
                    )}

                    {mode === 'heatmap' && missCount > 0 && (
                      <span className="absolute -top-2 -right-1.5 z-20 px-1 min-w-[15px] h-3.5 rounded-full bg-red-500 text-[8px] text-black font-extrabold flex items-center justify-center shadow-md">
                        {missCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default LiveKeyboardDeck;