import { LEVELS } from '../math/levels';
import type { ColumnStep, Problem } from '../math/types';
import { masteredLevel, newLevelStats, recordSum } from '../progress/levelProgress';
import { MAX_STAGE, recordResult, recordWatched, type SkillId } from '../progress/skills';
import { growth } from '../pet/petState';
import { earnFor } from '../money/money';
import type { AppState } from '../state/store';

export type Score = 'watched' | 'right' | 'wrong';

export interface ColumnOutcome {
  correct: boolean;
  scored: Partial<Record<SkillId, Score>>;
}

/** What she has to type for a column (spec §15). */
export function expectedEntry(step: ColumnStep, carryStage: number, single: boolean): number {
  if (single) return step.total;
  if (step.carryOut && carryStage === 1) return step.total;
  return step.write;
}

export interface SumResult {
  firstTry: boolean;
  cents: number;
  unlocked: number | null;
  grew: boolean;
}

/** Fold a finished sum into the state (mutates `s`). */
export function applyOutcome(s: AppState, p: Problem, cols: ColumnOutcome[]): SumResult {
  for (const c of cols) {
    for (const [k, v] of Object.entries(c.scored) as [SkillId, Score][]) {
      s.skills[k] = v === 'watched' ? recordWatched(s.skills[k]) : recordResult(s.skills[k], v === 'right', MAX_STAGE[k]);
    }
  }
  s.scruffy = false; // spec §10.5: her first sum (or care break) tidies the pet
  const firstTry = cols.every((c) => c.correct);
  let cents = 0;
  if (firstTry) {
    cents = earnFor(p.level);
    s.cents += cents;
    s.careCounter += 1;
  }
  let unlocked: number | null = null;
  let grew = false;
  if (!p.review) {
    s.levels[p.level] = recordSum(s.levels[p.level] ?? newLevelStats(), firstTry);
    if (p.level === s.unlocked && s.unlocked < LEVELS.length && masteredLevel(s.levels[p.level])) {
      const before = growth(s.unlocked);
      s.unlocked += 1;
      s.current = s.unlocked;
      unlocked = s.unlocked;
      grew = growth(s.unlocked) !== before;
    }
  }
  return { firstTry, cents, unlocked, grew };
}
