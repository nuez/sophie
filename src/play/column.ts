import { h } from '../ui/dom';
import type { ColumnStep, Problem } from '../math/types';
import { displayMarks } from '../math/columns';
import { countPlan } from '../math/counting';
import type { SkillId } from '../progress/skills';
import { createTenFrameHint, type CountHint } from './tenFrame';
import { acceptedEntries, type ColumnOutcome } from './scoring';
import type { Board } from './board';
import type { Pad } from './pad';
import type { Input } from './input';

export interface PlayCtx {
  p: Problem;
  steps: ColumnStep[];
  board: Board;
  pad: Pad;
  input: Input;
  helperArea: HTMLElement;
  addStart: 'larger' | 'top';
  /** Columns whose carried 1 is written on the board. */
  carryPlaced: Set<number>;
  /** Columns whose borrow (crossing out) is written on the board. */
  marksShown: Set<number>;
  /** The columns are coloured and named (Pista 1, once per sum). */
  columnsShown: boolean;
  petReact(ok: boolean): void;
}

type HintKind = 'columns' | 'count' | 'numbers' | 'marks';
const HINT_ORDER: HintKind[] = ['columns', 'count', 'numbers', 'marks'];

/**
 * One column (design 2026-11-25, rev. 4). She fills it in herself on a plain sum: no coloured
 * columns, nothing crossed out, no carry written. Each 💡 gives the next hint that applies:
 * the coloured columns with U/D/C (once per sum), the marcos de 10 (complete the 10), their
 * numbers, then the crossing out or the carried 1. A wrong answer opens the next hint by itself.
 */
export async function runColumn(ctx: PlayCtx, step: ColumnStep): Promise<ColumnOutcome> {
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
  const accepted = acceptedEntries(step, p.single);
  const carryOnly = !isSub && multi && step.topDigit === 0 && step.bottom === 0 && step.carryIn === 1;
  const trivial = step.trivial || carryOnly;
  const lender = step.borrow ? step.borrow[0].place : place + 1;
  const topBefore = step.borrow ? step.borrow[step.borrow.length - 1].before : step.top;

  // What Pista 2 would write: borrows not yet on the board (this column's and earlier ones),
  // or the carry this column receives or gives.
  const pendingBorrows = () => ctx.steps.filter((s) => s.place <= place && s.borrow && !ctx.marksShown.has(s.place));
  const carryInMissing = () => !isSub && multi && step.carryIn === 1 && !ctx.carryPlaced.has(place);
  const carryOutMissing = () => !isSub && multi && step.carryOut === 1 && !ctx.carryPlaced.has(place + 1);
  const hasMarksHint = () => (isSub && multi ? pendingBorrows().length > 0 : carryInMissing() || carryOutMissing());
  const applies = (k: HintKind) =>
    k === 'columns' ? multi && !ctx.columnsShown
      : k === 'count' ? true
        : k === 'numbers' ? !trivial
          : hasMarksHint();
  const given = new Set<HintKind>();
  const upcoming = () => HINT_ORDER.find((k) => !given.has(k) && applies(k));
  let countHint: CountHint | null = null;

  let hints = 0;
  const hintBtn = h('button', { class: 'help-btn', onclick: () => input.push({ type: 'help' }) }, '💡 Pista');
  const hintBox = h('div', { class: 'hint-box' });
  helperArea.append(hintBtn, hintBox);
  const refreshBtn = () => {
    hintBtn.textContent = hints === 0 ? '💡 Pista' : '💡 Otra pista';
    hintBtn.hidden = !upcoming();
  };

  const showBorrows = async (animate: boolean) => {
    for (const s of pendingBorrows()) {
      ctx.marksShown.add(s.place);
      await board.applyMarks(displayMarks(s.borrow!), animate);
    }
  };

  const showColumns = () => {
    ctx.columnsShown = true;
    board.showColumns();
    showNote(ctx, `Cada número va en su columna. Ahora estás en ${PLACE_NAME[place]}.`);
  };

  const count = () => {
    if (isSub && multi && step.top !== step.topDigit && pendingBorrows().length > 0) {
      // the count uses what is really on top now; say why, so the hint makes sense
      const why = step.borrow
        ? `Arriba hay ${topBefore} y abajo ${step.bottom}: no llega. Pide 1 al vecino: el ${topBefore} se convierte en ${step.top}.`
        : `Ojo: el ${step.topDigit} de arriba le dio 1 al vecino. Ahora es ${step.top}.`;
      showNote(ctx, why);
    }
    if (trivial) {
      const zeroTop = !isSub && step.topDigit === 0 && step.bottom !== 0;
      const txt = carryOnly ? 'Arriba no hay nada: solo la que me llevo, 1.' : isSub ? 'Menos cero: se queda igual.' : zeroTop ? 'Cero más un número: se queda igual.' : 'Más cero: se queda igual.';
      hintBox.replaceChildren(h('div', { class: 'helper-text big' }, txt));
      return;
    }
    countHint = createTenFrameHint(countPlan(step, p.op, ctx.addStart), { numbers: false });
    hintBox.replaceChildren(countHint.el);
  };

  const numbers = () => {
    // the dots are already there (the "count" hint always comes first): show the numbers
    (countHint as CountHint | null)?.showNumbers();
  };

  const marks = async () => {
    if (isSub) {
      showNote(ctx, 'Mira arriba: así se tacha.');
      await showBorrows(true);
    } else {
      if (carryInMissing()) {
        showNote(ctx, 'Mira arriba: es la que me llevo.');
        await board.setCarry(place, true);
        ctx.carryPlaced.add(place);
      }
      if (carryOutMissing()) {
        showNote(ctx, `Son ${step.total}: escribe el ${step.write} y me llevo 1.`);
        await board.setCarry(place + 1, true);
        ctx.carryPlaced.add(place + 1);
      }
    }
  };

  const nextHint = async () => {
    const k = upcoming();
    if (!k) return;
    hints++;
    given.add(k);
    if (k === 'columns') showColumns();
    else if (k === 'count') count();
    else if (k === 'numbers') numbers();
    else await marks();
    refreshBtn();
  };
  refreshBtn();

  // ── entry ──
  let firstCheck = true;
  let typedTotal = false;
  for (;;) {
    const e = await input.next();
    if (e.type === 'choice') continue;
    // A ✓ from before the pad was last cleared (double tap) is stale (review #1).
    if (e.type === 'check' && e.value !== pad.value) continue;
    if (e.type === 'help') { await nextHint(); continue; }
    if (e.type === 'tap') {
      // She can write the marks herself, as at school: tap the neighbour to borrow, or above to carry.
      if (isSub && multi && step.borrow && !ctx.marksShown.has(place) && (e.place === place + 1 || e.place === lender)) {
        await showBorrows(true);
        refreshBtn();
      } else if (!isSub && multi && e.row === 'carry' && e.place === place && carryInMissing()) {
        await board.setCarry(place, true);
        ctx.carryPlaced.add(place);
        refreshBtn();
      } else if (!isSub && multi && e.row === 'carry' && e.place === place + 1 && carryOutMissing()) {
        await board.setCarry(place + 1, true);
        ctx.carryPlaced.add(place + 1);
        refreshBtn();
      }
      continue;
    }

    // a check
    const v = Number(e.value);
    const alone = firstCheck && hints === 0;
    if (accepted.includes(v)) {
      typedTotal = multi && v === step.total && v !== step.write;
      if (alone) score(scored, step, isSub, multi, trivial, 'right');
      break;
    }
    if (alone) score(scored, step, isSub, multi, trivial, 'wrong');
    correct = false;
    firstCheck = false;
    pad.clear();
    board.writeAnswer(place, '');
    ctx.petReact(false);
    await nextHint();
    // keep what the hint just said, after the "¡Casi!"
    const said = (ctx.helperArea.querySelector('.flow-note')?.textContent ?? '').replace(CASI, '').trim();
    showNote(ctx, said ? `${CASI} ${said}` : CASI);
  }

  // ── correct ──
  pad.clear();
  pad.enable(false); // nothing she types now may land in this column (review #4)
  board.writeAnswer(place, String(p.single ? step.total : step.write));
  ctx.petReact(true);
  // She wrote 12 for 7 + 5: the 2 goes down, and she knows the 1 goes on, so put it there.
  if (typedTotal && carryOutMissing()) {
    await board.setCarry(place + 1, true);
    ctx.carryPlaced.add(place + 1);
  }
  helperArea.replaceChildren();
  return { correct, scored };
}

const CASI = '¡Casi! Prueba otra vez.';
const PLACE_NAME = ['las unidades (U)', 'las decenas (D)', 'las centenas (C)', 'las unidades de mil (UM)', 'las decenas de mil (DM)'];

/** Skills a column practises, scored only when she answered on her own the first time. */
function score(scored: ColumnOutcome['scored'], step: ColumnStep, isSub: boolean, multi: boolean, trivial: boolean, r: 'right' | 'wrong') {
  if (!trivial) scored[(isSub ? 'fingerSub' : 'fingerAdd') as SkillId] = r;
  if (isSub && multi && step.borrow) scored.borrow = r;
  if (!isSub && multi && step.carryIn) scored.carry = r;
}

/** A line of text above the hint (in place of the voice). It stays until the next column. */
function showNote(ctx: PlayCtx, text: string) {
  let n = ctx.helperArea.querySelector('.flow-note');
  if (!n) {
    n = h('div', { class: 'flow-note' });
    ctx.helperArea.prepend(n);
  }
  n.textContent = text;
}
