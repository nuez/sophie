import { describe, it, expect } from 'vitest';
import { createLadder } from '../src/play/ladder';
import { countPlan } from '../src/math/counting';
import { solve } from '../src/math/columns';
import type { Op, Problem } from '../src/math/types';

const plan = (op: Op, top: number, bottom: number, carry = false) => {
  const p: Problem = { op, top, bottom, level: 3, single: true, review: false };
  const step = { ...solve(p)[0], carryIn: (carry ? 1 : 0) as 0 | 1 };
  return countPlan(step, op, 'larger');
};
const nums = (el: HTMLElement) => [...el.querySelectorAll('.rung .rung-num')].map((c) => c.textContent);
const counts = (el: HTMLElement) => [...el.querySelectorAll('.rung .rung-count')].map((c) => c.textContent);
const next = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.ladder-next')!;

describe('counting ladder', () => {
  it('9 − 4 starts at 4 with 0 fingers; the goal is only in the sentence', () => {
    const l = createLadder(plan('-', 9, 4));
    expect(l.el.querySelector('.ladder-text')!.textContent).toContain('Empieza en el 4');
    expect(l.el.querySelector('.ladder-text')!.textContent).toContain('Sube hasta el 9');
    expect(nums(l.el)).toEqual(['4']);
    expect(counts(l.el)).toEqual(['0']);
  });

  it('never shows empty boxes ahead: their number would give the answer away', () => {
    const l = createLadder(plan('-', 9, 4));
    next(l.el).click();
    next(l.el).click();
    expect(l.el.querySelectorAll('.rung')).toHaveLength(3);
    expect(l.el.querySelector('.rung.empty, .rung.goal')).toBeNull();
  });

  it('each ➜ adds the next number with its finger count; at 9 the 5 fingers are the answer', () => {
    const l = createLadder(plan('-', 9, 4));
    for (let i = 0; i < 5; i++) next(l.el).click();
    expect(nums(l.el)).toEqual(['4', '5', '6', '7', '8', '9']);
    expect(counts(l.el)).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(l.done).toBe(true);
    expect(next(l.el).hidden).toBe(true);
    expect(l.el.querySelector('.rung.goal .rung-num')!.textContent).toBe('9');
    expect(l.el.querySelector('.answer-mark')!.closest('.rung-count')).not.toBeNull();
    expect(l.el.querySelector('.ladder-result')!.textContent).toContain('5 dedos');
    next(l.el).click(); // extra taps do nothing
    expect(counts(l.el)).toHaveLength(6);
  });

  it('8 + 4 shows the fingers to raise; at 4 fingers the number reached is the answer', () => {
    const l = createLadder(plan('+', 8, 4));
    expect(l.el.querySelector('.ladder-text')!.textContent).toContain('Sube 4 dedos');
    expect(counts(l.el)).toEqual(['0']);
    for (let i = 0; i < 4; i++) next(l.el).click();
    expect(nums(l.el)).toEqual(['8', '9', '10', '11', '12']);
    expect(l.el.querySelector('.answer-mark')!.closest('.rung-num')).not.toBeNull();
    expect(l.el.querySelector('.ladder-result')!.textContent).toContain('12');
  });

  it('a carried 1 is the first finger, in the carry colour', () => {
    const l = createLadder(plan('+', 8, 4, true));
    expect(l.el.querySelector('.ladder-text')!.textContent).toContain('Sube 5 dedos');
    expect(l.el.querySelector('.carry-note')).not.toBeNull();
    next(l.el).click();
    expect(l.el.querySelector('.hands .f-carry')).not.toBeNull();
  });

  it('7 − 7 is already there: 0 fingers, no ➜', () => {
    const l = createLadder(plan('-', 7, 7));
    expect(l.done).toBe(true);
    expect(next(l.el).hidden).toBe(true);
    expect(l.el.querySelector('.ladder-result')!.textContent).toContain('0 dedos');
  });

  it('the hands are only a picture: tapping them does nothing', () => {
    const l = createLadder(plan('-', 9, 4));
    l.el.querySelector('.hands')!.dispatchEvent(new Event('pointerdown'));
    expect(counts(l.el)).toHaveLength(1);
  });
});
