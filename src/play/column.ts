import { h, wait } from '../ui/dom';
import { icon } from '../art/icons';
import type { ColumnStep, Problem } from '../math/types';
import { displayMarks } from '../math/columns';
import { countPlan } from '../math/counting';
import type { SkillId } from '../progress/skills';
import { num, praise, type Clip } from '../audio/speech';
import { createHelper } from './helper';
import { expectedEntry, type ColumnOutcome } from './scoring';
import type { Board } from './board';
import type { Pad } from './pad';
import { Aborted, type Input } from './input';

export interface PlayCtx {
  p: Problem;
  steps: ColumnStep[];
  board: Board;
  pad: Pad;
  input: Input;
  helperArea: HTMLElement;
  addStart: 'larger' | 'top';
  carryPlaced: Set<number>;
  stage(skill: SkillId): number;
  speak(clips: Clip[]): Promise<void>;
  petReact(ok: boolean): void;
}

/** One column, start to finish (spec §6–§8, §15). */
export async function runColumn(outer: PlayCtx, step: ColumnStep): Promise<ColumnOutcome> {
  // Once she leaves the sum (input destroyed) nothing more may be said (review #3).
  const ctx: PlayCtx = { ...outer, speak: (c) => (outer.input.alive ? outer.speak(c) : Promise.reject(new Aborted())) };
  const fire = (c: Clip[]) => { ctx.speak(c).catch(() => {}); };
  const { p, board, pad, input, helperArea } = ctx;
  input.flush();
  const place = step.place;
  const scored: ColumnOutcome['scored'] = {};
  let correct = true;
  board.setActive(p.single ? null : place);
  pad.clear();
  pad.glow(null);
  helperArea.replaceChildren();
  if (step.skip) return { correct, scored };
  pad.enable(true);

  const isSub = p.op === '-';
  const multi = !p.single;
  const fingerSkill: SkillId = isSub ? 'fingerSub' : 'fingerAdd';
  const carryStage = ctx.stage('carry');
  const expected = expectedEntry(step, carryStage, p.single);
  const topBefore = step.borrow ? step.borrow[step.borrow.length - 1].before : step.top;
  const carryOnly = !isSub && multi && step.topDigit === 0 && step.bottom === 0 && step.carryIn === 1;
  const trivial = step.trivial || carryOnly;
  let borrowPending = false;
  const lender = step.borrow ? step.borrow[0].place : place + 1;
  const b3 = isSub && multi && ctx.stage('borrow') >= 3;
  let opened = !b3;

  // ── borrowing (subtraction) ──
  if (isSub && multi) {
    const b = ctx.stage('borrow');
    if (b === 1) {
      if (step.borrow) { await explainBorrow(ctx, step, topBefore); scored.borrow = 'watched'; }
    } else if (b === 2) {
      const needs = !!step.borrow;
      board.flash(place, 'top');
      fire(['arriba_hay', num(topBefore), 'y_abajo', num(step.bottom), 'llega_pregunta']);
      const ans = await askChoice(ctx, [['si', '¡Sí, llega!'], ['no', 'No llega']]);
      if ((ans === 'no') === needs) {
        scored.borrow = 'right';
        if (needs) {
          fire(['no_llega', 'toca_vecino']);
          await waitTap(ctx, [place + 1, lender], '⬅ Toca el número de la izquierda');
          await animateBorrow(ctx, step);
        } else fire(['si_llega']);
      } else {
        scored.borrow = 'wrong';
        correct = false;
        if (needs) await explainBorrow(ctx, step, topBefore);
        else await ctx.speak(['arriba_hay', num(topBefore), 'y_abajo', num(step.bottom), 'si_llega']);
      }
    } else {
      borrowPending = !!step.borrow;
    }
  }

  if (carryOnly && !ctx.carryPlaced.has(place)) {
    await board.setCarry(place, true);
    ctx.carryPlaced.add(place);
  }

  // ── counting ──
  const fStage = ctx.stage(fingerSkill);
  const plan = () => countPlan(step, p.op, ctx.addStart, isSub ? undefined : ctx.carryPlaced.has(place));
  let helperShown = false;

  const helpButton = (small: boolean) => {
    helperArea.append(h('button', { class: `help-btn ${small ? 'small' : ''}`, onclick: () => input.push({ type: 'help' }) },
      icon('hand', small ? 32 : 48), small ? null : h('span', {}, '¿Ayuda?')));
  };
  const setupFinger = async (stage: number, force = false) => {
    helperArea.replaceChildren();
    helperShown = false;
    if (trivial) {
      if (stage <= 2) {
        const zeroTop = !isSub && step.topDigit === 0 && step.bottom !== 0;
        const clip = carryOnly ? 'baja_la_que_llevo' : isSub ? 'menos_cero' : zeroTop ? 'cero_mas' : 'mas_cero';
        const txt = carryOnly ? 'Y la que me llevo, la bajo.' : isSub ? 'Menos cero: se queda igual.' : zeroTop ? 'Cero más un número: se queda igual.' : 'Más cero: se queda igual.';
        helperArea.append(h('div', { class: 'helper' }, h('div', { class: 'helper-text big' }, txt)));
        await ctx.speak([clip]);
        if (stage === 1) pad.glow(String(expected));
      }
      return;
    }
    // At B3 every subtraction column looks the same until she acts, so the screen
    // never gives away whether a borrow is needed (review #8).
    if (borrowPending || (!opened && !force)) { helpButton(false); return; }
    if (stage >= 4 && !force) { helpButton(stage === 5); return; }
    if (stage === 1 && !isSub && multi && step.carryIn === 1 && !ctx.carryPlaced.has(place)) {
      // "Show me" needs the carry she forgot: the app places it, unscored (review #7).
      await board.setCarry(place, true);
      ctx.carryPlaced.add(place);
      await ctx.speak(['me_llevaba_una']);
    }
    const helper = createHelper(plan(), ctx.speak);
    helperArea.append(helper.el);
    helperShown = true;
    if (stage === 1) {
      if (scored[fingerSkill] === undefined) scored[fingerSkill] = 'watched';
      await helper.autoPlay();
      pad.glow(String(expected));
      await ctx.speak(['escribe_el', num(expected)]);
    } else if (stage === 2) {
      helper.interactive(true);
      await ctx.speak([...helper.instruction, 'toca_dedos']);
    } else {
      helper.interactive(false);
    }
  };
  await setupFinger(fStage);

  // ── entry ──
  let firstCheck = true;
  for (;;) {
    const e = await input.next();
    if (e.type === 'choice') continue;
    // A ✓ from before the pad was last cleared (double tap, tap during the voice) is stale (review #1).
    if (e.type === 'check' && e.value !== pad.value) continue;
    if (e.type === 'help') {
      if (borrowPending) {
        board.pointAt(lender);
        fire(['arriba_hay', num(topBefore), 'y_abajo', num(step.bottom), 'no_llega', 'toca_vecino']);
      } else if (!opened) {
        opened = true;
        await setupFinger(fStage);
      } else await setupFinger(2, true);
      continue;
    }
    if (e.type === 'tap') {
      if (isSub && multi && borrowPending) {
        if (e.place === place + 1 || e.place === lender) {
          await animateBorrow(ctx, step);
          borrowPending = false;
          opened = true;
          scored.borrow = 'right';
          await setupFinger(fStage);
        } else {
          board.wiggle(e.place);
          board.pointAt(lender);
        }
      } else if (isSub && multi && !step.borrow && e.place === place + 1 && b3) {
        board.wiggle(e.place);
        fire(['no_hace_falta']);
      } else if (!isSub && multi && e.place === place && step.carryIn === 1 && !ctx.carryPlaced.has(place)) {
        await board.setCarry(place, true);
        ctx.carryPlaced.add(place);
        scored.carry = 'right';
        if (helperShown) await setupFinger(Math.max(2, Math.min(fStage, 3)), true);
      }
      continue;
    }

    // a check
    const v = Number(e.value);
    if (borrowPending) {
      scored.borrow = 'wrong';
      correct = false;
      firstCheck = false; // the app shows the answer next, so it can't count for counting (review #6)
      await wrongFeedback(ctx, place);
      await explainBorrow(ctx, step, topBefore);
      borrowPending = false;
      opened = true;
      await setupFinger(1, true);
      continue;
    }
    if (!isSub && multi && step.carryIn === 1 && !ctx.carryPlaced.has(place)) {
      ctx.carryPlaced.add(place);
      if (v === expected) {
        scored.carry = 'right';
        await board.setCarry(place, false);
      } else {
        scored.carry = 'wrong';
        correct = false;
        firstCheck = false;
        await wrongFeedback(ctx, place);
        await board.setCarry(place, true);
        await setupFinger(1, true);
        continue;
      }
    }
    if (v === expected) {
      if (firstCheck && !trivial && fStage > 1) scored[fingerSkill] = 'right';
      break;
    }
    correct = false;
    if (firstCheck && !trivial && fStage > 1) scored[fingerSkill] = 'wrong';
    firstCheck = false;
    await wrongFeedback(ctx, place);
    opened = true;
    await setupFinger(1, true);
  }

  // ── correct ──
  pad.clear();
  pad.glow(null);
  pad.enable(false); // nothing she types now may land in this column (review #4)
  board.writeAnswer(place, String(expected));
  ctx.petReact(true);
  helperArea.replaceChildren();
  if (!isSub && multi && step.carryOut) {
    if (carryStage === 1) {
      await ctx.speak(['escribo_el', num(step.write), 'y_me_llevo_una']);
      board.writeAnswer(place, String(step.write));
      await board.setCarry(place + 1, true);
      ctx.carryPlaced.add(place + 1);
      scored.carry = 'watched';
    } else if (carryStage === 2) {
      fire(['la_que_te_llevas']);
      await waitTap(ctx, [place + 1], 'Pon la que te llevas arriba ⬆');
      await board.setCarry(place + 1, true);
      ctx.carryPlaced.add(place + 1);
      scored.carry = 'right';
    } else {
      fire([praise()]);
    }
  } else {
    await ctx.speak([praise()]);
  }
  return { correct, scored };
}

async function wrongFeedback(ctx: PlayCtx, place: number) {
  ctx.pad.clear();
  ctx.board.writeAnswer(place, '');
  ctx.petReact(false);
  await ctx.speak(['casi']);
}

async function explainBorrow(ctx: PlayCtx, step: ColumnStep, topBefore: number) {
  ctx.board.flash(step.place, 'top');
  ctx.board.flash(step.place, 'bottom');
  await ctx.speak(['arriba_hay', num(topBefore), 'y_abajo', num(step.bottom), 'no_llega']);
  ctx.board.pointAt(step.place + 1);
  await wait(400);
  await animateBorrow(ctx, step);
}

async function animateBorrow(ctx: PlayCtx, step: ColumnStep) {
  const marks = displayMarks(step.borrow!);
  ctx.board.pointAt(null);
  await ctx.board.applyMarks(marks, true, async (m, i) => {
    if (i === 0 && m.place > step.place + 1) await ctx.speak(['vecino_cero']);
    if (i === 0) await ctx.speak(['el', num(m.before), 'se_convierte', num(m.after)]);
    else if (i === marks.length - 1) await ctx.speak(['y_el', num(m.before), 'se_convierte', num(m.after)]);
    else if (m.before === 0 && m.after === 10) await ctx.speak(['cero_se_convierte_diez']);
    else if (m.before === 10 && m.after === 9) await ctx.speak(['diez_se_convierte_nueve']);
  });
}

async function waitTap(ctx: PlayCtx, targets: number[], hint = 'Toca aquí ⬆') {
  ctx.board.pointAt(targets[targets.length - 1]);
  ctx.helperArea.replaceChildren(h('div', { class: 'tap-hint' }, hint));
  for (;;) {
    const e = await ctx.input.next();
    if (e.type !== 'tap') continue;
    if (targets.includes(e.place)) break;
    ctx.board.wiggle(e.place);
  }
  ctx.board.pointAt(null);
  ctx.helperArea.replaceChildren();
}

async function askChoice(ctx: PlayCtx, options: [string, string][]): Promise<string> {
  ctx.pad.enable(false);
  const box = h('div', { class: 'choice-box' }, ...options.map(([v, label]) =>
    h('button', { class: `choice choice-${v}`, onclick: () => ctx.input.push({ type: 'choice', value: v }) }, label)));
  ctx.helperArea.replaceChildren(box);
  try {
    for (;;) {
      const e = await ctx.input.next();
      if (e.type === 'choice') return e.value;
    }
  } finally {
    ctx.pad.enable(true);
    box.remove();
  }
}
