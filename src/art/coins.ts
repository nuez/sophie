import { svgEl } from '../ui/dom';

const GOLD = '#f2c94c', GOLD_DARK = '#c99a1a', SILVER = '#d9dde3', SILVER_DARK = '#9aa3ad', COPPER = '#d98b52', COPPER_DARK = '#a65e2a';

/** Relative sizes, roughly like the real coins. */
const SIZE: Record<number, number> = { 200: 1, 100: 0.92, 50: 0.95, 20: 0.86, 10: 0.78, 5: 0.82, 2: 0.73, 1: 0.63 };

/** A euro coin with its value written on it. 1 € and 2 € are two-coloured, like the real ones. */
export function coinSvg(cents: number, px = 64): SVGSVGElement {
  const d = Math.round(px * (SIZE[cents] ?? 0.8));
  const s = svgEl('svg', { viewBox: '0 0 40 40', width: d, height: d, class: `coin coin-${cents}`, role: 'img', 'aria-label': coinLabel(cents) });
  const ring = (fill: string, stroke: string, r: number) => s.append(svgEl('circle', { cx: 20, cy: 20, r, fill, stroke, 'stroke-width': 1.5 }));
  if (cents === 200) { ring(SILVER, SILVER_DARK, 18.5); ring(GOLD, GOLD_DARK, 12.5); }
  else if (cents === 100) { ring(GOLD, GOLD_DARK, 18.5); ring(SILVER, SILVER_DARK, 12.5); }
  else if (cents >= 10) ring(GOLD, GOLD_DARK, 18.5);
  else ring(COPPER, COPPER_DARK, 18.5);
  const big = cents >= 100;
  s.append(svgEl('text', { x: 20, y: big ? 22 : 21, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': big ? 15 : 13, 'font-weight': 700, fill: '#3a3533' }, big ? `${cents / 100}€` : `${cents}c`));
  return s;
}

export const coinLabel = (cents: number) => (cents >= 100 ? `${cents / 100} euro${cents > 100 ? 's' : ''}` : `${cents} céntimo${cents > 1 ? 's' : ''}`);
