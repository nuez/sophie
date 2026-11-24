import type { ColumnStep, Op } from './types';

export interface CountPlan {
  kind: 'add' | 'sub';
  start: number;
  end: number;
  fingers: number;
  numbers: number[];
  carryFinger: boolean;
  answer: number;
}

const range = (from: number, to: number) => {
  const r: number[] = [];
  for (let n = from; n <= to; n++) r.push(n);
  return r;
};

/**
 * How to count a column on the fingers (spec §6.1).
 * Subtraction: count up from bottom to top; answer = fingers.
 * Addition: start at the larger digit (or the top one) and count on the other plus the carry; answer = last number.
 */
export function countPlan(step: ColumnStep, op: Op, addStart: 'larger' | 'top', carryPlaced?: boolean): CountPlan {
  if (op === '-') {
    const fingers = step.top - step.bottom;
    return { kind: 'sub', start: step.bottom, end: step.top, fingers, numbers: range(step.bottom + 1, step.top), carryFinger: false, answer: fingers };
  }
  const carry = (carryPlaced ?? step.carryIn === 1) ? 1 : 0;
  const t = step.topDigit, b = step.bottom;
  const start = addStart === 'top' ? t : Math.max(t, b);
  const other = addStart === 'top' ? b : Math.min(t, b);
  const fingers = other + carry;
  const end = start + fingers;
  return { kind: 'add', start, end, fingers, numbers: range(start + 1, end), carryFinger: carry === 1, answer: end };
}
