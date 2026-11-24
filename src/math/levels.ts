import type { ColumnStep, Op, Problem } from './types';
import { digitsOf, solve } from './columns';

export interface LevelDef {
  id: number;
  name: string;
  example: string;
  op: Op;
  single: boolean;
  newConcept: 'carry' | 'borrow' | null;
  check(p: Problem, steps: ColumnStep[]): boolean;
  draw(rng: () => number): Problem;
}

type Rng = () => number;
const rint = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const len = (n: number) => String(n).length;
const carries = (s: ColumnStep[]) => s.some((c) => c.carryOut === 1);
const borrows = (s: ColumnStep[]) => s.some((c) => c.borrow !== null);
const throughZero = (s: ColumnStep[]) => s.some((c) => (c.borrow?.length ?? 0) > 2);

interface Spec {
  id: number; name: string; example: string; op: Op; single?: boolean;
  newConcept?: 'carry' | 'borrow';
  pick(rng: Rng): [number, number];
  ok(top: number, bottom: number, steps: ColumnStep[]): boolean;
  fallback: [number, number];
}

const SPECS: Spec[] = [
  { id: 1, name: 'Sumas de una cifra', example: '3 + 4', op: '+', single: true,
    pick: (r) => [rint(r, 1, 8), rint(r, 1, 8)], ok: (a, b) => a + b <= 9 && a > 0 && b > 0, fallback: [3, 4] },
  { id: 2, name: 'Restas de una cifra', example: '9 − 4', op: '-', single: true,
    pick: (r) => [rint(r, 2, 9), rint(r, 1, 8)], ok: (a, b) => b >= 1 && b < a && a <= 9, fallback: [9, 4] },
  { id: 3, name: 'Sumas que pasan de diez', example: '8 + 7', op: '+', single: true,
    pick: (r) => [rint(r, 2, 9), rint(r, 2, 9)], ok: (a, b) => a + b >= 10, fallback: [8, 7] },
  { id: 4, name: 'Restas contando hacia arriba', example: '¹2 − 5', op: '-', single: true,
    pick: (r) => [rint(r, 11, 18), rint(r, 2, 9)], ok: (a, b) => a >= 11 && a <= 18 && b >= 2 && b <= 9 && a - 10 < b, fallback: [12, 5] },
  { id: 5, name: 'Sumas de dos cifras', example: '23 + 14', op: '+',
    pick: (r) => [rint(r, 10, 88), rint(r, 10, 88)], ok: (a, b, s) => len(a) === 2 && len(b) === 2 && !carries(s), fallback: [23, 14] },
  { id: 6, name: 'Restas de dos cifras', example: '48 − 23', op: '-',
    pick: (r) => [rint(r, 21, 99), rint(r, 10, 98)], ok: (a, b, s) => len(b) === 2 && a > b && !borrows(s), fallback: [48, 23] },
  { id: 7, name: 'Sumas con llevada', example: '27 + 15', op: '+', newConcept: 'carry',
    pick: (r) => [rint(r, 10, 99), rint(r, 10, 99)], ok: (a, b, s) => len(a) === 2 && len(b) === 2 && carries(s), fallback: [27, 15] },
  { id: 8, name: 'Restas con llevada (una cifra abajo)', example: '32 − 5', op: '-', newConcept: 'borrow',
    pick: (r) => [rint(r, 11, 99), rint(r, 2, 9)], ok: (a, b, s) => len(a) === 2 && len(b) === 1 && borrows(s), fallback: [32, 5] },
  { id: 9, name: 'Restas con llevada', example: '42 − 17', op: '-',
    pick: (r) => [rint(r, 21, 99), rint(r, 10, 89)], ok: (a, b, s) => len(b) === 2 && a > b && borrows(s), fallback: [42, 17] },
  { id: 10, name: 'Sumas de tres cifras', example: '358 + 274', op: '+',
    pick: (r) => [rint(r, 100, 999), rint(r, 100, 999)], ok: (_a, _b, s) => carries(s), fallback: [358, 274] },
  { id: 11, name: 'Restas de tres cifras', example: '532 − 278', op: '-',
    pick: (r) => [rint(r, 200, 999), rint(r, 100, 899)],
    ok: (a, b, s) => len(b) === 3 && a > b && !digitsOf(a).includes(0) && borrows(s), fallback: [532, 278] },
  { id: 12, name: 'Restas con ceros', example: '305 − 128', op: '-', newConcept: 'borrow',
    pick: (r) => {
      const top = rint(r, 1, 9) * 100 + (r() < 0.35 ? 0 : rint(r, 0, 9));
      return [top, rint(r, 2, top - 1)];
    },
    ok: (a, b, s) => len(a) === 3 && a > b && throughZero(s), fallback: [305, 128] },
  { id: 13, name: 'Sumas de cuatro cifras', example: '3478 + 2865', op: '+',
    pick: (r) => [rint(r, 1000, 9999), rint(r, 100, 9999)], ok: (_a, _b, s) => carries(s), fallback: [3478, 2865] },
  { id: 14, name: 'Restas de cuatro cifras', example: '5003 − 1847', op: '-',
    pick: (r) => {
      let top = rint(r, 1000, 9999);
      if (r() < 0.5) {
        // put zeros in the middle so the borrow has to travel
        const d = digitsOf(top);
        d[1] = 0;
        if (r() < 0.5) d[2] = 0;
        top = Number(d.reverse().join(''));
      }
      return [top, rint(r, 100, top - 1)];
    },
    ok: (a, b, s) => len(a) === 4 && a > b && borrows(s), fallback: [5003, 1847] },
];

export const LEVELS: LevelDef[] = SPECS.map((sp) => {
  const single = !!sp.single;
  const make = (top: number, bottom: number): Problem => ({ op: sp.op, top, bottom, level: sp.id, single, review: false });
  const check = (p: Problem, steps: ColumnStep[]) => p.op === sp.op && p.single === single && sp.ok(p.top, p.bottom, steps);
  return {
    id: sp.id, name: sp.name, example: sp.example, op: sp.op, single, newConcept: sp.newConcept ?? null,
    check,
    draw(rng) {
      for (let i = 0; i < 200; i++) {
        const [a, b] = sp.pick(rng);
        const p = make(a, b);
        if (p.top >= p.bottom || p.op === '+') if (check(p, solve(p))) return p;
      }
      return make(...sp.fallback);
    },
  };
});

export const levelById = (id: number) => LEVELS[Math.min(Math.max(id, 1), LEVELS.length) - 1];
