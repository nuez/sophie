import { h } from '../ui/dom';
import { icon } from '../art/icons';
import { itemThumb } from '../art/items';
import { solve, answer } from '../math/columns';
import { effectiveStage, type SkillId } from '../progress/skills';
import { say } from '../audio/speech';
import { createBoard } from '../play/board';
import { createPad } from '../play/pad';
import { Aborted, Input } from '../play/input';
import { runColumn, type PlayCtx } from '../play/column';
import { changeProblem, formatEuros } from '../money/money';
import type { Item } from '../pet/catalog';
import type { App } from '../app';

export interface ChangeFlow {
  el: HTMLElement;
  /** True once she has worked out the change; false if she backs out. */
  done: Promise<boolean>;
  destroy(): void;
}

/**
 * Paying in the shop: the app hands over `paid`, she works out paid − price on the
 * column board with the usual hints, then the shopkeeper gives her the change.
 * Practice only: it doesn't move her skill stages or level stats.
 */
export function changeFlow(app: App, item: Item, paid: number): ChangeFlow {
  const p = changeProblem(paid, item.price);
  const steps = solve(p);
  const input = new Input();
  const board = createBoard(p, steps);
  board.onTap((place, row) => input.push({ type: 'tap', place, row }));
  const helperArea = h('div', { class: 'helper-area' });
  let active = 0;
  const pad = createPad((v) => board.writeAnswer(active, v, 'typing'), (v) => input.push({ type: 'check', value: v }), 2);

  let finish: (ok: boolean) => void = () => {};
  const done = new Promise<boolean>((r) => { finish = r; });
  const cancel = h('button', { class: 'icon-btn', 'aria-label': 'No comprar', onclick: () => { destroy(); finish(false); } }, '✕');

  const el = h('div', { class: 'change-screen' },
    h('header', { class: 'change-head' },
      h('div', { class: 'change-item' }, itemThumb(item.id), h('span', {}, item.name, ': ', h('b', {}, formatEuros(item.price)))),
      h('div', { class: 'change-paid' }, 'Pagas con ', h('b', { class: 'money-tag' }, formatEuros(paid))),
      h('div', { class: 'tb-spacer' }),
      cancel,
    ),
    h('p', { class: 'change-question' }, '¿Cuánto te devuelven?'),
    h('main', { class: 'play' },
      h('section', { class: 'play-left' }, h('div', { class: 'board-holder' }, board.el), helperArea),
      h('section', { class: 'play-right' }, pad.el),
    ),
  );

  const s = app.state;
  const ctx: PlayCtx = {
    p, steps, board, pad, input, helperArea,
    addStart: s.settings.addStart,
    carryPlaced: new Set(),
    stage: (k: SkillId) => effectiveStage(s.skills[k]),
    speak: (clips) => say(clips),
    petReact: () => {},
  };

  function destroy() { input.destroy(); }

  (async () => {
    try {
      input.flush();
      for (const step of steps) {
        active = step.place;
        await runColumn(ctx, step);
      }
      board.setActive(null);
      pad.enable(false);
      const ok = h('button', { class: 'big' }, '¡Genial!');
      helperArea.replaceChildren(h('div', { class: 'change-result' },
        h('p', {}, 'Te devuelven ', h('b', {}, formatEuros(answer(p)))),
        h('div', { class: 'earned' }, icon('coin', 36), formatEuros(answer(p))),
        ok,
      ));
      await new Promise<void>((r) => ok.addEventListener('click', () => r(), { once: true }));
      destroy();
      finish(true);
    } catch (e) {
      if (!(e instanceof Aborted)) console.error(e);
      finish(false);
    }
  })();

  return { el, done, destroy };
}
