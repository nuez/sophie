import { h } from './dom';
import { icon } from '../art/icons';
import { formatEuros } from '../money/money';
import type { App } from '../app';

export interface TopbarOpts {
  home?: boolean;
  title?: string;
  onRepeat?: () => void;
  paws?: number;
}

export function topbar(app: App, o: TopbarOpts = {}) {
  const coins = h('span', { class: 'coins', 'aria-label': 'Monedero' }, icon('coin', 30), h('b', {}, formatEuros(app.state.cents)));
  const paws = h('div', { class: 'paws', 'aria-label': 'Patitas' });
  const setPaws = (n: number) => {
    paws.replaceChildren(...Array.from({ length: 5 }, (_, i) => {
      const p = icon('paw', 26);
      p.classList.toggle('on', i < n);
      return p;
    }));
  };
  if (o.paws !== undefined) setPaws(o.paws);
  const el = h('header', { class: 'topbar' },
    o.home ? h('button', { class: 'icon-btn', 'aria-label': 'Casa', onclick: () => app.go('home') }, icon('home', 36)) : null,
    o.title ? h('div', { class: 'tb-title' }, o.title) : null,
    h('div', { class: 'tb-spacer' }),
    o.paws !== undefined ? paws : null,
    o.onRepeat ? h('button', { class: 'icon-btn', 'aria-label': 'Repetir', onclick: o.onRepeat }, icon('speaker', 36)) : null,
    coins,
  );
  return {
    el,
    setMoney(cents: number) { coins.querySelector('b')!.textContent = formatEuros(cents); coins.classList.remove('bump'); void coins.offsetWidth; coins.classList.add('bump'); },
    setPaws,
  };
}
