/** Euro coins, in cents, biggest first. */
export const EURO_COINS = [200, 100, 50, 20, 10, 5, 2, 1];

/** The coins she pays with in the shop. */
export const PAY_COINS = [200, 100, 50];

/** 345 → "3,45 €" (Spanish style: comma, two cents digits, € after). */
export function formatEuros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = cents % 100;
  return `${e},${String(c).padStart(2, '0')} €`;
}

/** What a first-try sum earns, in cents: 20 c at level 1 up to 90 c at level 14. */
export const earnFor = (level: number) => 10 * (2 + Math.floor(level / 2));

/** She may put another coin down while it isn't enough yet and her purse has it. */
export function canAddCoin(given: number, coin: number, price: number, balance: number): boolean {
  return given < price && given + coin <= balance;
}

/**
 * When it isn't enough yet, no pay coin fits her purse, but she can afford it (3,47 € for 3,45 €):
 * the cents still missing, which she puts down as small coins. Otherwise 0.
 */
export function centsMissing(given: number, price: number, balance: number): number {
  if (given >= price || balance < price) return 0;
  if (PAY_COINS.some((c) => canAddCoin(given, c, price, balance))) return 0;
  return price - given;
}

/** The change as real coins, biggest first: 55 → [50, 5]. */
export function changeCoins(cents: number): number[] {
  const out: number[] = [];
  let left = cents;
  for (const c of EURO_COINS) {
    while (left >= c) { out.push(c); left -= c; }
  }
  return out;
}
