import { h, wait } from '../ui/dom';
import type { ColumnStep, Problem } from '../math/types';
import { displayMarks } from '../math/columns';
import { countPlan } from '../math/counting';
import type { SkillId } from '../progress/skills';
import { num, praise, type Clip } from '../audio/speech';
import { createLadder } from './ladder';
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

  // ── borrowing (subtraction) ──
  if (isSub && multi) {
    const b = ctx.stage('borrow');
    if (b === 1) {
      if (step.borrow) { await explainBorrow(ctx, step, topBefore); scored.borrow = 'watched'; }
    } else if (b === 2) {
      const needs = !!step.borrow;
      board.flash(place, 'top');
      fire(['arriba_hay', num(topBefore), 'y_abajo', num(step.bottom), 'llega_pregunta']);
      showNote(ctx, `Arriba hay ${topBefore} y abajo ${step.bottom}. ¿Llega?`);
      const ans = await askChoice(ctx, [['si', '¡Sí, llega!'], ['no', 'No llega']]);
      if ((ans === 'no') === needs) {
        scored.borrow = 'right';
        if (needs) {
          fire(['no_llega', 'toca_vecino']);
          showNote(ctx, '¡Eso es! No llega.');
          await waitTap(ctx, [place + 1, lender], '⬅ Toca el número de la izquierda');
          await animateBorrow(ctx, step);
        } else { fire(['si_llega']); showNote(ctx, '¡Eso es! Sí llega.'); }
      } else {
        scored.borrow = 'wrong';
        correct = false;
        if (needs) await explainBorrow(ctx, step, topBefore);
        else {
          showNote(ctx, `Arriba hay ${topBefore} y abajo ${step.bottom}: sí llega.`);
          await ctx.speak(['arriba_hay', num(topBefore), 'y_abajo', num(step.bottom), 'si_llega']);
        }
      }
    } else {
      borrowPending = !!step.borrow;
    }
  }

  if (carryOnly && !ctx.carryPlaced.has(place)) {
    await board.setCarry(place, true);
    ctx.carryPlaced.add(place);
  }

  // ── counting hint (design 2026-11-25) ──
  // The board starts clean. 💡 Pista, or a wrong answer, opens the counting ladder.
  const plan = () => countPlan(step, p.op, ctx.addStart, isSub ? undefined : ctx.carryPlaced.has(place));
  let hintOpen = false;
  let hintBeforeCheck = false;
  helperArea.append(h('button', { class: 'help-btn', onclick: () => input.push({ type: 'help' }) }, '💡 Pista'));
  const openHint = async () => {
    hintOpen = true;
    clearArea(ctx);
    if (trivial) {
      const zeroTop = !isSub && step.topDigit === 0 && step.bottom !== 0;
      const txt = carryOnly ? 'Y la que me llevo, la bajo.' : isSub ? 'Menos cero: se queda igual.' : zeroTop ? 'Cero más un número: se queda igual.' : 'Más cero: se queda igual.';
      helperArea.append(h('div', { class: 'helper' }, h('div', { class: 'helper-text big' }, txt)));
      return;
    }
    if (!isSub && multi && step.carryIn === 1 && !ctx.carryPlaced.has(place)) {
      // the count needs the carry she forgot: the app places it, unscored (review #7)
      await board.setCarry(place, true);
      ctx.carryPlaced.add(place);
    }
    helperArea.append(createLadder(plan()).el);
  };

  // ── entry ──
  let firstCheck = true;
  for (;;) {
    const e = await input.next();
    if (e.type === 'choice') continue;
    // A ✓ from before the pad was last cleared (double tap, tap during the voice) is stale (review #1).
    if (e.type === 'check' && e.value !== pad.value) continue;
    if (e.type === 'help') {
      if (borrowPending) {
        // At B3 the hint first points at where to borrow, so it never gives away the count (review #8).
        board.pointAt(lender);
        helperArea.querySelector('.tap-hint')?.remove();
        helperArea.append(h('div', { class: 'tap-hint' }, 'Arriba hay menos: toca el número de la izquierda ⬅'));
      } else if (!hintOpen) await openHint();
      continue;
    }
    if (e.type === 'tap') {
      if (isSub && multi && borrowPending) {
        if (e.place === place + 1 || e.place === lender) {
          await animateBorrow(ctx, step);
          borrowPending = false;
          scored.borrow = 'right';
          helperArea.querySelector('.tap-hint')?.remove();
        } else {
          board.wiggle(e.place);
          board.pointAt(lender);
        }
      } else if (isSub && multi && !step.borrow && e.place === place + 1 && b3) {
        board.wiggle(e.place);
        fire(['no_hace_falta']);
        showNote(ctx, 'Aquí no hace falta: arriba ya llega.');
      } else if (!isSub && multi && e.place === place && step.carryIn === 1 && !ctx.carryPlaced.has(place)) {
        await board.setCarry(place, true);
        ctx.carryPlaced.add(place);
        scored.carry = 'right';
        if (hintOpen) await openHint(); // recount with the carry
      }
      continue;
    }

    // a check
    const v = Number(e.value);
    if (firstCheck) hintBeforeCheck = hintOpen;
    const countScored = firstCheck && !trivial && !hintBeforeCheck;
    if (borrowPending) {
      scored.borrow = 'wrong';
      correct = false;
      firstCheck = false; // the app shows the borrow next, so it can't count for counting (review #6)
      await wrongFeedback(ctx, place);
      await explainBorrow(ctx, step, topBefore);
      borrowPending = false;
      await openHint();
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
        await openHint();
        continue;
      }
    }
    if (v === expected) {
      if (countScored) scored[fingerSkill] = 'right';
      break;
    }
    correct = false;
    if (countScored) scored[fingerSkill] = 'wrong';
    firstCheck = false;
    await wrongFeedback(ctx, place);
    if (!hintOpen) await openHint();
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
      showNote(ctx, `Escribo el ${step.write} y me llevo 1.`);
      await ctx.speak(['escribo_el', num(step.write), 'y_me_llevo_una']);
      board.writeAnswer(place, String(step.write));
      await board.setCarry(place + 1, true);
      await wait(1200); // time to read it before the next column
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
  showNote(ctx, '¡Casi! Prueba otra vez.');
  await ctx.speak(['casi']);
}

async function explainBorrow(ctx: PlayCtx, step: ColumnStep, topBefore: number) {
  ctx.board.flash(step.place, 'top');
  ctx.board.flash(step.place, 'bottom');
  showNote(ctx, `Arriba hay ${topBefore} y abajo ${step.bottom}. No llega: le pedimos 1 al vecino.`);
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
  clearArea(ctx);
  ctx.helperArea.append(h('div', { class: 'tap-hint' }, hint));
  for (;;) {
    const e = await ctx.input.next();
    if (e.type !== 'tap') continue;
    if (targets.includes(e.place)) break;
    ctx.board.wiggle(e.place);
  }
  ctx.board.pointAt(null);
  ctx.helperArea.querySelector('.tap-hint')?.remove();
}

async function askChoice(ctx: PlayCtx, options: [string, string][]): Promise<string> {
  ctx.pad.enable(false);
  const box = h('div', { class: 'choice-box' }, ...options.map(([v, label]) =>
    h('button', { class: `choice choice-${v}`, onclick: () => ctx.input.push({ type: 'choice', value: v }) }, label)));
  clearArea(ctx);
  ctx.helperArea.append(box);
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

/** A line of text in place of what the voice used to say. It stays until the next column. */
function showNote(ctx: PlayCtx, text: string) {
  let n = ctx.helperArea.querySelector('.flow-note');
  if (!n) {
    n = h('div', { class: 'flow-note' });
    ctx.helperArea.prepend(n);
  }
  n.textContent = text;
}

/** Empty the helper area but keep the note. */
function clearArea(ctx: PlayCtx) {
  const n = ctx.helperArea.querySelector('.flow-note');
  ctx.helperArea.replaceChildren(...(n ? [n] : []));
}
