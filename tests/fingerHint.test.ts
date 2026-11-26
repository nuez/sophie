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

describe('counting hands: counting on', () => {
  it('16 − 8: she says 8 (no fingers for it), then one finger per number up to 16', () => {
    const f = createFingerHint(plan('-', 16, 8));
    expect(f.el.querySelector('.finger-text')!.textContent).toContain('Di 8 en voz alta');
    expect(f.el.querySelector('.said-num')!.textContent).toBe('8');
    expect(up(f.el)).toBe(0);
    vi.advanceTimersByTime(START_MS);
    expect(labels(f.el)).toEqual([9]);
    vi.advanceTimersByTime(STEP_MS);
    expect(labels(f.el)).toEqual([9, 10]);
    playAll();
    expect(labels(f.el)).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
    expect(up(f.el)).toBe(8);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('Cuenta los dedos: 8 dedos');
  });

  it('9 + 8: say 9, raise 8 fingers; the last number, 17, is the answer', () => {
    const f = createFingerHint(plan('+', 9, 8));
    expect(f.el.querySelector('.finger-text')!.textContent).toContain('Di 9 en voz alta. Luego sube 8 dedos');
    playAll();
    expect(up(f.el)).toBe(8);
    expect(labels(f.el, '.answer')).toEqual([17]);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('17');
  });

  it('always one pair of hands', () => {
    expect(createFingerHint(plan('+', 9, 9, true)).el.querySelectorAll('svg.hands')).toHaveLength(1);
    expect(createFingerHint(plan('-', 18, 9)).el.querySelectorAll('svg.hands')).toHaveLength(1);
  });

  it('a carried 1 is the first finger, in the carry colour', () => {
    const f = createFingerHint(plan('+', 6, 3, true));
    expect(f.el.querySelector('.finger-text')!.textContent).toContain('sube 4 dedos');
    expect(f.el.querySelector('.carry-note')).not.toBeNull();
    vi.advanceTimersByTime(START_MS);
    expect(labels(f.el, '.l-carry')).toEqual([7]);
  });

  it('7 − 7 is already there: nothing rises', () => {
    const f = createFingerHint(plan('-', 7, 7));
    expect(f.done).toBe(true);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('0 dedos');
  });

  it('without numbers she counts herself: no numbers and no answer until the next hint', () => {
    const f = createFingerHint(plan('+', 6, 3), { numbers: false });
    expect(f.el.classList.contains('no-numbers')).toBe(true);
    playAll();
    expect(f.el.querySelector('.finger-result')!.textContent).toBe('');
    f.showNumbers();
    expect(f.el.classList.contains('no-numbers')).toBe(false);
    playAll();
    expect(labels(f.el)).toEqual([7, 8, 9]);
    expect(f.el.querySelector('.finger-result')!.textContent).toContain('9');
  });

  it('nothing to tap on the hands; "Otra vez" plays it again from the start', () => {
    const f = createFingerHint(plan('+', 6, 3));
    expect(f.el.querySelector('.hands-pairs button')).toBeNull();
    playAll();
    const again = f.el.querySelector<HTMLButtonElement>('.finger-again')!;
    expect(again.hidden).toBe(false);
    again.click();
    expect(up(f.el)).toBe(0);
    playAll();
    expect(up(f.el)).toBe(3);
  });
});
