import { h } from '../ui/dom';
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

  const buy = (it: Item) => {
    app.update((st) => { st.cents -= it.price; st.owned.push(it.id); st.pet!.equipped = equip(st.pet!.equipped, it.id); });
    tb.setMoney(app.state.cents);
    note.textContent = `¡Comprado! Te quedan ${formatEuros(app.state.cents)}.`;
    say(['comprado']);
  };

  const pay = async (it: Item) => {
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
    if (ok) buy(it);
    render();
  };

  const render = () => {
    const s = app.state;
    const eq = s.pet?.equipped ?? [];
    preview.replaceChildren(room(s, 'feliz').el);
    grid.replaceChildren(...ITEMS.map((it) => {
      const owned = s.owned.includes(it.id);
      const on = eq.includes(it.id);
      const afford = s.cents >= it.price;
      return h('button', {
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
    }));
  };
  render();
  root.append(tb.el, h('div', { class: 'shop-body' }, preview, h('div', { class: 'shop-scroll' }, note, grid)));
  say(['tienda']);
};
