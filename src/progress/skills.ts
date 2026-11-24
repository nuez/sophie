import { CONFIG } from '../config';

export type SkillId = 'fingerAdd' | 'fingerSub' | 'carry' | 'borrow';
export const SKILLS: SkillId[] = ['fingerAdd', 'fingerSub', 'carry', 'borrow'];
export const MAX_STAGE: Record<SkillId, number> = { fingerAdd: 5, fingerSub: 5, carry: 3, borrow: 3 };

export interface SkillState {
  stage: number;
  streak: number;
  recent: boolean[];
  watched: number;
}

export const newSkill = (): SkillState => ({ stage: 1, streak: 0, recent: [], watched: 0 });

/** Stage 1 is "show me": it advances on exposure (spec §15). */
export function recordWatched(s: SkillState): SkillState {
  const watched = s.watched + 1;
  if (s.stage === 1 && watched >= CONFIG.watchedToAdvance) return { stage: 2, streak: 0, recent: [], watched: 0 };
  return { ...s, watched };
}

export function recordResult(s: SkillState, correct: boolean, max: number): SkillState {
  const recent = [...s.recent, correct].slice(-CONFIG.stageDownWindow);
  if (correct) {
    const streak = s.streak + 1;
    if (streak >= CONFIG.stageUpStreak && s.stage < max) return { stage: s.stage + 1, streak: 0, recent: [], watched: 0 };
    return { ...s, streak, recent };
  }
  const wrong = recent.filter((r) => !r).length;
  if (wrong >= CONFIG.stageDownWrong && s.stage > 1) return { stage: s.stage - 1, streak: 0, recent: [], watched: 0 };
  return { ...s, streak: 0, recent };
}

export const effectiveStage = (s: SkillState, cap?: number) => (cap === undefined ? s.stage : Math.min(s.stage, cap));
