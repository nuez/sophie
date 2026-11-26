import { h } from '../ui/dom';
import { makeDraggable, isOver } from '../ui/drag';
import { itemThumb } from '../art/items';
import { coinSvg, coinLabel } from '../art/coins';
import { PAY_COINS, canAddCoin, centsMissing, changeCoins, formatEuros } from '../money/money';
import type { Item } from '../pet/catalog';

export interface PayFlow {
  el: HTMLElement;
  /** True once she has paid; false if she backs out. */
  done: Promise<boolean>;
}

/**
 * Paying in the shop, to get to know the coins: she puts down 2 €, 1 € and 50 c coins until it's
 * enough, pays, and sees the change she gets back. Nothing to work out: the screen does the sums.
 */
export function payFlow(item: Item, balance: number): PayFlow {
  const given: number[] = [];
  const total = () => given.reduce((a, b) => a + b, 0);
  let finish: (ok: boolean) => void = () => {};
  const done = new Promise<boolean>((r) => { finish = r; });

  const body = h('div', { class: 'pay-body' });
  const closeBtn = h('button', { class: 'icon-btn', 'aria-label': 'No comprar', onclick: () => finish(false) }, '✕');
  const el = h('div', { class: 'pay-screen' },
    h('header', { class: 'pay-head' },
      h('div', { class: 'pay-item' }, itemThumb(item.id), h('span', {}, item.name, ' cuesta ', h('b', {}, formatEuros(item.price)))),
      h('div', { class: 'tb-spacer' }),
      closeBtn,
    ),
    body,
  );

  let tray: HTMLElement | null = null;
  // tap a coin, or drag it onto the counter
  const coinBtn = (c: number) => {
    const b = h('button', {
      class: 'pay-coin', 'aria-label': `Poner ${coinLabel(c)}`,
      disabled: !canAddCoin(total(), c, item.price, balance),
      onclick: () => { given.push(c); render(); },
    }, coinSvg(c, 84));
    makeDraggable(b, {
      ghost: () => coinSvg(c, 84),
      onMove: (x, y) => tray?.classList.toggle('drop-here', isOver(tray, x, y)),
      onDrop: (x, y) => {
        tray?.classList.remove('drop-here');
        if (isOver(tray, x, y) && canAddCoin(total(), c, item.price, balance)) { given.push(c); render(); }
      },
    });
    return b;
  };

  function render() {
    const t = total();
    const missing = centsMissing(t, item.price, balance);
    const enough = t >= item.price;
    body.replaceChildren(
      h('p', { class: 'pay-purse' }, 'En tu monedero tienes ', h('b', {}, formatEuros(balance - t)), '.'),
      h('p', { class: 'pay-question' }, enough ? '¡Ya llega!' : '¿Con qué monedas pagas? Arrástralas o tócalas.'),
      h('div', { class: 'pay-coins' },
        ...PAY_COINS.map(coinBtn),
        missing ? h('button', { class: 'pay-small', onclick: () => { given.push(...changeCoins(missing)); render(); } },
          h('span', { class: 'coin-row' }, ...changeCoins(missing).map((c) => coinSvg(c, 44))), 'Los céntimos que faltan') : null,
      ),
      tray = h('div', { class: 'pay-tray' },
        h('span', { class: 'pay-label' }, given.length ? 'Has puesto:' : 'Pon aquí las monedas:'),
        h('span', { class: 'coin-row' }, ...given.map((c, i) => h('button', {
          class: 'tray-coin', 'aria-label': `Quitar ${coinLabel(c)}`, onclick: () => { given.splice(i, 1); render(); },
        }, coinSvg(c, 52)))),
        h('b', { class: 'pay-total' }, formatEuros(t)),
      ),
      enough || t === 0 ? '' : h('p', { class: 'pay-left' }, 'Faltan ', h('b', {}, formatEuros(item.price - t)), '.'),
      h('button', { class: 'big pay-go', disabled: !enough, onclick: paid }, 'Pagar'),
    );
  }

  function paid() {
    const t = total();
    const back = t - item.price;
    closeBtn.hidden = true; // paid: no backing out now
    const ok = h('button', { class: 'big', onclick: () => finish(true) }, '¡Genial!');
    body.replaceChildren(h('div', { class: 'pay-result' },
      h('p', {}, 'Has dado ', h('b', {}, formatEuros(t)), '. ', item.name, ' cuesta ', h('b', {}, formatEuros(item.price)), '.'),
      back > 0
        ? h('p', { class: 'pay-back' }, 'Te devuelven ', h('b', {}, formatEuros(back)), ':')
        : h('p', { class: 'pay-back' }, '¡Justo! No te devuelven nada.'),
      h('div', { class: 'coin-row change-coins' }, ...changeCoins(back).map((c) => coinSvg(c, 64))),
      ok,
    ));
  }

  render();
  return { el, done };
}
