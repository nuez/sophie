import { newSkill, SKILLS, type SkillId, type SkillState } from '../progress/skills';
import type { LevelStats } from '../progress/levelProgress';

export type PetKind = 'gato' | 'perro' | 'conejo' | 'dragon';
export type Gender = 'chica' | 'chico';

export interface PetInfo {
  kind: PetKind;
  name: string;
  gender: Gender;
  equipped: string[];
}

export interface Settings {
  voice: boolean;
  rate: number;
  addStart: 'larger' | 'top';
}

export interface AppState {
  version: 1;
  pet: PetInfo | null;
  /** Her purse, in cents. */
  cents: number;
  owned: string[];
  unlocked: number;
  current: number;
  levels: Record<number, LevelStats>;
  skills: Record<SkillId, SkillState>;
  careCounter: number;
  careRotation: number;
  lastVisit: number;
  scruffy: boolean;
  settings: Settings;
}

export const STORAGE_KEY = 'mates-mascota-v1';

export function defaultState(): AppState {
  return {
    version: 1,
    pet: null,
    cents: 0,
    owned: [],
    unlocked: 1,
    current: 1,
    levels: {},
    skills: Object.fromEntries(SKILLS.map((k) => [k, newSkill()])) as Record<SkillId, SkillState>,
    careCounter: 0,
    careRotation: 0,
    lastVisit: 0,
    scruffy: false,
    settings: { voice: true, rate: 0.95, addStart: 'larger' },
  };
}

const browserStorage = (): Storage | undefined => {
  try { return globalThis.localStorage; } catch { return undefined; }
};

/** Never throws: anything odd falls back to the defaults (Review Focus #1). */
export function load(storage: Storage | undefined = browserStorage()): AppState {
  const d = defaultState();
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object' || s.version !== 1) return d;
    // Saves from before euros counted coins; a coin is worth 10 c at the new prices.
    const { coins, ...rest } = s;
    const cents = typeof rest.cents === 'number' ? rest.cents : typeof coins === 'number' ? coins * 10 : 0;
    return {
      ...d,
      ...rest,
      cents,
      skills: { ...d.skills, ...(s.skills ?? {}) },
      settings: { ...d.settings, ...(s.settings ?? {}) },
      levels: s.levels ?? {},
      owned: Array.isArray(s.owned) ? s.owned : [],
    };
  } catch {
    return d;
  }
}

export function save(s: AppState, storage: Storage | undefined = browserStorage()): void {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* storage full or blocked: keep playing */ }
}
