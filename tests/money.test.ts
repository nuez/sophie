import { describe, it, expect } from 'vitest';
import { formatEuros, earnFor, canAddCoin, centsMissing, changeCoins } from '../src/money/money';
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

describe('paying with coins', () => {
  it('she can add a coin while it is not enough yet and she has the money', () => {
    expect(canAddCoin(0, 200, 345, 655)).toBe(true);
    expect(canAddCoin(300, 100, 345, 655)).toBe(true);
    expect(canAddCoin(400, 50, 345, 655)).toBe(false); // already enough
    expect(canAddCoin(300, 200, 345, 450)).toBe(false); // she doesn't have that much
  });

  it('when no coin fits but she can afford it, she puts in the cents that are missing', () => {
    expect(centsMissing(300, 345, 347)).toBe(45);
    expect(centsMissing(300, 345, 655)).toBe(0); // a coin still fits
    expect(centsMissing(400, 345, 655)).toBe(0); // already enough
  });

  it('change is shown as real euro coins, biggest first', () => {
    expect(changeCoins(55)).toEqual([50, 5]);
    expect(changeCoins(155)).toEqual([100, 50, 5]);
    expect(changeCoins(388)).toEqual([200, 100, 50, 20, 10, 5, 2, 1]);
    expect(changeCoins(0)).toEqual([]);
  });
});

describe('shop prices', () => {
  it('are in cents and never round, so there is always change from coins', () => {
    for (const it of ITEMS) expect(it.price % 50).not.toBe(0);
  });
});
