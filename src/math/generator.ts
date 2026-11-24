import { CONFIG } from '../config';
import { levelById } from './levels';
import type { Problem } from './types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const same = (a: Problem, b?: Problem) => !!b && a.op === b.op && a.top === b.top && a.bottom === b.bottom;

/** Next problem for a level, with ~20% review from earlier levels (spec §9). */
export function generate(level: number, opts: { rng?: () => number; last?: Problem; unlocked: number }): Problem {
  const rng = opts.rng ?? Math.random;
  let lv = level;
  let review = false;
  if (level > 1 && rng() < CONFIG.reviewShare) {
    lv = 1 + Math.floor(rng() * (level - 1));
    review = true;
  }
  const def = levelById(lv);
  let p = def.draw(rng);
  for (let i = 0; i < 20 && same(p, opts.last); i++) p = def.draw(rng);
  return { ...p, review };
}
