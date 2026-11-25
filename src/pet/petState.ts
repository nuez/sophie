import { CONFIG } from '../config';
import type { AppState } from '../state/store';

export type ActivityId = 'cepillar' | 'acariciar' | 'comer' | 'banar' | 'lazo' | 'pelota';

export const CARE_ACTIVITIES: { id: ActivityId; unlock: number }[] = [
  { id: 'cepillar', unlock: 1 },
  { id: 'acariciar', unlock: 1 },
  { id: 'comer', unlock: 1 },
  { id: 'banar', unlock: 3 },
  { id: 'lazo', unlock: 6 },
  { id: 'pelota', unlock: 9 },
];

export function applyVisit(s: AppState, now: number): AppState {
  const away = now - s.lastVisit;
  const scruffy = s.scruffy || (s.lastVisit > 0 && away >= CONFIG.scruffyAfterMs);
  return { ...s, scruffy, lastVisit: now };
}

export const growth = (unlocked: number): 0 | 1 | 2 => (unlocked >= 10 ? 2 : unlocked >= 5 ? 1 : 0);

export const unlockedActivities = (unlocked: number): ActivityId[] =>
  CARE_ACTIVITIES.filter((a) => a.unlock <= unlocked).map((a) => a.id);

export function nextActivity(s: AppState): ActivityId {
  if (s.scruffy) return 'cepillar';
  const list = unlockedActivities(s.unlocked);
  return list[s.careRotation % list.length];
}
