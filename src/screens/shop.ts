import { h } from '../ui/dom';
import { icon } from '../art/icons';
import { itemThumb } from '../art/items';
import { topbar } from '../ui/topbar';
import { ITEMS, equip } from '../pet/catalog';
import { say } from '../audio/speech';
import { room } from './room';
import type { Screen } from '../app';

export const shopScreen: Screen = (root, app) => {
  const tb = topbar(app, { home: true, title: 'Tienda' });
  const preview = h('div', { class: 'shop-preview' });
  const grid = h('div', { class: 'shop-grid' });

  const render = () => {
    const s = app.state;
    const eq = s.pet?.equipped ?? [];
    preview.replaceChildren(room(s, 'feliz').el);
    grid.replaceChildren(...ITEMS.map((it) => {
      const owned = s.owned.includes(it.id);
      const on = eq.includes(it.id);
      const afford = s.coins >= it.price;
      return h('button', {
        class: `shop-item ${owned ? 'owned' : ''} ${on ? 'on' : ''} ${!owned && !afford ? 'dim' : ''}`,
        onclick: () => {
          if (owned) {
            app.update((st) => { st.pet!.equipped = on ? eq.filter((e) => e !== it.id) : equip(eq, it.id); });
          } else if (afford) {
            app.update((st) => { st.coins -= it.price; st.owned.push(it.id); st.pet!.equipped = equip(eq, it.id); });
            tb.setCoins(app.state.coins);
            say(['comprado']);
          } else {
            say(['faltan_monedas']);
            return;
          }
          render();
        },
      },
        itemThumb(it.id),
        h('span', { class: 'item-name' }, it.name),
        owned ? h('span', { class: 'item-state' }, on ? '✓ Puesto' : 'Ponérselo') : h('span', { class: 'price' }, icon('coin', 22), String(it.price)),
      );
    }));
  };
  render();
  root.append(tb.el, h('div', { class: 'shop-body' }, preview, h('div', { class: 'shop-scroll' }, grid)));
  say(['tienda']);
};
