import type { Problem } from '../math/types';

/** Euro coins and notes from 5 c up, in cents: what the app can hand the shopkeeper. */
export const DENOMINATIONS = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

/** 345 → "3,45 €" (Spanish style: comma, two cents digits, € after). */
export function formatEuros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  return `${e},${String(c).padStart(2, '0')} €`;
}

/** What a first-try sum earns, in cents: 20 c at level 1 up to 90 c at level 14. */
export const earnFor = (level: number) => 10 * (2 + Math.floor(level / 2));

/**
 * What the app hands over to pay `price` from a purse holding `balance` (all cents):
 * the smallest single note or coin that is enough, else whole euros, else the exact price.
 * Null when she can't afford it.
 */
export function paymentFor(price: number, balance: number): number | null {
  if (balance < price) return null;
  const note = DENOMINATIONS.find((d) => d >= price && d <= balance);
  if (note !== undefined) return note;
  const whole = Math.ceil(price / 100) * 100;
  if (whole <= balance) return whole;
  return price;
}

/** The change sum she works out in the shop: paid − price, written with euros and cents. */
export function changeProblem(paid: number, price: number): Problem {
  return { op: '-', top: paid, bottom: price, level: 0, single: false, review: false, money: true };
}
