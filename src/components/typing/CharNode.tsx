'use client';
import React, { memo } from 'react';

export interface CharNodeProps {
  char: string;
  state: 'untyped' | 'correct' | 'error' | 'active' | 'active-error';
  syntaxColor: string;
  index: number;
  setRef: (index: number, el: HTMLSpanElement | null) => void;
}

const CharNode = memo(function CharNode({
  char,
  state,
  syntaxColor,
  index,
  setRef,
}: CharNodeProps) {
  let cls = 'text-neutral-600/75';
  if (state === 'correct') cls = syntaxColor;
  else if (state === 'error')
    cls = 'text-red-400 bg-red-500/20 rounded-[3px] underline decoration-red-500';
  else if (state === 'active') cls = 'text-white';
  else if (state === 'active-error') cls = 'text-red-300 bg-red-500/30 rounded-[3px]';

  let display = char;
  if (char === '\n') display = '↵\n';
  else if (char === ' ' && (state === 'error' || state === 'active-error')) display = '·';

  return (
    <span ref={(el) => setRef(index, el)} className={cls}>
      {display}
    </span>
  );
});

export default CharNode;