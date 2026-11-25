import type { BorrowMark, ColumnStep, Problem } from './types';

export const digitsOf = (n: number): number[] => String(n).split('').reverse().map(Number);

export function answer(p: Problem): number {
  return p.op === '+' ? p.top + p.bottom : p.top - p.bottom;
}

/** Break a problem into column steps, right to left (spec §5, §7). */
export function solve(p: Problem): ColumnStep[] {
  if (p.single) {
    const total = answer(p);
    return [{
      place: 0, topDigit: p.top, top: p.top, bottom: p.bottom, carryIn: 0, total, write: total,
      carryOut: 0, borrow: null, trivial: p.bottom === 0, skip: false,
    }];
  }
  return p.op === '+' ? solveAdd(p) : solveSub(p);
}

function solveAdd(p: Problem): ColumnStep[] {
  const a = digitsOf(p.top), b = digitsOf(p.bottom);
  const steps: ColumnStep[] = [];
  let carry: 0 | 1 = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n || carry; i++) {
    const t = a[i] ?? 0, d = b[i] ?? 0;
    const total: number = t + d + carry;
    const carryOut: 0 | 1 = total >= 10 ? 1 : 0;
    steps.push({
      place: i, topDigit: t, top: t, bottom: d, carryIn: carry, total, write: total % 10,
      carryOut, borrow: null, trivial: (d === 0 || t === 0) && carry === 0, skip: false,
    });
    carry = carryOut;
  }
  return steps;
}

/** Money keeps the euro column (0,35 €), so columns up to here are always written. */
const MONEY_MIN_COLS = 3;

function solveSub(p: Problem): ColumnStep[] {
  const a = digitsOf(p.top), b = digitsOf(p.bottom);
  if (p.money) while (a.length < MONEY_MIN_COLS) a.push(0);
  const cur = [...a];
  const steps: ColumnStep[] = [];
  for (let i = 0; i < a.length; i++) {
    const d = b[i] ?? 0;
    let borrow: ColumnStep['borrow'] = null;
    if (cur[i] < d) {
      let j = i + 1;
      while (cur[j] === 0) j++;
      borrow = [{ place: j, before: cur[j], after: cur[j] - 1 }];
      cur[j] -= 1;
      for (let k = j - 1; k > i; k--) {
        borrow.push({ place: k, before: cur[k], after: 9 });
        cur[k] = 9;
      }
      borrow.push({ place: i, before: cur[i], after: cur[i] + 10 });
      cur[i] += 10;
    }
    const total = cur[i] - d;
    steps.push({
      place: i, topDigit: a[i], top: cur[i], bottom: d, carryIn: 0, total, write: total,
      carryOut: 0, borrow, trivial: d === 0, skip: false,
    });
  }
  // Leading zero results are not written (spec §8 review rules).
  const keep = p.money ? MONEY_MIN_COLS - 1 : 0;
  for (let i = steps.length - 1; i > keep && steps[i].write === 0; i--) steps[i].skip = true;
  return steps;
}

/**
 * Marks as she writes them at school: a zero in the middle of a chain first becomes 10,
 * then that 10 is crossed out and becomes 9 (spec §5).
 */
export function displayMarks(marks: BorrowMark[]): BorrowMark[] {
  const out: BorrowMark[] = [];
  marks.forEach((m, i) => {
    const middle = i > 0 && i < marks.length - 1 && m.before === 0 && m.after === 9;
    if (middle) out.push({ place: m.place, before: 0, after: 10 }, { place: m.place, before: 10, after: 9 });
    else out.push(m);
  });
  return out;
}
