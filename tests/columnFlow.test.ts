import { describe, it, expect, vi } from 'vitest';
import { runColumn, type PlayCtx } from '../src/play/column';
import { Input, Aborted } from '../src/play/input';
import { solve } from '../src/math/columns';
import type { Problem } from '../src/math/types';
import type { SkillId } from '../src/progress/skills';
import { setVoiceSettings } from '../src/audio/speech';

setVoiceSettings({ voice: false, rate: 1 });

function fakePad() {
  return { el: document.createElement('div'), value: '', enabled: true,
    clear() { this.value = ''; }, set(v: string) { this.value = v; }, glow() {}, enable(on: boolean) { this.enabled = on; } };
}
function fakeBoard() {
  return { el: document.createElement('div'), taps: [] as number[], wiggled: [] as number[], pointed: [] as (number | null)[],
    setActive() {}, async applyMarks() {}, async setCarry() {}, hasCarry: () => false, writeAnswer() {},
    pointAt(p: number | null) { this.pointed.push(p); }, wiggle(p: number) { this.wiggled.push(p); }, flash() {}, onTap() {} };
}

function makeCtx(p: Problem, stages: Partial<Record<SkillId, number>>, speak = vi.fn(async () => {})) {
  const ctx = {
    p, steps: solve(p), board: fakeBoard() as any, pad: fakePad() as any, input: new Input(),
    helperArea: document.createElement('div'), addStart: 'larger' as const, carryPlaced: new Set<number>(),
    stage: (k: SkillId) => stages[k] ?? 2, speak, petReact() {},
  } satisfies PlayCtx;
  return ctx;
}
const check = (ctx: ReturnType<typeof makeCtx>, v: string) => { ctx.pad.value = v; ctx.input.push({ type: 'check', value: v }); };
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const add = (top: number, bottom: number): Problem => ({ op: '+', top, bottom, level: 7, single: false, review: false });
const sub = (top: number, bottom: number, level = 9): Problem => ({ op: '-', top, bottom, level, single: false, review: false });

describe('runColumn', () => {
  it('ignores a stale double ✓ from the previous column', async () => {
    const ctx = makeCtx(add(23, 14), { fingerAdd: 2, carry: 2 });
    const units = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '7');
    ctx.input.push({ type: 'check', value: '7' }); // second tap, same value
    const u = await units;
    expect(u.correct).toBe(true);
    const tens = runColumn(ctx, ctx.steps[1]);
    await new Promise((r) => setTimeout(r, 0));
    check(ctx, '3');
    const t = await tens;
    expect(t.correct).toBe(true);
    expect(t.scored.fingerAdd).toBe('right');
  });

  it('disables the pad once a column is accepted', async () => {
    const ctx = makeCtx(add(23, 14), { fingerAdd: 2 });
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    check(ctx, '7');
    await run;
    expect(ctx.pad.enabled).toBe(false);
  });

  it('B3: tapping the first non-zero digit (300 − 7, the 3) starts the borrow', async () => {
    const ctx = makeCtx(sub(300, 7, 12), { borrow: 3, fingerSub: 2 });
    const run = runColumn(ctx, ctx.steps[0]);
    await new Promise((r) => setTimeout(r, 0));
    ctx.input.push({ type: 'tap', place: 2, row: 'top' });
    await new Promise((r) => setTimeout(r, 0));
    check(ctx, '3');
    const out = await run;
    expect(out.scored.borrow).toBe('right');
    expect(out.correct).toBe(true);
  });

  it('B3: a wrong tap points at the digit to borrow from', async () => {
    const ctx = makeCtx(sub(32, 5), { borrow: 3, fingerSub: 2 });
    const run = runColumn(ctx, ctx.steps[0]);
    await new Promise((r) => setTimeout(r, 0));
    ctx.input.push({ type: 'tap', place: 0, row: 'top' });
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.board.pointed).toContain(1);
    ctx.input.push({ type: 'tap', place: 1, row: 'top' });
    await new Promise((r) => setTimeout(r, 0));
    check(ctx, '7');
    await run;
  });

  it('B3: ✓ without borrowing does not credit the finger skill afterwards', async () => {
    const ctx = makeCtx(sub(32, 5), { borrow: 3, fingerSub: 2 });
    const run = runColumn(ctx, ctx.steps[0]);
    await new Promise((r) => setTimeout(r, 0));
    check(ctx, '7');
    await new Promise((r) => setTimeout(r, 0));
    check(ctx, '7');
    const out = await run;
    expect(out.scored.borrow).toBe('wrong');
    expect(out.scored.fingerSub).not.toBe('right');
    expect(out.correct).toBe(false);
  });

  it('B3: borrow and no-borrow columns look the same before she acts (help button)', async () => {
    for (const [top, bottom] of [[32, 5], [38, 5]]) {
      const ctx = makeCtx(sub(top, bottom), { borrow: 3, fingerSub: 2 });
      const run = runColumn(ctx, ctx.steps[0]);
      await new Promise((r) => setTimeout(r, 0));
      expect(ctx.helperArea.querySelector('.help-btn')).not.toBeNull();
      expect(ctx.helperArea.querySelector('.hands-box')).toBeNull();
      ctx.input.destroy();
      await run.catch(() => {});
    }
  });

  it('C3: Pista on a column with a forgotten carry places it, and it is not scored as right', async () => {
    const ctx = makeCtx(add(57, 25), { carry: 3 });
    const units = runColumn(ctx, ctx.steps[0]);
    await tick(20);
    check(ctx, '2');
    await units;
    const run = runColumn(ctx, ctx.steps[1]);
    await tick();
    ctx.input.push({ type: 'help' });
    await tick(20);
    expect(ctx.carryPlaced.has(1)).toBe(true);
    expect(ctx.helperArea.querySelector('.ladder-text')!.textContent).toContain('Sube 3 dedos');
    check(ctx, '8');
    const out = await run;
    expect(out.scored.carry).not.toBe('right');
  });

  it('0 + N with no carry: the hint is a "se queda igual" note, not a count to zero', async () => {
    const ctx = makeCtx(add(30, 25), {});
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    ctx.input.push({ type: 'help' });
    await tick();
    expect(ctx.helperArea.textContent).toContain('se queda igual');
    expect(ctx.helperArea.querySelector('.ladder')).toBeNull();
    check(ctx, '5');
    const out = await run;
    expect(out.scored.fingerAdd).toBeUndefined();
  });

  it('starts clean: only the Pista button, no hands or ladder', async () => {
    const ctx = makeCtx(sub(9, 4, 2), {});
    ctx.p.single = true;
    const run = runColumn(ctx, solve(ctx.p)[0]);
    await tick();
    expect(ctx.helperArea.querySelector('.help-btn')!.textContent).toContain('Pista');
    expect(ctx.helperArea.querySelector('.hands')).toBeNull();
    ctx.input.destroy();
    await run.catch(() => {});
  });

  it('Pista opens the ladder; then a right answer is not scored as done alone', async () => {
    const ctx = makeCtx(sub(9, 4, 2), {});
    ctx.p.single = true;
    const run = runColumn(ctx, solve(ctx.p)[0]);
    await tick();
    ctx.input.push({ type: 'help' });
    await tick();
    expect(ctx.helperArea.querySelector('.ladder')).not.toBeNull();
    check(ctx, '5');
    const out = await run;
    expect(out.correct).toBe(true);
    expect(out.scored.fingerSub).toBeUndefined();
  });

  it('right on the first ✓ without the hint counts as done alone', async () => {
    const ctx = makeCtx(sub(9, 4, 2), {});
    ctx.p.single = true;
    const run = runColumn(ctx, solve(ctx.p)[0]);
    await tick();
    check(ctx, '5');
    expect((await run).scored.fingerSub).toBe('right');
  });

  it('a wrong answer opens the ladder by itself, and lights no key', async () => {
    const ctx = makeCtx(sub(9, 4, 2), {});
    ctx.p.single = true;
    const glows: (string | null)[] = [];
    ctx.pad.glow = (d: string | null) => { glows.push(d); };
    const run = runColumn(ctx, solve(ctx.p)[0]);
    await tick();
    check(ctx, '6');
    await tick();
    expect(ctx.helperArea.querySelector('.ladder')).not.toBeNull();
    check(ctx, '5');
    const out = await run;
    expect(out.scored.fingerSub).toBe('wrong');
    expect(out.correct).toBe(false);
    expect(glows.filter(Boolean)).toEqual([]);
  });

  it('says in writing what the voice used to say: a wrong answer', async () => {
    const ctx = makeCtx(sub(9, 4, 2), {});
    ctx.p.single = true;
    const run = runColumn(ctx, solve(ctx.p)[0]);
    await tick();
    check(ctx, '6');
    await tick();
    expect(ctx.helperArea.querySelector('.flow-note')!.textContent).toContain('Casi');
    check(ctx, '5');
    await run;
  });

  it('B2 asks "¿llega?" in writing', async () => {
    const ctx = makeCtx(sub(32, 5), { borrow: 2 });
    const run = runColumn(ctx, ctx.steps[0]);
    await tick();
    expect(ctx.helperArea.querySelector('.flow-note')!.textContent).toBe('Arriba hay 2 y abajo 5. ¿Llega?');
    expect(ctx.helperArea.querySelector('.choice-box')).not.toBeNull();
    ctx.input.destroy();
    await run.catch(() => {});
  });

  it('B1 explains the borrow in writing, and the note stays above the hint', async () => {
    const ctx = makeCtx(sub(32, 5), { borrow: 1 });
    const run = runColumn(ctx, ctx.steps[0]);
    await tick(500); // the explanation pauses 400 ms
    ctx.input.push({ type: 'help' });
    await tick();
    expect(ctx.helperArea.querySelector('.flow-note')!.textContent).toContain('Arriba hay 2 y abajo 5. No llega');
    expect(ctx.helperArea.querySelector('.ladder')).not.toBeNull();
    check(ctx, '7');
    await run;
  });

  it('stops talking once the sum is left (input destroyed)', async () => {
    const speak = vi.fn(async () => { await new Promise((r) => setTimeout(r, 5)); });
    const ctx = makeCtx(sub(19, 2, 2), { fingerSub: 1 }, speak);
    ctx.p.single = true;
    const steps = solve(ctx.p);
    const run = runColumn(ctx, steps[0]);
    await new Promise((r) => setTimeout(r, 12));
    ctx.input.destroy();
    const callsAtLeave = speak.mock.calls.length;
    await expect(run).rejects.toBeInstanceOf(Aborted);
    await new Promise((r) => setTimeout(r, 50));
    expect(speak.mock.calls.length).toBe(callsAtLeave);
  });
});
