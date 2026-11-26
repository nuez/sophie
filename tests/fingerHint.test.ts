import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFingerHint, START_MS, STEP_MS } from '../src/play/fingerHint';
import { countPlan } from '../src/math/counting';
import { solve } from '../src/math/columns';
import type { Op, Problem } from '../src/math/types';

const plan = (op: Op, top: number, bottom: number, carry = false) => {
  const p: Problem = { op, top, bottom, level: 3, single: true, review: false };
  const step = { ...solve(p)[0], carryIn: (carry ? 1 : 0) as 0 | 1 };
  return countPlan(step, op, 'larger');
};
const labels = (el: HTMLElement, cls = '') => [...el.querySelectorAll(`.flabel.on${cls}`)].map((l) => Number(l.textContent));
const up = (el: HTMLElement) => [...el.querySelectorAll<SVGSVGElement>('svg.hands')].map((s) => s.dataset.fingers!).join('').replace(/d/g, '').length;
const playAll = () => vi.advanceTimersByTime(START_MS + 20 * STEP_MS);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('counting hands', () => {
  it('6 + 3: six fingers are up already, numbered 1–6', () => {
    const f = createFingerHint(plan('+', 6, 3));
    expect(f.el.querySelector('.finger-text')!.textContent).toContain('Empieza con 6 dedos arriba. Sube 3 más.');
    expect(up(f.el)).toBe(6);
    expect(labels(f.el)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(f.done).toBe(false);
  });

  it('then 7, 8 and 9 rise one by one by themselves; 9 is the answer', () => {
    const f = createFingerHint(plan('+', 6, 3));
    vi.advanceTimersByTime(START_MS);
    expect(labels(f.el, '.l-new')).toEqual([7]);
    vi.advanceTimersByTime(STEP_MS);
    expect(labels(f.el, '.l-new')).toEqual([7, 8]);
    vi.advanceTimersByTime(STEP_MS);
    expect(labels(f.el)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(labels(f.el, '.answer')).toEqual([9]);
    expect(f.done).toBe(true);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('9');
  });

  it('9 − 4 counts up: 4 fingers up, rise to 9, five fingers rose', () => {
    const f = createFingerHint(plan('-', 9, 4));
    expect(f.el.querySelector('.finger-text')!.textContent).toContain('Empieza con 4 dedos arriba. Sube hasta el 9.');
    expect(up(f.el)).toBe(4);
    playAll();
    expect(labels(f.el, '.l-new')).toEqual([5, 6, 7, 8, 9]);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('Has subido 5 dedos');
  });

  it('past 10 a second pair of hands carries on: 8 + 5 = 13', () => {
    const f = createFingerHint(plan('+', 8, 5));
    expect(f.el.querySelectorAll('svg.hands')).toHaveLength(2);
    playAll();
    expect(up(f.el)).toBe(13);
    expect(labels(f.el, '.answer')).toEqual([13]);
  });

  it('one pair is enough up to 10', () => {
    expect(createFingerHint(plan('+', 6, 4)).el.querySelectorAll('svg.hands')).toHaveLength(1);
  });

  it('a carried 1 is the first finger to rise, in the carry colour', () => {
    const f = createFingerHint(plan('+', 6, 3, true));
    expect(f.el.querySelector('.finger-text')!.textContent).toContain('Sube 4 más');
    expect(f.el.querySelector('.carry-note')).not.toBeNull();
    vi.advanceTimersByTime(START_MS);
    expect(labels(f.el, '.l-carry')).toEqual([7]);
  });

  it('7 − 7 is already there: nothing rises', () => {
    const f = createFingerHint(plan('-', 7, 7));
    expect(f.done).toBe(true);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('0 dedos');
  });

  it('nothing to tap on the hands; "Otra vez" plays it again from the start', () => {
    const f = createFingerHint(plan('+', 6, 3));
    expect(f.el.querySelector('.hands-pairs button')).toBeNull();
    expect(f.el.querySelector<HTMLButtonElement>('.finger-again')!.hidden).toBe(true);
    playAll();
    const again = f.el.querySelector<HTMLButtonElement>('.finger-again')!;
    expect(again.hidden).toBe(false);
    again.click();
    expect(up(f.el)).toBe(6);
    playAll();
    expect(up(f.el)).toBe(9);
  });
});
