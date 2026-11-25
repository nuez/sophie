import { h } from '../ui/dom';
import { topbar } from '../ui/topbar';
import { icon } from '../art/icons';
import { petSvg, type Mood } from '../art/pets';
import { generate } from '../math/generator';
import { solve } from '../math/columns';
import { levelById } from '../math/levels';
import type { Problem } from '../math/types';
import { effectiveStage, type SkillId } from '../progress/skills';
import { capFor } from '../progress/levelProgress';
import { growth } from '../pet/petState';
import { say, type Clip } from '../audio/speech';
import { createBoard } from '../play/board';
import { createPad } from '../play/pad';
import { Aborted, Input } from '../play/input';
import { runColumn, type PlayCtx } from '../play/column';
import { applyOutcome, type ColumnOutcome } from '../play/scoring';
import { CONFIG } from '../config';
import { formatEuros } from '../money/money';
import type { Screen } from '../app';

let lastProblem: Problem | undefined;

export const playScreen: Screen = (root, app) => {
  const s = app.state;
  if (!s.pet) return app.go('choose');
  const input = new Input();
  let lastClips: Clip[] = [];
  const speak = (clips: Clip[]) => { lastClips = clips; return say(clips); };

  const tb = topbar(app, { home: true, onRepeat: () => say(lastClips), paws: s.careCounter });
  const levelTag = h('div', { class: 'level-tag' });
  const boardHolder = h('div', { class: 'board-holder' });
  const helperArea = h('div', { class: 'helper-area' });
  const padHolder = h('div', { class: 'pad-holder' });
  const petCorner = h('div', { class: 'pet-corner' });
  const overlay = h('div', { class: 'overlay hidden' });

  const drawPet = (mood: Mood) => petCorner.replaceChildren(petSvg(s.pet!.kind, { growth: growth(s.unlocked), mood, equipped: s.pet!.equipped }));
  let moodTimer: ReturnType<typeof setTimeout> | undefined;
  const petReact = (ok: boolean) => {
    drawPet(ok ? 'emocion' : 'abrazo');
    petCorner.classList.remove('jump', 'hug');
    void petCorner.offsetWidth;
    petCorner.classList.add(ok ? 'jump' : 'hug');
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => drawPet('feliz'), 1600);
  };
  drawPet('feliz');

  root.append(
    tb.el,
    h('main', { class: 'play' },
      h('section', { class: 'play-left' }, levelTag, boardHolder, helperArea),
      h('section', { class: 'play-right' }, petCorner, padHolder),
    ),
    overlay,
  );

  async function runSum() {
    const p = generate(s.current, { last: lastProblem, unlocked: s.unlocked });
    lastProblem = p;
    const steps = solve(p);
    const L = levelById(p.level);
    levelTag.replaceChildren(h('span', {}, `Nivel ${s.current}`), h('span', { class: 'lname' }, levelById(s.current).name));
    if (p.review) levelTag.append(h('span', { class: 'review' }, 'repaso'));

    const board = createBoard(p, steps);
    boardHolder.replaceChildren(board.el);
    board.onTap((place, row) => input.push({ type: 'tap', place, row }));
    let active = 0;
    const pad = createPad((v) => board.writeAnswer(active, v, 'typing'), (v) => input.push({ type: 'check', value: v }), 2);
    padHolder.replaceChildren(pad.el);

    const doneAtLevel = s.levels[p.level]?.done ?? 0;
    const ctx: PlayCtx = {
      p, steps, board, pad, input, helperArea,
      addStart: s.settings.addStart,
      carryPlaced: new Set(),
      stage: (k: SkillId) => effectiveStage(s.skills[k], capFor(L.id, doneAtLevel, k)),
      speak,
      petReact,
    };
    input.flush();
    await speak([p.op === '+' ? 'vamos_a_sumar' : 'vamos_a_restar']);
    const outcomes: ColumnOutcome[] = [];
    for (const step of steps) {
      active = step.place;
      outcomes.push(await runColumn(ctx, step));
    }
    board.setActive(null);
    pad.enable(false);
    let result!: ReturnType<typeof applyOutcome>;
    app.update((st) => { result = applyOutcome(st, p, outcomes); });
    tb.setMoney(s.cents);
    tb.setPaws(Math.min(s.careCounter, CONFIG.careEvery));
    await celebrate(result);
  }

  async function celebrate(r: ReturnType<typeof applyOutcome>) {
    const next = h('button', { class: 'big' }, 'Siguiente →');
    const box = h('div', { class: 'overlay-card' },
      h('div', { class: 'overlay-pet' }, petSvg(s.pet!.kind, { growth: growth(s.unlocked), mood: 'emocion', equipped: s.pet!.equipped })),
      h('h2', {}, r.unlocked ? '¡Nivel nuevo!' : '¡Lo has conseguido!'),
      r.cents ? h('div', { class: 'earned' }, icon('coin', 36), `+${formatEuros(r.cents)}`) : null,
      r.grew ? h('p', { class: 'grew' }, `¡${s.pet!.name} ha crecido!`) : null,
      next,
    );
    overlay.replaceChildren(box);
    overlay.classList.remove('hidden');
    const clips: Clip[] = ['lo_has_conseguido'];
    if (r.unlocked) clips.push('nivel_nuevo');
    if (r.grew) clips.push('ha_crecido');
    speak(clips);
    await new Promise<void>((resolve) => next.addEventListener('click', () => resolve(), { once: true }));
    overlay.classList.add('hidden');
    if (s.careCounter >= CONFIG.careEvery) {
      app.update((st) => { st.careCounter = 0; });
      app.go('care');
      throw new Aborted();
    }
  }

  (async () => {
    try {
      for (;;) await runSum();
    } catch (e) {
      if (!(e instanceof Aborted)) console.error(e);
    }
  })();

  return () => {
    input.destroy();
    clearTimeout(moodTimer);
  };
};
