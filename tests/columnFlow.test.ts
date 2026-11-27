import { describe, it, expect } from 'vitest';
import { runColumn, type PlayCtx } from '../src/play/column';
import { Input } from '../src/play/input';
import { solve } from '../src/math/columns';
import type { BorrowMark, Problem } from '../src/math/types';

function fakePad() {
  return { el: document.createElement('div'), value: '', enabled: true, glows: [] as (string | null)[],
    clear() { this.value = ''; }, set(v: string) { this.value = v; }, glow(d: string | null) { this.glows.push(d); }, enable(on: boolean) { this.enabled = on; } };
}
function fakeBoard() {
  return { el: document.createElement('div'), marks: [] as BorrowMark[], carries: [] as number[], columns: false,
    setActive() {}, showColumns() { this.columns = true; }, async applyMarks(m: BorrowMark[]) { this.marks.push(...m); }, async setCarry(p: number) { this.carries.push(p); },
    hasCarry: () => false, writeAnswer() {}, pointAt() {}, wiggle() {}, flash() {}, onTap() {} };
}

function makeCtx(p: Problem) {
  const ctx = {
    p, steps: solve(p), board: fakeBoard() as any, pad: fakePad() as any, input: new Input(),
    helperArea: document.createElement('div'), addStart: 'larger' as const,
    carryPlaced: new Set<number>(), marksShown: new Set<number>(), columnsShown: false, petReact() {},
  } satisfies PlayCtx;
  return ctx;
}
type Ctx = ReturnType<typeof makeCtx>;
const check = (ctx: Ctx, v: string) => { ctx.pad.value = v; ctx.input.push({ type: 'check', value: v }); };
const help = (ctx: Ctx) => ctx.input.push({ type: 'help' });
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const add = (top: number, bottom: number): Problem => ({ op: '+', top, bottom, level: 7, single: false, review: false });
const sub = (top: number, bottom: number, level = 9): Problem => ({ op: '-', top, bottom, level, single: false, review: false });
const single = (p: Problem) => ({ ...p, single: true });
const btn = (ctx: Ctx) => ctx.helperArea.querySelector<HTMLButtonElement>('.help-btn')!;
const note = (ctx: Ctx) => ctx.helperArea.querySelector('.flow-note')?.textContent ?? '';
const hands = (ctx: Ctx) => ctx.helperArea.querySelector('.count-hint');
const helps = async (ctx: Ctx, n: number) => { for (let i = 0; i < n; i++) { help(ctx); await tick(); } };

describe('runColumn', () => {
  it('ignores a stale double ✓ from the previous column', async () => {
    const ctx = makeCtx(add(23, 14));
    const units = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '7');
    ctx.input.push({ type: 'check', value: '7' }); // second tap, same value
    expect((await units).correct).toBe(true);
    const tens = runColumn(ctx, ctx.steps[1]);
    await tick();
    check(ctx, '3');
    const t = await tens;
    expect(t.correct).toBe(true);
    expect(t.scored.fingerAdd).toBe('right');
  });

  it('disables the pad once a column is accepted', async () => {
    const ctx = makeCtx(add(23, 14));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '7');
    await run;
    expect(ctx.pad.enabled).toBe(false);
  });

  it('starts clean: a Pista button, nothing crossed out, no hands', async () => {
    const ctx = makeCtx(sub(32, 5));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    expect(btn(ctx).textContent).toContain('Pista');
    expect(ctx.board.marks).toEqual([]);
    expect(ctx.helperArea.querySelector('.hands')).toBeNull();
    ctx.input.destroy();
    await run.catch(() => {});
  });

  it('borrow column: columns, then hands, then their numbers, then the crossing out', async () => {
    const ctx = makeCtx(sub(32, 5));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    expect(ctx.board.columns).toBe(false);
    await helps(ctx, 1);
    expect(ctx.board.columns).toBe(true);
    expect(note(ctx)).toContain('unidades');
    expect(hands(ctx)).toBeNull();
    expect(btn(ctx).textContent).toContain('Otra pista');
    await helps(ctx, 1);
    expect(ctx.helperArea.querySelector('.count-text')!.textContent).toContain('Tienes 5. ¿Cuántos faltan para llegar a 12?');
    expect(hands(ctx)!.classList.contains('no-numbers')).toBe(true);
    expect(note(ctx)).toContain('el 2 se convierte en 12');
    expect(ctx.board.marks).toEqual([]);
    await helps(ctx, 1);
    expect(hands(ctx)!.classList.contains('no-numbers')).toBe(false);
    expect(ctx.board.marks).toEqual([]);
    await helps(ctx, 1);
    expect(ctx.board.marks.map((m: BorrowMark) => m.after)).toEqual([2, 12]);
    expect(btn(ctx).hidden).toBe(true);
    check(ctx, '7');
    const out = await run;
    expect(out.scored.borrow).toBeUndefined();
  });

  it('the columns are shown once per sum: the next column starts with the hands', async () => {
    const ctx = makeCtx(add(23, 14));
    const units = runColumn(ctx, ctx.steps[0]);
    await helps(ctx, 1);
    expect(ctx.board.columns).toBe(true);
    check(ctx, '7');
    await units;
    const tens = runColumn(ctx, ctx.steps[1]);
    await helps(ctx, 1);
    expect(hands(ctx)).not.toBeNull();
    check(ctx, '3');
    await tens;
  });

  it('each wrong answer opens the next hint', async () => {
    const ctx = makeCtx(sub(32, 5));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '3');
    await tick();
    expect(note(ctx)).toContain('Casi');
    expect(ctx.board.columns).toBe(true);
    check(ctx, '4');
    await tick();
    expect(hands(ctx)).not.toBeNull();
    check(ctx, '5');
    await tick();
    expect(hands(ctx)!.classList.contains('no-numbers')).toBe(false);
    check(ctx, '6');
    await tick();
    expect(ctx.board.marks.length).toBeGreaterThan(0);
    check(ctx, '7');
    const out = await run;
    expect(out.correct).toBe(false);
    expect(out.scored.borrow).toBe('wrong');
    expect(ctx.pad.glows.filter(Boolean)).toEqual([]);
  });

  it('she can cross out herself by tapping the neighbour, as at school', async () => {
    const ctx = makeCtx(sub(32, 5));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    ctx.input.push({ type: 'tap', place: 1, row: 'top' });
    await tick();
    expect(ctx.board.marks.map((m: BorrowMark) => m.after)).toEqual([2, 12]);
    check(ctx, '7');
    const out = await run;
    expect(out.scored.borrow).toBe('right');
  });

  it('the next column: Pista 2 writes the borrow she did not write', async () => {
    const ctx = makeCtx(sub(32, 5));
    const units = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '7');
    await units;
    const tens = runColumn(ctx, ctx.steps[1]);
    await helps(ctx, 2);
    expect(note(ctx)).toContain('Ahora es 2');
    await helps(ctx, 1);
    expect(ctx.board.marks.map((m: BorrowMark) => m.after)).toEqual([2, 12]);
    check(ctx, '2');
    await tens;
  });

  it('carry column: 2 is accepted and leaves the carry to her', async () => {
    const ctx = makeCtx(add(27, 15));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '2');
    await run;
    expect(ctx.board.carries).toEqual([]);
  });

  it('carry column: 12 is accepted too, and the 1 goes on the next column', async () => {
    const ctx = makeCtx(add(27, 15));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '12');
    expect((await run).correct).toBe(true);
    expect(ctx.board.carries).toEqual([1]);
    expect(ctx.carryPlaced.has(1)).toBe(true);
  });

  it('carry column: the last hint writes the carried 1', async () => {
    const ctx = makeCtx(add(27, 15));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    await helps(ctx, 3);
    expect(ctx.board.carries).toEqual([]);
    await helps(ctx, 1);
    expect(note(ctx)).toContain('escribe el 2 y me llevo 1');
    expect(ctx.board.carries).toEqual([1]);
    check(ctx, '2');
    await run;
  });

  it('receiving column: the dots count the carry; Pista 2 writes it above', async () => {
    const ctx = makeCtx(add(27, 15));
    const units = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '2');
    await units;
    const tens = runColumn(ctx, ctx.steps[1]);
    await helps(ctx, 2);
    expect(ctx.helperArea.querySelector('.count-text')!.textContent).toContain('Tienes 2. Pon 2 más');
    await helps(ctx, 2);
    expect(ctx.board.carries).toEqual([1]);
    check(ctx, '4');
    const out = await tens;
    expect(out.scored.carry).toBeUndefined();
  });

  it('receiving column right on her own scores carry and counting as right', async () => {
    const ctx = makeCtx(add(27, 15));
    const units = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '2');
    await units;
    const tens = runColumn(ctx, ctx.steps[1]);
    await tick();
    check(ctx, '4');
    const out = await tens;
    expect(out.scored).toEqual({ fingerAdd: 'right', carry: 'right' });
  });

  it('0 + N: the hint is a "se queda igual" note, not a count', async () => {
    const ctx = makeCtx(add(30, 25));
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    await helps(ctx, 2);
    expect(ctx.helperArea.textContent).toContain('se queda igual');
    expect(btn(ctx).hidden).toBe(true);
    expect(ctx.helperArea.querySelector('.count-hint')).toBeNull();
    check(ctx, '5');
    expect((await run).scored.fingerAdd).toBeUndefined();
  });

  it('single column: no columns hint; the hands, then their numbers, then the button goes', async () => {
    const ctx = makeCtx(single(sub(9, 4, 2)));
    const run = runColumn(ctx, solve(ctx.p)[0]);
    await tick();
    await helps(ctx, 1);
    expect(ctx.board.columns).toBe(false);
    expect(hands(ctx)!.classList.contains('no-numbers')).toBe(true);
    expect(btn(ctx).hidden).toBe(false);
    await helps(ctx, 1);
    expect(hands(ctx)!.classList.contains('no-numbers')).toBe(false);
    expect(btn(ctx).hidden).toBe(true);
    check(ctx, '5');
    expect((await run).scored.fingerSub).toBeUndefined();
  });
});
