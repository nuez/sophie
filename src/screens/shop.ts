import { h } from '../ui/dom';
import { makeDraggable, isOver } from '../ui/drag';
import { icon } from '../art/icons';
import { itemThumb } from '../art/items';
import { topbar } from '../ui/topbar';
import { ITEMS, equip, type Item } from '../pet/catalog';
import { say, stopSpeech } from '../audio/speech';
import { formatEuros } from '../money/money';
import { room } from './room';
import { payFlow } from './pay';
import type { Screen } from '../app';

export const shopScreen: Screen = (root, app) => {
  const tb = topbar(app, { home: true, title: 'Tienda' });
  const preview = h('div', { class: 'shop-preview' });
  const grid = h('div', { class: 'shop-grid' });
  const note = h('p', { class: 'shop-note' });

  const ROOM_W: Record<string, number> = { alfombra: 46, cama: 22, juguete: 13 };
  /** Where a room thing lands when she drops it at (x, y) on the room, in % of the room. */
  const spotAt = (it: Item, x: number, y: number) => {
    const w = ROOM_W[it.slot];
    const r = preview.querySelector('.room')?.getBoundingClientRect();
    if (!w || !r) return null;
    const px = (w / 100) * r.width; // the drawings are square
    return {
      left: Math.round(Math.min(100 - w, Math.max(0, ((x - r.left - px / 2) / r.width) * 100))),
      bottom: Math.round(Math.min(36, Math.max(0, ((r.bottom - y - px / 2) / r.height) * 100))),
    };
  };
  const putOn = (it: Item, at: { left: number; bottom: number } | null) => {
    app.update((st) => {
      st.pet!.equipped = equip(st.pet!.equipped, it.id);
      if (at) st.pet!.placed = { ...st.pet!.placed, [it.slot]: at };
    });
  };

  const buy = (it: Item, at: { left: number; bottom: number } | null = null) => {
    app.update((st) => { st.cents -= it.price; st.owned.push(it.id); });
    putOn(it, at);
    tb.setMoney(app.state.cents);
    note.textContent = `¡Comprado! Te quedan ${formatEuros(app.state.cents)}.`;
    say(['comprado']);
  };

  const pay = async (it: Item, at: { left: number; bottom: number } | null = null) => {
    if (app.state.cents < it.price) {
      note.textContent = `Te falta dinero: tienes ${formatEuros(app.state.cents)}. ¡Sigue jugando para ganar más!`;
      say(['faltan_monedas']);
      return;
    }
    note.textContent = '';
    stopSpeech();
    const flow = payFlow(it, app.state.cents);
    root.append(flow.el);
    const ok = await flow.done;
    flow.el.remove();
    if (ok) buy(it, at);
    render();
  };

  const render = () => {
    const s = app.state;
    const eq = s.pet?.equipped ?? [];
    preview.replaceChildren(room(s, 'feliz', {}, {
      moved: (slot, pos) => app.update((st) => { st.pet!.placed = { ...st.pet!.placed, [slot]: pos }; }),
    }).el);
    grid.replaceChildren(...ITEMS.map((it) => {
      const owned = s.owned.includes(it.id);
      const on = eq.includes(it.id);
      const afford = s.cents >= it.price;
      const b = h('button', {
        class: `shop-item ${owned ? 'owned' : ''} ${on ? 'on' : ''} ${!owned && !afford ? 'dim' : ''}`,
        onclick: () => {
          if (owned) {
            app.update((st) => { st.pet!.equipped = on ? eq.filter((e) => e !== it.id) : equip(eq, it.id); });
            render();
          } else pay(it);
        },
      },
        itemThumb(it.id),
        h('span', { class: 'item-name' }, it.name),
        owned ? h('span', { class: 'item-state' }, on ? '✓ Puesto' : 'Ponérselo') : h('span', { class: 'price' }, icon('coin', 22), formatEuros(it.price)),
      );
      // or drag it onto the pet's room: to buy it, or to put it on (room things land where she drops them)
      makeDraggable(b, {
        inScroller: true,
        ghost: () => itemThumb(it.id),
        ghostSize: 96,
        onMove: (x, y) => preview.classList.toggle('drop-here', isOver(preview, x, y)),
        onDrop: (x, y) => {
          preview.classList.remove('drop-here');
          if (!isOver(preview, x, y)) return;
          const at = spotAt(it, x, y);
          if (owned) { putOn(it, at); render(); } else pay(it, at);
        },
      });
      return b;
    }));
  };
  render();
  root.append(tb.el, h('div', { class: 'shop-body' }, preview, h('div', { class: 'shop-scroll' }, note, grid)));
  say(['tienda']);
};
