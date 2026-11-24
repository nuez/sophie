import { h, wait } from '../ui/dom';
import { handsSvg, type FingerState } from '../art/hands';
import { icon } from '../art/icons';
import type { CountPlan } from '../math/counting';
import { dedos, levanta, num, type Clip } from '../audio/speech';

export interface Helper {
  el: HTMLElement;
  instruction: Clip[];
  autoPlay(): Promise<void>;
  /** She taps; `voice` says each number (stage 2), silent otherwise (stage 3). */
  interactive(voice: boolean): void;
}

export function instructionClips(plan: CountPlan): Clip[] {
  if (plan.kind === 'sub') return ['empieza_en', num(plan.start), 'cuenta_hasta', num(plan.end)];
  return ['empieza_en', num(plan.start), levanta(plan.fingers)];
}

export function instructionText(plan: CountPlan): string {
  if (plan.kind === 'sub') return `Empieza en el ${plan.start}. Cuenta hasta el ${plan.end}.`;
  const f = plan.fingers === 1 ? '1 dedo' : `${plan.fingers} dedos`;
  return `Empieza en el ${plan.start}. Levanta ${f}.`;
}

/** Hands + number track for one column (spec §6). */
export function createHelper(plan: CountPlan, speak: (c: Clip[]) => Promise<void>): Helper {
  let raised = 0;
  let labels = true;
  let onTap: (() => void) | null = null;
  const text = h('div', { class: 'helper-text' }, instructionText(plan));
  if (plan.carryFinger) text.append(h('span', { class: 'carry-note' }, ' (uno es la que me llevo)'));
  const track = h('div', { class: 'track' });
  const handsBox = h('div', { class: 'hands-box' });
  const again = h('button', { class: 'icon-btn again', 'aria-label': 'Otra vez', onclick: () => { raised = 0; draw(); } }, '↺');
  const el = h('div', { class: 'helper' }, text, track, h('div', { class: 'hands-row' }, handsBox, again));

  const states = (): FingerState[] => Array.from({ length: 10 }, (_, i) => {
    if (i < raised) return plan.carryFinger && i === 0 ? 'carry' : 'up';
    if (plan.kind === 'add' && i < plan.fingers) return plan.carryFinger && i === 0 ? 'ghostCarry' : 'ghost';
    return 'down';
  });

  function draw() {
    track.replaceChildren(
      h('span', { class: 'chip start' }, String(plan.start)),
      ...plan.numbers.map((n, i) => {
        const lit = i < raised;
        const showNum = plan.kind === 'sub' || lit;
        const last = i === plan.numbers.length - 1;
        return h('span', { class: `chip ${lit ? 'lit' : ''} ${plan.kind === 'add' && !lit ? 'empty' : ''} ${last && plan.kind === 'sub' ? 'goal' : ''}` },
          showNum ? String(n) : '', last && plan.kind === 'sub' ? icon('flag', 22) : null);
      }),
    );
    const svg = handsSvg(states(), labels ? plan.numbers.map((n, i) => (i < raised ? n : null)) : []);
    svg.addEventListener('pointerdown', () => onTap?.());
    handsBox.replaceChildren(svg);
    again.style.visibility = onTap && raised > 0 ? 'visible' : 'hidden';
  }
  draw();

  return {
    el,
    instruction: instructionClips(plan),
    async autoPlay() {
      onTap = null;
      raised = 0;
      draw();
      await speak(instructionClips(plan));
      if (plan.fingers === 0) { if (plan.kind === 'sub') await speak(['iguales']); return; }
      for (let i = 0; i < plan.fingers; i++) {
        raised = i + 1;
        draw();
        await speak([num(plan.numbers[i])]);
        await wait(180);
      }
      await speak([plan.kind === 'sub' ? dedos(plan.fingers) : num(plan.end)]);
    },
    interactive(voice) {
      labels = voice;
      raised = 0;
      onTap = () => {
        if (raised >= plan.fingers) return;
        raised++;
        draw();
        if (voice) speak([num(plan.numbers[raised - 1])]).catch(() => {});
      };
      draw();
    },
  };
}
