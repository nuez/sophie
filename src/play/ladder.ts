import { h } from '../ui/dom';
import { handsSvg, type FingerState } from '../art/hands';
import { icon } from '../art/icons';
import type { CountPlan } from '../math/counting';

export interface Ladder {
  el: HTMLElement;
  readonly done: boolean;
}

const dedos = (n: number) => (n === 1 ? '1 dedo' : `${n} dedos`);

export function ladderText(plan: CountPlan): string {
  const goal = plan.kind === 'sub' ? `Sube hasta el ${plan.end}.` : `Sube ${dedos(plan.fingers)}.`;
  return `Empieza en el ${plan.start} con 0 dedos. ${goal}`;
}

/**
 * The counting hint (design 2026-11-25): always counting up. Each number sits over how many
 * fingers are up when you say it; she taps ➜ for the next step. The hands are only a picture.
 * Subtraction: count up to the top number, the answer is the fingers.
 * Addition: raise as many fingers as the small number, the answer is the number reached.
 */
export function createLadder(plan: CountPlan): Ladder {
  let raised = 0;
  const text = h('div', { class: 'ladder-text' }, ladderText(plan));
  if (plan.carryFinger) text.append(h('span', { class: 'carry-note' }, ' (1 es la que me llevo)'));
  const rungs = h('div', { class: 'ladder-rungs' });
  const handsBox = h('div', { class: 'hands-box' });
  const next = h('button', { class: 'ladder-next big', 'aria-label': 'Siguiente', onclick: () => { if (raised < plan.fingers) { raised++; draw(); } } }, '➜');
  const result = h('div', { class: 'ladder-result' });
  const el = h('div', { class: 'ladder' }, text, rungs, h('div', { class: 'ladder-row' }, handsBox, next), result);

  function draw() {
    const done = raised >= plan.fingers;
    const last = plan.fingers;
    rungs.replaceChildren(
      h('div', { class: 'rung-head' }, h('span', {}, 'número'), h('span', {}, 'dedos')),
      // Only the steps she has reached: empty boxes ahead could be counted, and give the answer away.
      // The goal is in the sentence above ("Sube hasta el 9" / "Sube 4 dedos").
      ...Array.from({ length: raised + 1 }, (_, i) => {
        const goal = done && i === last;
        const carry = plan.carryFinger && i === 1;
        const answerNum = goal && plan.kind === 'add';
        const answerCount = goal && plan.kind === 'sub';
        return h('div', { class: `rung lit ${i === raised ? 'now' : ''} ${goal ? 'goal' : ''} ${carry ? 'carry' : ''}` },
          h('span', { class: `rung-num ${answerNum ? 'answer-mark' : ''}` }, String(plan.start + i)),
          h('span', { class: `rung-count ${answerCount ? 'answer-mark' : ''}` }, String(i)),
          goal && plan.kind === 'sub' ? h('span', { class: 'rung-flag' }, icon('flag', 20)) : null,
        );
      }),
    );
    const states: FingerState[] = Array.from({ length: 10 }, (_, i) => {
      if (i < raised) return plan.carryFinger && i === 0 ? 'carry' : 'up';
      if (plan.kind === 'add' && i < plan.fingers) return plan.carryFinger && i === 0 ? 'ghostCarry' : 'ghost';
      return 'down';
    });
    handsBox.replaceChildren(handsSvg(states, []));
    next.hidden = done;
    if (!done) result.replaceChildren();
    else if (plan.kind === 'sub') {
      result.replaceChildren(plan.fingers === 0
        ? `Ya estás en el ${plan.end}: 0 dedos.`
        : h('span', {}, 'Has llegado al ', String(plan.end), ' con ', h('b', {}, dedos(plan.fingers)), '.'));
    } else {
      result.replaceChildren(h('span', {}, '¡Has llegado al ', h('b', {}, String(plan.end)), '!'));
    }
  }
  draw();

  return { el, get done() { return raised >= plan.fingers; } };
}
