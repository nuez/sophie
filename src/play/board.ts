import { h, wait } from '../ui/dom';
import { digitsOf } from '../math/columns';
import type { BorrowMark, ColumnStep, Problem } from '../math/types';

const PLACE_LABEL = ['U', 'D', 'C', 'UM', 'DM'];
const PLACE_CLASS = ['u', 'd', 'c', 'um', 'um'];

interface PlaceView {
  orig: number | null;
  crossed: boolean;
  above: string | null;
  plus10: boolean;
  tenCrossed: boolean;
  carry: boolean;
  topCell: HTMLElement;
  markCell: HTMLElement;
  bottomCell: HTMLElement;
  answerCell: HTMLElement;
  labelCell: HTMLElement;
}

export interface Board {
  el: HTMLElement;
  setActive(place: number | null): void;
  /** Pista 1: colour the columns and name them (U, D, C). The sum starts as plain digits. */
  showColumns(): void;
  applyMarks(marks: BorrowMark[], animate: boolean, between?: (m: BorrowMark, i: number) => Promise<void>): Promise<void>;
  setCarry(place: number, animate: boolean): Promise<void>;
  hasCarry(place: number): boolean;
  writeAnswer(place: number, text: string, kind?: 'normal' | 'ghost' | 'typing'): void;
  pointAt(place: number | null): void;
  wiggle(place: number): void;
  flash(place: number, row: 'top' | 'bottom'): void;
  onTap(cb: (place: number, row: 'top' | 'carry') => void): void;
}

/** The sum written in columns, school-style (spec §5, §7, §8). */
export function createBoard(p: Problem, steps: ColumnStep[]): Board {
  let tapCb: (place: number, row: 'top' | 'carry') => void = () => {};
  const el = h('div', { class: `board ${p.single ? 'single' : 'plain'}` });

  if (p.single) return singleBoard(p, el, (cb) => { tapCb = cb; }, () => tapCb);

  const n = steps.length;
  const top = digitsOf(p.top), bottom = digitsOf(p.bottom);
  el.style.setProperty('--cols', String(n));
  const views: PlaceView[] = [];
  const grid = h('div', { class: 'board-grid' });
  const rows = { label: [] as HTMLElement[], mark: [] as HTMLElement[], top: [] as HTMLElement[], bottom: [] as HTMLElement[], line: [] as HTMLElement[], answer: [] as HTMLElement[] };
  // first column: operator
  const opCell = (cls: string, text = '') => h('div', { class: `cell op ${cls}` }, text);
  rows.label.push(opCell('label'));
  rows.mark.push(opCell('mark'));
  rows.top.push(opCell('top'));
  rows.bottom.push(opCell('bottom sign', p.op === '+' ? '+' : '−'));
  rows.line.push(opCell('line'));
  rows.answer.push(opCell('answer'));
  for (let place = n - 1; place >= 0; place--) {
    const pc = `col-${PLACE_CLASS[place]}`;
    const labelCell = h('div', { class: `cell label ${pc}` }, PLACE_LABEL[place]);
    const markCell = h('div', { class: `cell mark ${pc}`, onpointerdown: () => tapCb(place, 'carry') });
    const topCell = h('div', { class: `cell top ${pc}`, onpointerdown: () => tapCb(place, 'top') });
    const bottomCell = h('div', { class: `cell bottom ${pc}` }, bottom[place] !== undefined ? String(bottom[place]) : '');
    const answerCell = h('div', { class: `cell answer ${pc}` });
    rows.label.push(labelCell); rows.mark.push(markCell); rows.top.push(topCell); rows.bottom.push(bottomCell);
    rows.line.push(h('div', { class: `cell line ${pc}` })); rows.answer.push(answerCell);
    views[place] = { orig: top[place] ?? null, crossed: false, above: null, plus10: false, tenCrossed: false, carry: false, topCell, markCell, bottomCell, answerCell, labelCell };
  }
  for (const r of Object.values(rows)) grid.append(...r);
  el.append(grid);
  views.forEach((_, i) => render(i));

  function render(place: number) {
    const v = views[place];
    if (!v) return;
    v.topCell.replaceChildren();
    if (v.orig !== null) {
      // a middle zero that became 10 and was then crossed out shows as a crossed "¹0"
      const d = h('span', { class: `digit ${v.crossed ? 'crossed' : ''}` }, ...(v.tenCrossed ? [h('span', { class: 'ten' }, '1'), String(v.orig)] : [String(v.orig)]));
      if (v.plus10 && !v.crossed) v.topCell.append(h('span', { class: 'ten' }, '1'));
      v.topCell.append(d);
    }
    v.markCell.replaceChildren();
    if (v.carry) v.markCell.append(h('span', { class: 'carry-one' }, '1'));
    if (v.above !== null) {
      const a = h('span', { class: 'above' });
      if (v.plus10) a.append(h('span', { class: 'ten' }, '1'));
      a.append(v.above);
      v.markCell.append(a);
    }
  }

  return {
    el,
    showColumns() { el.classList.remove('plain'); },
    setActive(place) {
      views.forEach((v, i) => {
        const on = i === place;
        for (const c of [v.labelCell, v.markCell, v.topCell, v.bottomCell, v.answerCell]) {
          c.classList.toggle('active', on);
          c.classList.toggle('dim', place !== null && !on);
        }
      });
    },
    async applyMarks(marks, animate, between) {
      for (let i = 0; i < marks.length; i++) {
        const m = marks[i];
        const v = views[m.place];
        if (between) await between(m, i);
        if (m.after === m.before + 10) v.plus10 = true;
        else if (v.plus10 && !v.crossed) { v.plus10 = false; v.tenCrossed = true; v.crossed = true; v.above = String(m.after); }
        else { v.above = String(m.after); v.crossed = true; }
        render(m.place);
        const target = m.after === m.before + 10 ? v.topCell : v.markCell;
        target.classList.add('pop');
        if (animate) await wait(700);
        target.classList.remove('pop');
      }
    },
    async setCarry(place, animate) {
      const v = views[place];
      if (!v) return;
      v.carry = true;
      render(place);
      v.markCell.classList.add('pop');
      if (animate) await wait(600);
      v.markCell.classList.remove('pop');
    },
    hasCarry: (place) => !!views[place]?.carry,
    writeAnswer(place, text, kind = 'normal') {
      const v = views[place];
      if (!v) return;
      v.answerCell.replaceChildren(h('span', { class: `ans ${kind}` }, text));
    },
    pointAt(place) {
      views.forEach((v, i) => v.labelCell.classList.toggle('point', i === place));
    },
    wiggle(place) {
      const v = views[place];
      if (!v) return;
      v.topCell.classList.remove('wiggle');
      void v.topCell.offsetWidth;
      v.topCell.classList.add('wiggle');
    },
    flash(place, row) {
      const v = views[place];
      if (!v) return;
      const c = row === 'top' ? v.topCell : v.bottomCell;
      c.classList.add('flash');
      setTimeout(() => c.classList.remove('flash'), 1400);
    },
    onTap(cb) { tapCb = cb; },
  };
}

function singleBoard(p: Problem, el: HTMLElement, setCb: (cb: any) => void, _get: () => any): Board {
  const topEl = h('div', { class: 'srow top' });
  if (p.top >= 10) topEl.append(h('span', { class: 'ten' }, String(Math.floor(p.top / 10))), String(p.top % 10));
  else topEl.append(String(p.top));
  const bottomEl = h('div', { class: 'srow bottom' }, h('span', { class: 'sign' }, p.op === '+' ? '+' : '−'), String(p.bottom));
  const answerEl = h('div', { class: 'srow answer' });
  el.append(h('div', { class: 'single-wrap' }, topEl, bottomEl, h('div', { class: 'sline' }), answerEl));
  return {
    el,
    setActive() {},
    showColumns() {},
    async applyMarks() {},
    async setCarry() {},
    hasCarry: () => false,
    writeAnswer(_place, text, kind = 'normal') { answerEl.replaceChildren(h('span', { class: `ans ${kind}` }, text)); },
    pointAt() {},
    wiggle() {},
    flash(_place, row) {
      const c = row === 'top' ? topEl : bottomEl;
      c.classList.add('flash');
      setTimeout(() => c.classList.remove('flash'), 1400);
    },
    onTap(cb) { setCb(cb); },
  };
}
