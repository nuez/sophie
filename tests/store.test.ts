import { describe, it, expect } from 'vitest';
import { defaultState, load, save, STORAGE_KEY } from '../src/state/store';

class MemStorage {
  data: Record<string, string> = {};
  getItem(k: string) { return k in this.data ? this.data[k] : null; }
  setItem(k: string, v: string) { this.data[k] = v; }
  removeItem(k: string) { delete this.data[k]; }
}
const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } } as unknown as Storage;

describe('store', () => {
  it('default state', () => {
    const s = defaultState();
    expect(s).toMatchObject({ version: 1, pet: null, cents: 0, unlocked: 1, current: 1, careCounter: 0, scruffy: false });
    expect(s.settings).toEqual({ voice: true, rate: 0.95, addStart: 'larger' });
    expect(Object.keys(s.skills).sort()).toEqual(['borrow', 'carry', 'fingerAdd', 'fingerSub']);
  });

  it('round-trips through storage', () => {
    const st = new MemStorage() as unknown as Storage;
    const s = defaultState();
    s.cents = 42;
    s.pet = { kind: 'gato', name: 'Luna', gender: 'chica', equipped: [] };
    save(s, st);
    expect(load(st)).toEqual(s);
  });

  it('survives storage that throws', () => {
    expect(load(throwing)).toEqual(defaultState());
    expect(() => save(defaultState(), throwing)).not.toThrow();
  });

  it('survives corrupt JSON', () => {
    const st = new MemStorage();
    st.setItem(STORAGE_KEY, '{bad');
    expect(load(st as unknown as Storage)).toEqual(defaultState());
  });

  it('ignores an unknown version', () => {
    const st = new MemStorage();
    st.setItem(STORAGE_KEY, JSON.stringify({ version: 0, coins: 99 }));
    expect(load(st as unknown as Storage).cents).toBe(0);
  });

  it('fills in fields missing from an older save', () => {
    const st = new MemStorage();
    st.setItem(STORAGE_KEY, JSON.stringify({ version: 1, coins: 7, settings: { voice: false } }));
    const s = load(st as unknown as Storage);
    expect(s.settings).toEqual({ voice: false, rate: 0.95, addStart: 'larger' });
    expect(s.skills.borrow.stage).toBe(1);
  });

  it('turns coins from an older save into cents (one coin = 10 c)', () => {
    const st = new MemStorage();
    st.setItem(STORAGE_KEY, JSON.stringify({ version: 1, coins: 7 }));
    const s = load(st as unknown as Storage);
    expect(s.cents).toBe(70);
    expect('coins' in s).toBe(false);
  });

  it('keeps cents from a newer save', () => {
    const st = new MemStorage();
    st.setItem(STORAGE_KEY, JSON.stringify({ version: 1, cents: 345 }));
    expect(load(st as unknown as Storage).cents).toBe(345);
  });
});
