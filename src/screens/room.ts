import { h, svgEl } from '../ui/dom';
import { petSvg, type Mood } from '../art/pets';
import { roomShape, wallColor } from '../art/items';
import { itemById } from '../pet/catalog';
import { growth } from '../pet/petState';
import type { AppState } from '../state/store';

/** The pet's room: wall, floor, room items and the pet. Shared by home, shop and care. */
export function room(state: AppState, mood: Mood, extra: { tangles?: number; bubbles?: boolean } = {}) {
  const eq = state.pet?.equipped ?? [];
  const wallId = eq.find((e) => itemById(e)?.slot === 'pared');
  const el = h('div', { class: 'room' });
  el.style.setProperty('--wall', wallColor(wallId));
  const wall = h('div', { class: 'room-wall' });
  if (wallId) {
    const deco = roomShape(wallId)!;
    const s = svgEl('svg', { viewBox: '6 6 88 88', preserveAspectRatio: 'xMidYMid slice', class: 'wallpaper' });
    s.append(deco);
    wall.append(s);
  }
  el.append(wall, h('div', { class: 'room-floor' }), h('div', { class: 'room-window' }));
  const place = (slot: string, cls: string) => {
    const id = eq.find((e) => itemById(e)?.slot === slot);
    if (!id) return;
    const s = svgEl('svg', { viewBox: '0 0 100 100', class: `room-thing ${cls}` });
    s.append(roomShape(id)!);
    el.append(s);
  };
  place('alfombra', 'rug');
  place('cama', 'bed');
  place('juguete', 'toy');
  const petHolder = h('div', { class: 'room-pet' });
  const draw = (m: Mood, x = extra) => {
    if (!state.pet) return;
    petHolder.replaceChildren(petSvg(state.pet.kind, { growth: growth(state.unlocked), mood: m, equipped: eq, ...x }));
  };
  draw(mood);
  el.append(petHolder);
  return { el, petHolder, draw };
}
