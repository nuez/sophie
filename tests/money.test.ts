import { describe, it, expect } from 'vitest';
import { formatEuros, earnFor, paymentFor, changeProblem } from '../src/money/money';
import { solve, answer } from '../src/math/columns';
import { ITEMS } from '../src/pet/catalog';

describe('formatEuros()', () => {
  it('writes euros with a comma and two cents digits', () => {
    expect(formatEuros(345)).toBe('3,45 €');
    expect(formatEuros(5)).toBe('0,05 €');
    expect(formatEuros(0)).toBe('0,00 €');
    expect(formatEuros(1200)).toBe('12,00 €');
  });
});

describe('earnFor()', () => {
  it('pays cents per first-try sum, more for harder levels', () => {
    expect(earnFor(1)).toBe(20);
    expect(earnFor(4)).toBe(40);
    expect(earnFor(14)).toBe(90);
  });
});

describe('paymentFor()', () => {
  it('pays with the smallest note or coin that is enough', () => {
    expect(paymentFor(345, 1000)).toBe(500);
    expect(paymentFor(65, 1000)).toBe(100);
    expect(paymentFor(45, 1000)).toBe(50);
    expect(paymentFor(115, 1000)).toBe(200);
  });

  it('without that note, pays with whole euros', () => {
    expect(paymentFor(345, 420)).toBe(400);
  });

  it('pays the exact price when nothing round fits', () => {
    expect(paymentFor(345, 350)).toBe(345);
  });

  it('cannot pay without enough money', () => {
    expect(paymentFor(345, 300)).toBeNull();
  });
});

describe('changeProblem()', () => {
  it('5,00 − 3,45 = 1,55 as a column subtraction', () => {
    const p = changeProblem(500, 345);
    expect(p).toMatchObject({ op: '-', top: 500, bottom: 345, money: true, single: false });
    expect(answer(p)).toBe(155);
  });

  it('always has a euro column and writes the 0 of 0,35 €', () => {
    const s = solve(changeProblem(100, 65));
    expect(s.map((c) => c.write)).toEqual([5, 3, 0]);
    expect(s.map((c) => c.skip)).toEqual([false, false, false]);
  });

  it('0,50 − 0,45 gets a euro column even though 50 has two digits', () => {
    const s = solve(changeProblem(50, 45));
    expect(s).toHaveLength(3);
    expect(s.map((c) => c.write)).toEqual([5, 0, 0]);
    expect(s.some((c) => c.skip)).toBe(false);
  });

  it('20,00 − 3,45: the leading tens-of-euros zero is skipped', () => {
    const s = solve(changeProblem(2000, 345));
    expect(s.map((c) => c.write)).toEqual([5, 5, 6, 1]);
    const t = solve(changeProblem(1000, 345));
    expect(t.map((c) => c.write)).toEqual([5, 5, 6, 0]);
    expect(t.map((c) => c.skip)).toEqual([false, false, false, true]);
  });
});

describe('shop prices', () => {
  it('are in cents and never a round note or coin, so there is always change to work out', () => {
    for (const it of ITEMS) {
      expect(it.price).toBeGreaterThan(0);
      expect(paymentFor(it.price, 100000)).toBeGreaterThan(it.price);
    }
  });
});
