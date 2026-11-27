import { describe, it, expect } from 'vitest';
import { createBoard } from '../src/play/board';
import { solve } from '../src/math/columns';
import type { Problem } from '../src/math/types';

describe('one-column board', () => {
  it('15 − 7 shows 15 as a plain number, not a borrowed 1 over a 5', () => {
    const p: Problem = { op: '-', top: 15, bottom: 7, level: 4, single: true, review: false };
    const b = createBoard(p, solve(p));
    const top = b.el.querySelector('.srow.top')!;
    expect(top.textContent).toBe('15');
    expect(top.querySelector('.ten')).toBeNull();
  });
});
