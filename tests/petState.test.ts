import { describe, it, expect } from 'vitest';
import { defaultState } from '../src/state/store';
import { applyVisit, growth, nextActivity, unlockedActivities } from '../src/pet/petState';
import { ITEMS } from '../src/pet/catalog';

const H = 3600 * 1000;

describe('applyVisit', () => {
  it('first visit just stamps the time', () => {
    const s = applyVisit({ ...defaultState(), lastVisit: 0 }, 1000 * H);
    expect(s.scruffy).toBe(false);
    expect(s.lastVisit).toBe(1000 * H);
  });
  it('23h59 away is not scruffy, 24h is', () => {
    const base = { ...defaultState(), lastVisit: 100 * H };
    expect(applyVisit(base, 100 * H + 24 * H - 60000).scruffy).toBe(false);
    expect(applyVisit(base, 124 * H).scruffy).toBe(true);
  });
  it('clock going backwards does not make it scruffy or crash', () => {
    const s = applyVisit({ ...defaultState(), lastVisit: 500 * H }, 400 * H);
    expect(s.scruffy).toBe(false);
    expect(s.lastVisit).toBe(400 * H);
  });
  it('stays scruffy until cared for', () => {
    const s = applyVisit({ ...defaultState(), lastVisit: 100 * H, scruffy: true }, 101 * H);
    expect(s.scruffy).toBe(true);
  });
});

describe('pet rules', () => {
  it('growth stages at levels 5 and 10', () => {
    expect([1, 4, 5, 9, 10, 14].map(growth)).toEqual([0, 0, 1, 1, 2, 2]);
  });
  it('scruffy forces brushing', () => {
    expect(nextActivity({ ...defaultState(), scruffy: true, careRotation: 2 })).toBe('cepillar');
  });
  it('rotation only uses unlocked activities', () => {
    expect(unlockedActivities(1)).toEqual(['cepillar', 'acariciar', 'comer']);
    expect(unlockedActivities(9)).toEqual(['cepillar', 'acariciar', 'comer', 'banar', 'lazo', 'pelota']);
    const seen = new Set([0, 1, 2, 3, 4, 5].map((r) => nextActivity({ ...defaultState(), unlocked: 2, careRotation: r })));
    expect([...seen].sort()).toEqual(['acariciar', 'cepillar', 'comer']);
  });
  it('catalog ids are unique and there are ~24 items', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ITEMS.length).toBeGreaterThanOrEqual(20);
  });
});
