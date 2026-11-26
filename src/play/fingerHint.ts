import { h } from '../ui/dom';
import { handPair } from '../art/hands';
import type { CountPlan } from '../math/counting';

export interface FingerHint {
  el: HTMLElement;
  readonly done: boolean;
  /** The next hint: numbers over the fingers, and the count plays again with them. */
  showNumbers(): void;
}

const dedos = (n: number) => (n === 1 ? '1 dedo' : `${n} dedos`);

export function fingerText(plan: CountPlan): string {
  const goal = plan.kind === 'sub'
    ? `Luego sube un dedo por número hasta llegar al ${plan.end}.`
    : `Luego sube ${dedos(plan.fingers)}, uno por número.`;
  return `Di ${plan.start} en voz alta. ${goal}`;
}

export const START_MS = 1000;
export const STEP_MS = 850;

/**
 * The counting hint (design 2026-11-25, revision 5): counting on, as she does it. She says the
 * first number out loud (it is in a bubble; no fingers for it), then raises one finger per number
 * after it: 16 − 8 → "8", then 9 (1 finger), 10 (2 fingers) … 16. The fingers rise by themselves;
 * nothing to tap. The numbers over the fingers come with the next hint.
 * Addition (9 + 8): say 9, raise 8 fingers, the last number (17) is the answer.
 * Subtraction (16 − 8): say 8, count up to 16, the fingers that are up (8) are the answer.
 * It never needs more than two hands: at most 9 + a carried 1 fingers.
 */
export function createFingerHint(plan: CountPlan, opts: { numbers?: boolean } = {}): FingerHint {
  let numbers = opts.numbers ?? true;
  const pair = handPair();
  const text = h('div', { class: 'finger-text' }, fingerText(plan));
  if (plan.carryFinger) text.append(h('span', { class: 'carry-note' }, ' (el primer dedo es la que me llevo)'));
  const said = h('div', { class: 'said' }, h('span', { class: 'said-label' }, 'Di'), h('b', { class: 'said-num' }, String(plan.start)));
  const result = h('div', { class: 'finger-result' });
  const again = h('button', { class: 'finger-again', onclick: () => play() }, '↻ Otra vez');
  const el = h('div', { class: `finger-hint ${numbers ? '' : 'no-numbers'}` },
    text,
    h('div', { class: 'hands-pairs' }, said, pair.svg),
    h('div', { class: 'finger-end' }, result, again),
  );

  let raised = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const isDone = () => raised >= plan.fingers;

  /** Finger n (1-based) stands for the number start + n. */
  function draw() {
    const done = isDone();
    for (let n = 1; n <= 10; n++) {
      if (n > raised) { pair.set(n - 1, 'down', null); continue; }
      const carry = plan.carryFinger && n === 1;
      pair.set(n - 1, carry ? 'carry' : 'new', plan.start + n, done && plan.kind === 'add' && n === raised);
    }
    said.classList.toggle('now', raised === 0);
    again.hidden = !done || plan.fingers === 0;
    // without the numbers she counts the fingers herself: the result would give the answer away
    if (!done || !numbers) result.replaceChildren();
    else if (plan.kind === 'add') result.replaceChildren(h('span', {}, '¡Has llegado al ', h('b', {}, String(plan.end)), '!'));
    else if (plan.fingers === 0) result.replaceChildren(`Ya estás en el ${plan.end}: 0 dedos.`);
    else result.replaceChildren(h('span', {}, 'Has llegado al ', String(plan.end), '. Cuenta los dedos: ', h('b', {}, dedos(plan.fingers)), '.'));
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
