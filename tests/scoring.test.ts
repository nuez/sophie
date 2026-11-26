import { describe, it, expect } from 'vitest';
import { acceptedEntries, applyOutcome, type ColumnOutcome } from '../src/play/scoring';
import { solve } from '../src/math/columns';
import { defaultState } from '../src/state/store';
import type { Problem } from '../src/math/types';

const prob = (o: Partial<Problem>): Problem => ({ op: '+', top: 27, bottom: 15, level: 7, single: false, review: false, ...o });

describe('acceptedEntries', () => {
  const units = solve(prob({}))[0]; // 7 + 5 = 12
  it('a carrying column takes the digit or the whole 12', () => expect(acceptedEntries(units, false)).toEqual([2, 12]));
  it('no carry → the digit only', () => expect(acceptedEntries(solve(prob({ top: 23, bottom: 14 }))[0], false)).toEqual([7]));
  it('single mode types the whole answer', () => expect(acceptedEntries(solve(prob({ top: 8, bottom: 7, single: true, level: 3 }))[0], true)).toEqual([15]));
});

describe('applyOutcome', () => {
  const right: ColumnOutcome = { correct: true, scored: { fingerAdd: 'right' } };
  const wrong: ColumnOutcome = { correct: false, scored: { fingerAdd: 'wrong' } };

  it('first-try sum: cents, care counter, level stats', () => {
    const s = defaultState();
    s.current = 7; s.unlocked = 7;
    s.skills.fingerAdd.stage = 2;
    const r = applyOutcome(s, prob({}), [right, right]);
    expect(r.firstTry).toBe(true);
    expect(r.cents).toBe(50);
    expect(s.cents).toBe(50);
    expect(s.careCounter).toBe(1);
    expect(s.levels[7]).toEqual({ done: 1, recent: [true] });
    expect(s.skills.fingerAdd.streak).toBe(2);
  });

  it('a wrong column: no money, no care count, level records false', () => {
    const s = defaultState();
    s.skills.fingerAdd.stage = 2;
    const r = applyOutcome(s, prob({}), [right, wrong]);
    expect(r.firstTry).toBe(false);
    expect(s.cents).toBe(0);
    expect(s.careCounter).toBe(0);
    expect(s.levels[7].recent).toEqual([false]);
  });

  it('review sums do not touch level stats but still earn money and care', () => {
    const s = defaultState();
    s.skills.fingerAdd.stage = 2;
    applyOutcome(s, prob({ review: true, level: 3 }), [right]);
    expect(s.levels[3]).toBeUndefined();
    expect(s.cents).toBe(30);
    expect(s.careCounter).toBe(1);
  });

  it('watched entries advance stage 1', () => {
    const s = defaultState();
    for (let i = 0; i < 4; i++) applyOutcome(s, prob({}), [{ correct: true, scored: { fingerAdd: 'watched' } }]);
    expect(s.skills.fingerAdd.stage).toBe(2);
  });

  it('unlocks the next level when mastered and moves her on', () => {
    const s = defaultState();
    s.unlocked = 4; s.current = 4;
    s.levels[4] = { done: 9, recent: Array(9).fill(true) };
    const r = applyOutcome(s, prob({ level: 4, op: '-', top: 12, bottom: 5, single: true }), [{ correct: true, scored: {} }]);
    expect(r.unlocked).toBe(5);
    expect(r.grew).toBe(true);
    expect(s.unlocked).toBe(5);
    expect(s.current).toBe(5);
  });

  it('after skipping ahead to level 7, passing it moves her on to 8', () => {
    const s = defaultState();
    s.unlocked = 2; s.current = 7;
    s.levels[7] = { done: 9, recent: Array(9).fill(true) };
    const r = applyOutcome(s, prob({ level: 7, op: '+', top: 47, bottom: 25 }), [{ correct: true, scored: {} }, { correct: true, scored: {} }]);
    expect(r.unlocked).toBe(8);
    expect(s.unlocked).toBe(8);
    expect(s.current).toBe(8);
  });

  it('passing a level below the one she has reached changes nothing', () => {
    const s = defaultState();
    s.unlocked = 6; s.current = 3;
    s.levels[3] = { done: 9, recent: Array(9).fill(true) };
    const r = applyOutcome(s, prob({ level: 3, op: '+', top: 7, bottom: 5, single: true }), [{ correct: true, scored: {} }]);
    expect(r.unlocked).toBeNull();
    expect(s.unlocked).toBe(6);
    expect(s.current).toBe(3);
  });

  it('does not unlock past level 14', () => {
    const s = defaultState();
    s.unlocked = 14; s.current = 14;
    s.levels[14] = { done: 20, recent: Array(10).fill(true) };
    const r = applyOutcome(s, prob({ level: 14, op: '-', top: 5003, bottom: 1847 }), [{ correct: true, scored: {} }]);
    expect(r.unlocked).toBeNull();
    expect(s.unlocked).toBe(14);
  });
});

describe('applyOutcome and the scruffy pet', () => {
  it('finishing any sum makes the pet tidy again', () => {
    const s = defaultState();
    s.scruffy = true;
    applyOutcome(s, prob({}), [{ correct: false, scored: {} }]);
    expect(s.scruffy).toBe(false);
  });
});
