import { h } from '../ui/dom';
import { handPair, type HandPair } from '../art/hands';
import type { CountPlan } from '../math/counting';

export interface FingerHint {
  el: HTMLElement;
  readonly done: boolean;
  /** The next hint: numbers over the fingers, and the count plays again with them. */
  showNumbers(): void;
}

const dedos = (n: number) => (n === 1 ? '1 dedo' : `${n} dedos`);

export function fingerText(plan: CountPlan): string {
  const goal = plan.kind === 'sub' ? `Sube hasta el ${plan.end}.` : `Sube ${plan.fingers} más.`;
  return `Empieza con ${dedos(plan.start)} arriba. ${goal}`;
}

export const START_MS = 1000;
export const STEP_MS = 850;

/**
 * The counting hint (design 2026-11-25, revision 3): two human hands. The first number is already
 * up, each finger with its number above it (6 + 3: fingers 1–6). Then the other fingers rise one by
 * one by themselves, with painted nails and their numbers (7, 8, 9). Nothing to tap: it's a picture
 * that plays; "Otra vez" plays it again.
 * Addition: the last number is the answer. Subtraction (always counting up, 9 − 4: from 4 to 9):
 * the fingers that rose are the answer. Past 10 a second pair of hands carries on (11–20).
 */
export function createFingerHint(plan: CountPlan, opts: { numbers?: boolean } = {}): FingerHint {
  let numbers = opts.numbers ?? true;
  const pairs: HandPair[] = Array.from({ length: plan.end > 10 ? 2 : 1 }, handPair);
  const text = h('div', { class: 'finger-text' }, fingerText(plan));
  if (plan.carryFinger) text.append(h('span', { class: 'carry-note' }, ' (1 es la que me llevo)'));
  const result = h('div', { class: 'finger-result' });
  const again = h('button', { class: 'finger-again', onclick: () => play() }, '↻ Otra vez');
  const el = h('div', { class: `finger-hint ${numbers ? '' : 'no-numbers'}` },
    text,
    h('div', { class: `hands-pairs ${pairs.length > 1 ? 'two-pairs' : ''}` }, ...pairs.map((p) => p.svg)),
    h('div', { class: 'finger-end' }, result, again),
  );

  let raised = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const isDone = () => raised >= plan.fingers;

  /** Finger n (1-based) shown as it is after `raised` steps. */
  function draw() {
    const last = plan.start + raised;
    for (let n = 1; n <= pairs.length * 10; n++) {
      const pair = pairs[Math.floor((n - 1) / 10)], i = (n - 1) % 10;
      if (n <= plan.start) pair.set(i, 'up', n);
      else if (n <= last) {
        const carry = plan.carryFinger && n === plan.start + 1;
        pair.set(i, carry ? 'carry' : 'new', n, isDone() && plan.kind === 'add' && n === last);
      } else pair.set(i, 'down', null);
    }
    const done = isDone();
    again.hidden = !done || plan.fingers === 0;
    // without the numbers she counts the fingers herself: the result would give the answer away
    if (!done || !numbers) result.replaceChildren();
    else if (plan.kind === 'add') result.replaceChildren(h('span', {}, '¡Has llegado al ', h('b', {}, String(plan.end)), '!'));
    else if (plan.fingers === 0) result.replaceChildren(`Ya estás en el ${plan.end}: has subido 0 dedos.`);
    else result.replaceChildren(h('span', {}, 'Has llegado al ', String(plan.end), '. Has subido ', h('b', {}, dedos(plan.fingers)), '.'));
  }

  function play() {
    clearTimeout(timer);
    raised = 0;
    draw();
    const step = () => {
      if (isDone()) return;
      raised++;
      draw();
      if (!isDone()) timer = setTimeout(step, STEP_MS);
    };
    if (!isDone()) timer = setTimeout(step, START_MS);
  }
  play();

  return {
    el,
    get done() { return isDone(); },
    showNumbers() {
      numbers = true;
      el.classList.remove('no-numbers');
      play();
    },
  };
}
