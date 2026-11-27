import { h } from '../ui/dom';
import type { CountPlan } from '../math/counting';

export interface CountHint {
  el: HTMLElement;
  readonly done: boolean;
  /** The next hint: the group sizes and the sentence, and the dots play again with them. */
  showNumbers(): void;
}

export const START_MS = 900;
export const STEP_MS = 650;
const TEN_PAUSE_MS = 700;

/** How the added dots split: k to fill the first box to 10, rest in the second box. */
export function split(plan: CountPlan) {
  const crosses = plan.end > 10;
  const toTen = crosses ? 10 - plan.start : plan.fingers;
  return { crosses, toTen, rest: plan.fingers - toTen };
}

export function countText(plan: CountPlan): string {
  const { crosses } = split(plan);
  if (plan.kind === 'add') return `Tienes ${plan.start}. Pon ${plan.fingers} más${crosses ? ': primero llena el 10' : ''}.`;
  return `Tienes ${plan.start}. ¿Cuántos faltan para llegar a ${plan.end}?${crosses ? ' Primero llega al 10.' : ''}`;
}

function explain(plan: CountPlan): string {
  const { crosses, toTen, rest } = split(plan);
  if (plan.kind === 'add') {
    return crosses ? `Con ${toTen} llegas a 10. Quedan ${rest}: 10 y ${rest} son ${plan.end}.` : `${plan.start} y ${plan.fingers} son ${plan.end}.`;
  }
  if (plan.fingers === 0) return `Ya estás en el ${plan.end}: faltan 0.`;
  return crosses
    ? `Hasta el 10 faltan ${toTen}. Del 10 al ${plan.end} faltan ${rest}. ${toTen} y ${rest} son ${plan.fingers}.`
    : `Del ${plan.start} al ${plan.end} faltan ${plan.fingers}.`;
}

/**
 * The counting hint (design 2026-11-25, revision 6): "completar el 10" with marcos de 10, two boxes
 * of ten dots in rows of five. What she has is blue; what is added comes in orange, one dot at a
 * time, filling the first box to 10 before spilling into the second. Nothing to say out loud
 * while counting something else, and nothing to tap.
 * Addition 8 + 4: 8 blue, 2 orange make 10, 2 more: 12. Subtraction 12 − 8 counts up the same
 * way: 8 blue; how many orange to reach 12? 2 to the 10 and 2 more: 4.
 * Without numbers (the first time) she counts the dots herself; the next hint adds the group sizes
 * and the sentence.
 */
export function createTenFrameHint(plan: CountPlan, opts: { numbers?: boolean } = {}): CountHint {
  let numbers = opts.numbers ?? true;
  const { crosses, toTen, rest } = split(plan);
  const frames = Array.from({ length: crosses ? 2 : 1 }, () => {
    const dots = Array.from({ length: 10 }, () => h('span', { class: 'tf-dot' }));
    const tag = h('span', { class: 'tf-tag' });
    const add = h('span', { class: 'tf-add' });
    const box = h('div', { class: 'tf-frame' }, ...dots);
    return { dots, tag, add, el: h('div', { class: 'tf-box' }, h('div', { class: 'tf-top' }, tag), box, add), box };
  });
  const text = h('div', { class: 'count-text' }, countText(plan));
  if (plan.carryFinger) text.append(h('span', { class: 'carry-note' }, ' (el punto rosa es la que me llevo)'));
  const result = h('div', { class: 'count-result' });
  const again = h('button', { class: 'count-again', onclick: () => play() }, '↻ Otra vez');
  const el = h('div', { class: `count-hint ${numbers ? '' : 'no-numbers'}` },
    text,
    h('div', { class: 'tf-frames' }, ...frames.map((f) => f.el)),
    h('div', { class: 'count-end' }, result, again),
  );

  let added = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const isDone = () => added >= plan.fingers;

  function draw() {
    for (let n = 1; n <= frames.length * 10; n++) {
      const f = frames[Math.floor((n - 1) / 10)], dot = f.dots[(n - 1) % 10];
      const kind = n <= plan.start ? 'have'
        : n <= plan.start + added ? (plan.carryFinger && n === plan.start + 1 ? 'carry' : 'add')
          : '';
      dot.className = `tf-dot ${kind}`;
    }
    const firstFull = plan.start + added >= 10;
    frames[0].box.classList.toggle('full', firstFull);
    const done = isDone();
    // group sizes and the sentence only with numbers, and only once the dots are all there
    const show = numbers && done;
    frames[0].tag.textContent = show && firstFull ? '10' : '';
    frames[0].add.textContent = show && toTen > 0 ? `+${toTen}` : '';
    if (frames[1]) frames[1].add.textContent = show && rest > 0 ? `+${rest}` : '';
    again.hidden = !done || plan.fingers === 0;
    result.textContent = show ? explain(plan) : '';
  }

  function play() {
    clearTimeout(timer);
    added = 0;
    draw();
    const step = () => {
      if (isDone()) return;
      added++;
      draw();
      // a little pause when the first box is just full: "¡10!"
      const justTen = crosses && plan.start + added === 10;
      if (!isDone()) timer = setTimeout(step, justTen ? STEP_MS + TEN_PAUSE_MS : STEP_MS);
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
