import { h, svgEl } from '../ui/dom';
import { makeDraggable } from '../ui/drag';
import { petSvg, type Mood } from '../art/pets';
import { roomShape, wallColor } from '../art/items';
import { itemById } from '../pet/catalog';
import { growth } from '../pet/petState';
import type { AppState } from '../state/store';

/** The pet's room: wall, floor, room items and the pet. Shared by home, shop and care. */
export interface Arrange {
  /** She moved a room thing: its new place, in % of the room. */
  moved(slot: string, pos: { left: number; bottom: number }): void;
}

export function room(state: AppState, mood: Mood, extra: { tangles?: number; bubbles?: boolean } = {}, arrange?: Arrange) {
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
    const at = state.pet?.placed?.[slot];
    if (!arrange) {
      if (at) Object.assign(s.style, { left: `${at.left}%`, bottom: `${at.bottom}%`, right: 'auto' });
      el.append(s);
      return;
    }
    // in the shop she can drag it to another spot in the room
    const box = h('div', { class: `room-thing ${cls} movable` });
    s.setAttribute('class', 'thing-art');
    box.append(s);
    if (at) Object.assign(box.style, { left: `${at.left}%`, bottom: `${at.bottom}%`, right: 'auto' });
    makeDraggable(box, {
      onDrop: (x, y) => {
        const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
        const left = Math.min(100 - (b.width / r.width) * 100, Math.max(0, ((x - r.left - b.width / 2) / r.width) * 100));
        const bottom = Math.min(36, Math.max(0, ((r.bottom - y - b.height / 2) / r.height) * 100));
        Object.assign(box.style, { left: `${left}%`, bottom: `${bottom}%`, right: 'auto' });
        arrange.moved(slot, { left: Math.round(left), bottom: Math.round(bottom) });
      },
    });
    el.append(box);
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
