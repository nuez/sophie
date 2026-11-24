import { describe, it, expect } from 'vitest';
import { solve, answer } from '../src/math/columns';
import type { Problem } from '../src/math/types';

const sub = (top: number, bottom: number, single = false): Problem => ({ op: '-', top, bottom, level: 9, single, review: false });
const add = (top: number, bottom: number, single = false): Problem => ({ op: '+', top, bottom, level: 7, single, review: false });

describe('solve() subtraction', () => {
  it('32 − 5 borrows from the tens', () => {
    const [u, t] = solve(sub(32, 5));
    expect(u).toMatchObject({ place: 0, topDigit: 2, top: 12, bottom: 5, write: 7 });
    expect(u.borrow).toEqual([{ place: 1, before: 3, after: 2 }, { place: 0, before: 2, after: 12 }]);
    expect(t).toMatchObject({ place: 1, topDigit: 3, top: 2, bottom: 0, write: 2, borrow: null, skip: false });
  });

  it('1000 − 1 chains through the zeros and skips the leading zero', () => {
    const s = solve(sub(1000, 1));
    expect(s[0]).toMatchObject({ top: 10, write: 9 });
    expect(s[0].borrow).toEqual([
      { place: 3, before: 1, after: 0 },
      { place: 2, before: 0, after: 9 },
      { place: 1, before: 0, after: 9 },
      { place: 0, before: 0, after: 10 },
    ]);
    expect(s[1]).toMatchObject({ top: 9, write: 9, borrow: null });
    expect(s[2]).toMatchObject({ top: 9, write: 9, borrow: null });
    expect(s[3]).toMatchObject({ top: 0, write: 0, skip: true });
  });

  it('5003 − 1847 = 3156', () => {
    expect(answer(sub(5003, 1847))).toBe(3156);
    expect(solve(sub(5003, 1847)).map((c) => c.write)).toEqual([6, 5, 1, 3]);
  });

  it('400 − 400: units written as 0, the rest skipped', () => {
    const s = solve(sub(400, 400));
    expect(s.map((c) => c.write)).toEqual([0, 0, 0]);
    expect(s.map((c) => c.skip)).toEqual([false, true, true]);
  });

  it('marks trivial columns (minus zero)', () => {
    const s = solve(sub(48, 20));
    expect(s[0].trivial).toBe(true);
    expect(s[1].trivial).toBe(false);
  });
});

describe('solve() addition', () => {
  it('358 + 674 carries three times and adds a final column', () => {
    const s = solve(add(358, 674));
    expect(s.map((c) => c.carryOut)).toEqual([1, 1, 1, 0]);
    expect(s.map((c) => c.write)).toEqual([2, 3, 0, 1]);
    expect(s[3]).toMatchObject({ place: 3, topDigit: 0, bottom: 0, carryIn: 1, total: 1, write: 1 });
  });

  it('99 + 1: units total 10', () => {
    const s = solve(add(99, 1));
    expect(s[0]).toMatchObject({ total: 10, write: 0, carryOut: 1 });
    expect(answer(add(99, 1))).toBe(100);
  });

  it('single mode returns one step with the whole answer', () => {
    const s = solve(add(8, 7, true));
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ total: 15, write: 15, carryOut: 0, carryIn: 0, borrow: null });
  });

  it('single subtraction keeps the whole top (level 4 style ¹2 − 5)', () => {
    const s = solve(sub(12, 5, true));
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ top: 12, bottom: 5, total: 7, write: 7, borrow: null });
  });
});

describe('solve() property', () => {
  it('reproduces arithmetic for random problems up to 4 digits', () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2000; i++) {
      const a = Math.floor(rnd() * 10000), b = Math.floor(rnd() * 10000);
      const [top, bottom] = a >= b ? [a, b] : [b, a];
      expect(answer(sub(top, bottom))).toBe(top - bottom);
      expect(answer(add(a, b))).toBe(a + b);
    }
  });
});

import { displayMarks } from '../src/math/columns';
describe('displayMarks', () => {
  it('shows a middle zero becoming 10 and then 9 (school method)', () => {
    const marks = solve(sub(300, 7))[0].borrow!;
    expect(displayMarks(marks)).toEqual([
      { place: 2, before: 3, after: 2 },
      { place: 1, before: 0, after: 10 },
      { place: 1, before: 10, after: 9 },
      { place: 0, before: 0, after: 10 },
    ]);
  });
  it('leaves simple borrows alone', () => {
    const marks = solve(sub(32, 5))[0].borrow!;
    expect(displayMarks(marks)).toEqual(marks);
  });
  it('0 + N without carry is trivial in addition', () => {
    expect(solve(add(30, 25))[0].trivial).toBe(true);
    expect(solve(add(39, 25))[1].trivial).toBe(false); // 3 + 2 + carry
  });
});
