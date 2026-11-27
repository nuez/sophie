import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTenFrameHint, START_MS, STEP_MS } from '../src/play/tenFrame';
import { countPlan } from '../src/math/counting';
import { solve } from '../src/math/columns';
import type { Op, Problem } from '../src/math/types';

const plan = (op: Op, top: number, bottom: number, carry = false) => {
  const p: Problem = { op, top, bottom, level: 3, single: true, review: false };
  const step = { ...solve(p)[0], carryIn: (carry ? 1 : 0) as 0 | 1 };
  return countPlan(step, op, 'larger');
};
/** Dots per frame as a string: b = blue (she has), o = orange (added), p = pink (carry), . = empty. */
const frames = (el: HTMLElement) => [...el.querySelectorAll('.tf-frame')].map((f) =>
  [...f.querySelectorAll('.tf-dot')].map((d) => (d.classList.contains('have') ? 'b' : d.classList.contains('add') ? 'o' : d.classList.contains('carry') ? 'p' : '.')).join(''));
const adds = (el: HTMLElement) => [...el.querySelectorAll('.tf-add')].map((a) => a.textContent);
const playAll = () => vi.advanceTimersByTime(START_MS + 25 * STEP_MS);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('marcos de 10: complete the 10', () => {
  it('8 + 4: 8 blue, then orange fills the 10 and spills into the second box', () => {
    const f = createTenFrameHint(plan('+', 8, 4));
    expect(f.el.querySelector('.count-text')!.textContent).toBe('Tienes 8. Pon 4 más: primero llena el 10.');
    expect(frames(f.el)).toEqual(['bbbbbbbb..', '..........']);
    vi.advanceTimersByTime(START_MS);
    expect(frames(f.el)).toEqual(['bbbbbbbbo.', '..........']);
    playAll();
    expect(frames(f.el)).toEqual(['bbbbbbbboo', 'oo........']);
    expect(f.el.querySelector('.tf-frame.full')).not.toBeNull();
    expect(adds(f.el)).toEqual(['+2', '+2']);
    expect(f.el.querySelector('.count-result')!.textContent).toBe('Con 2 llegas a 10. Quedan 2: 10 y 2 son 12.');
  });

  it('12 − 8 counts up: 2 to get to 10, 2 more to 12, so 4', () => {
    const f = createTenFrameHint(plan('-', 12, 8));
    expect(f.el.querySelector('.count-text')!.textContent).toBe('Tienes 8. ¿Cuántos faltan para llegar a 12? Primero llega al 10.');
    playAll();
    expect(frames(f.el)).toEqual(['bbbbbbbboo', 'oo........']);
    expect(f.el.querySelector('.count-result')!.textContent).toBe('Hasta el 10 faltan 2. Del 10 al 12 faltan 2. 2 y 2 son 4.');
  });

  it('within 10 there is one box: 9 − 4 is "del 4 al 9 faltan 5"', () => {
    const f = createTenFrameHint(plan('-', 9, 4));
    playAll();
    expect(frames(f.el)).toEqual(['bbbbooooo.']);
    expect(f.el.querySelector('.count-result')!.textContent).toBe('Del 4 al 9 faltan 5.');
  });

  it('6 + 3 in one box: "6 y 3 son 9"', () => {
    const f = createTenFrameHint(plan('+', 6, 3));
    playAll();
    expect(frames(f.el)).toEqual(['bbbbbbooo.']);
    expect(f.el.querySelector('.count-result')!.textContent).toBe('6 y 3 son 9.');
  });

  it('a carried 1 is the first dot added, in pink', () => {
    const f = createTenFrameHint(plan('+', 6, 3, true));
    expect(f.el.querySelector('.carry-note')).not.toBeNull();
    playAll();
    expect(frames(f.el)).toEqual(['bbbbbbpooo']);
  });

  it('the biggest column still fits two boxes: 9 + 9 + 1', () => {
    const f = createTenFrameHint(plan('+', 9, 9, true));
    playAll();
    expect(frames(f.el)).toEqual(['bbbbbbbbbp', 'ooooooooo.']);
  });

  it('without numbers she counts the dots herself; the next hint adds sizes and the sentence', () => {
    const f = createTenFrameHint(plan('+', 8, 4), { numbers: false });
    playAll();
    expect(adds(f.el)).toEqual(['', '']);
    expect(f.el.querySelector('.count-result')!.textContent).toBe('');
    f.showNumbers();
    expect(frames(f.el)).toEqual(['bbbbbbbb..', '..........']); // plays again from the start
    playAll();
    expect(adds(f.el)).toEqual(['+2', '+2']);
  });

  it('nothing to tap; "Otra vez" plays it again', () => {
    const f = createTenFrameHint(plan('+', 6, 3));
    expect(f.el.querySelector('.tf-frames button')).toBeNull();
    playAll();
    f.el.querySelector<HTMLButtonElement>('.count-again')!.click();
    expect(frames(f.el)).toEqual(['bbbbbb....']);
  });

  it('7 − 7: nothing to add', () => {
    const f = createTenFrameHint(plan('-', 7, 7));
    expect(f.done).toBe(true);
    expect(f.el.querySelector('.count-result')!.textContent).toContain('faltan 0');
  });
});
