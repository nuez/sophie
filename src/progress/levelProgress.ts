import { CONFIG } from '../config';
import { levelById } from '../math/levels';
import type { SkillId } from './skills';

export interface LevelStats {
  done: number;
  recent: boolean[];
}

export const newLevelStats = (): LevelStats => ({ done: 0, recent: [] });

export function recordSum(s: LevelStats, firstTry: boolean): LevelStats {
  return { done: s.done + 1, recent: [...s.recent, firstTry].slice(-CONFIG.unlockWindow) };
}

export function masteredLevel(s: LevelStats | undefined): boolean {
  if (!s || s.done < CONFIG.unlockMinSums) return false;
  return s.recent.filter(Boolean).length >= CONFIG.unlockCorrect;
}

/** A level that introduces carry/borrow caps that skill at stage 2 for its first sums (spec §15). */
export function capFor(levelId: number, sumsDoneAtLevel: number, skill: SkillId): number | undefined {
  const nc = levelById(levelId).newConcept;
  if (!nc || nc !== skill || sumsDoneAtLevel >= CONFIG.newConceptSums) return undefined;
  return CONFIG.newConceptCap;
}
