import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/math/levels';
import { generate, mulberry32 } from '../src/math/generator';
import { solve, answer, digitsOf } from '../src/math/columns';
import type { Problem } from '../src/math/types';

const len = (n: number) => String(n).length;
const hasCarry = (p: Problem) => solve(p).some((s) => s.carryOut === 1);
const hasBorrow = (p: Problem) => solve(p).some((s) => s.borrow !== null);
const borrowsThroughZero = (p: Problem) => solve(p).some((s) => (s.borrow?.length ?? 0) > 2);

function samples(level: number, n = 500, seed = level * 99): Problem[] {
  const rng = mulberry32(seed);
  const out: Problem[] = [];
  let last: Problem | undefined;
  for (let i = 0; i < n; i++) {
    const p = LEVELS[level - 1].draw(rng);
    out.push(p);
    last = p;
  }
  void last;
  return out;
}

describe('LEVELS', () => {
  it('has 14 levels numbered 1..14', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  for (const L of LEVELS) {
    it(`level ${L.id} draws valid problems (${L.example})`, () => {
      for (const p of samples(L.id)) {
        expect(p.level).toBe(L.id);
        expect(p.op).toBe(L.op);
        expect(p.single).toBe(L.single);
        expect(answer(p)).toBeGreaterThanOrEqual(0);
        expect(L.check(p, solve(p))).toBe(true);
      }
    });
  }

  it('digit counts follow the spec', () => {
    for (const p of samples(1)) expect(answer(p)).toBeLessThanOrEqual(9);
    for (const p of samples(3)) expect(answer(p)).toBeGreaterThanOrEqual(10);
    for (const p of samples(4)) { expect(p.top).toBeGreaterThanOrEqual(11); expect(p.top).toBeLessThanOrEqual(18); expect(p.top - 10).toBeLessThan(p.bottom); }
    for (const p of [...samples(5), ...samples(6), ...samples(7), ...samples(9)]) { expect(len(p.top)).toBe(2); expect(len(p.bottom)).toBe(2); }
    for (const p of samples(8)) { expect(len(p.top)).toBe(2); expect(len(p.bottom)).toBe(1); }
    for (const p of [...samples(10), ...samples(11)]) { expect(len(p.top)).toBe(3); expect(len(p.bottom)).toBe(3); }
    for (const p of samples(12)) expect(len(p.top)).toBe(3);
    for (const p of [...samples(13), ...samples(14)]) expect(len(p.top)).toBe(4);
  });

  it('carry and borrow levels really need them', () => {
    for (const p of samples(5)) expect(hasCarry(p)).toBe(false);
    for (const p of samples(6)) expect(hasBorrow(p)).toBe(false);
    for (const l of [7, 10, 13]) for (const p of samples(l)) expect(hasCarry(p)).toBe(true);
    for (const l of [8, 9, 11, 12, 14]) for (const p of samples(l)) expect(hasBorrow(p)).toBe(true);
    for (const p of samples(11)) expect(digitsOf(p.top)).not.toContain(0);
    for (const p of samples(12)) expect(borrowsThroughZero(p)).toBe(true);
    const z = samples(14).filter(borrowsThroughZero).length;
    expect(z / 500).toBeGreaterThanOrEqual(0.3);
  });
});

describe('generate()', () => {
  it('never repeats the previous problem', () => {
    const rng = mulberry32(5);
    let last: Problem | undefined;
    for (let i = 0; i < 500; i++) {
      const p = generate(1, { rng, last, unlocked: 1 });
      if (last) expect([p.op, p.top, p.bottom]).not.toEqual([last.op, last.top, last.bottom]);
      last = p;
    }
  });

  it('mixes in about 20% review sums from earlier levels', () => {
    const rng = mulberry32(11);
    const ps = Array.from({ length: 2000 }, () => generate(6, { rng, unlocked: 6 }));
    const review = ps.filter((p) => p.review);
    expect(review.length / 2000).toBeGreaterThan(0.15);
    expect(review.length / 2000).toBeLessThan(0.25);
    for (const p of review) expect(p.level).toBeLessThan(6);
    for (const p of ps.filter((p) => !p.review)) expect(p.level).toBe(6);
  });

  it('level 1 has no review sums', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 200; i++) expect(generate(1, { rng, unlocked: 1 }).review).toBe(false);
  });

  it('terminates with a fallback even with a degenerate rng', () => {
    const p = generate(12, { rng: () => 0.999, unlocked: 12 });
    expect(p.review).toBe(false);
    expect(LEVELS[11].check(p, solve(p))).toBe(true);
  });
});
