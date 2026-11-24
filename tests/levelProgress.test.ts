import { describe, it, expect } from 'vitest';
import { recordSum, masteredLevel, capFor, newLevelStats } from '../src/progress/levelProgress';

const fill = (results: boolean[]) => results.reduce((s, r) => recordSum(s, r), newLevelStats());

describe('levelProgress', () => {
  it('keeps only the last 10 results', () => {
    const s = fill(Array(15).fill(true));
    expect(s.done).toBe(15);
    expect(s.recent).toHaveLength(10);
  });

  it('not mastered before 10 sums even if all correct', () => {
    expect(masteredLevel(fill(Array(9).fill(true)))).toBe(false);
  });

  it('mastered at 10 sums with 8 of the last 10', () => {
    expect(masteredLevel(fill([false, false, ...Array(8).fill(true)]))).toBe(true);
    expect(masteredLevel(fill([false, false, false, ...Array(7).fill(true)]))).toBe(false);
  });

  it('caps a newly introduced skill for the first 5 sums of its level', () => {
    expect(capFor(8, 3, 'borrow')).toBe(2);
    expect(capFor(8, 5, 'borrow')).toBeUndefined();
    expect(capFor(8, 0, 'carry')).toBeUndefined();
    expect(capFor(7, 0, 'carry')).toBe(2);
    expect(capFor(12, 4, 'borrow')).toBe(2);
    expect(capFor(9, 0, 'borrow')).toBeUndefined();
  });
});
