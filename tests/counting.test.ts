import { describe, it, expect } from 'vitest';
import { solve } from '../src/math/columns';
import { countPlan } from '../src/math/counting';
import type { Problem } from '../src/math/types';

const P = (op: '+' | '-', top: number, bottom: number, single = true): Problem => ({ op, top, bottom, level: 1, single, review: false });
const step = (p: Problem) => solve(p)[0];

describe('countPlan', () => {
  it('12 − 5 counts up from 5 to 12: 7 fingers', () => {
    const c = countPlan(step(P('-', 12, 5)), '-', 'larger');
    expect(c).toMatchObject({ kind: 'sub', start: 5, end: 12, fingers: 7, answer: 7, carryFinger: false });
    expect(c.numbers).toEqual([6, 7, 8, 9, 10, 11, 12]);
  });

  it('8 + 7 starts at the larger number', () => {
    const c = countPlan(step(P('+', 8, 7)), '+', 'larger');
    expect(c).toMatchObject({ kind: 'add', start: 8, fingers: 7, end: 15, answer: 15 });
  });

  it('3 + 8 larger → start 8, 3 fingers; top → start 3, 8 fingers', () => {
    expect(countPlan(step(P('+', 3, 8)), '+', 'larger')).toMatchObject({ start: 8, fingers: 3, answer: 11 });
    expect(countPlan(step(P('+', 3, 8)), '+', 'top')).toMatchObject({ start: 3, fingers: 8, answer: 11 });
  });

  it('9 + 9 + carried 1 → 10 fingers, numbers 10..19', () => {
    const t = solve(P('+', 99, 99, false))[1];
    const c = countPlan(t, '+', 'larger');
    expect(c).toMatchObject({ start: 9, fingers: 10, answer: 19, carryFinger: true });
    expect(c.numbers).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('carry not placed → carry is not counted', () => {
    const t = solve(P('+', 99, 99, false))[1];
    expect(countPlan(t, '+', 'larger', false)).toMatchObject({ fingers: 9, answer: 18, carryFinger: false });
  });

  it('equal numbers in subtraction → 0 fingers', () => {
    expect(countPlan(step(P('-', 4, 4)), '-', 'larger')).toMatchObject({ fingers: 0, answer: 0, numbers: [] });
  });

  it('never needs more than 10 fingers', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2000; i++) {
      const a = Math.floor(rnd() * 10000), b = Math.floor(rnd() * 10000);
      for (const p of [P('+', a, b, false), P('-', Math.max(a, b), Math.min(a, b), false)]) {
        for (const s of solve(p)) {
          for (const mode of ['larger', 'top'] as const) {
            const c = countPlan(s, p.op, mode);
            expect(c.fingers).toBeLessThanOrEqual(10);
            expect(c.answer).toBe(s.total);
          }
        }
      }
    }
  });
});
