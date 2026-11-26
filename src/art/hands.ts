import { svgEl } from '../ui/dom';

/** down = folded; up = already up at the start; new = raised while counting; carry = the carried 1. */
export type FingerState = 'down' | 'up' | 'new' | 'carry';

const SKIN = '#f6c9a8', LINE = '#d39470', NAIL = '#fde7da', SLEEVE = '#8fb8de', SLEEVE_DARK = '#6d97c0';

/** Pair width; the two thumbs point at each other with room for their numbers. */
export const PAIR_W = 330;
const PAIR_H = 232;
const TOP = 32; // room above the fingers for the numbers
const OX = 6;

// One left hand seen from the back, fingers up, thumb on the right (towards the other hand).
// k: 0 pinky, 1 ring, 2 middle, 3 index. bx/by = base, len, widths at base and tip, tilt in degrees.
const FINGERS = [
  { bx: 29, by: 86, len: 50, wb: 20, wt: 17, rot: -13 },
  { bx: 52, by: 80, len: 64, wb: 22, wt: 19, rot: -3 },
  { bx: 75, by: 78, len: 70, wb: 23, wt: 20, rot: 1 },
  { bx: 98, by: 80, len: 63, wb: 22, wt: 19, rot: 6 },
];
const THUMB = { bx: 108, by: 132, len: 54, wb: 26, wt: 21, rot: 35 };

/** A tapered finger pointing up from (bx, by), with its nail and knuckle lines. */
function fingerShape(f: { bx: number; by: number; len: number; wb: number; wt: number }) {
  const { bx, by, len, wb, wt } = f;
  const r = wt / 2, tip = by - len, base = by + 10;
  const d = `M ${bx - wb / 2} ${base} L ${bx - r} ${tip + r} A ${r} ${r} 0 0 1 ${bx + r} ${tip + r} L ${bx + wb / 2} ${base} Z`;
  return [
    svgEl('path', { d, fill: SKIN, stroke: LINE, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }),
    svgEl('rect', { class: 'nail', x: bx - wt * 0.32, y: tip + 3, width: wt * 0.64, height: wt * 0.8, rx: wt * 0.3, fill: NAIL, stroke: LINE, 'stroke-width': 1.2 }),
    svgEl('path', { class: 'crease', d: `M ${bx - wt * 0.28} ${tip + len * 0.42} q ${wt * 0.28} 3 ${wt * 0.56} 0 M ${bx - wt * 0.3} ${tip + len * 0.68} q ${wt * 0.3} 3 ${wt * 0.6} 0`, fill: 'none', stroke: LINE, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.7 }),
  ];
}

/** Where a fingertip ends up in the hand's own coordinates, after its tilt. */
function tipOf(f: { bx: number; by: number; len: number; wt: number; rot: number }) {
  const a = (f.rot * Math.PI) / 180, l = f.len - 2;
  return { x: f.bx + Math.sin(a) * l, y: f.by - Math.cos(a) * l };
}

export interface HandPair {
  svg: SVGSVGElement;
  /** i: 0–9, left pinky → left thumb, right thumb → right pinky, so counting runs left to right. */
  set(i: number, state: FingerState, label: number | null, answer?: boolean): void;
}

/** Two human hands whose fingers rise and fold (CSS transitions). Only a picture: nothing to tap. */
export function handPair(): HandPair {
  const svg = svgEl('svg', { viewBox: `0 0 ${PAIR_W} ${PAIR_H}`, class: 'hands', 'aria-hidden': 'true' });
  const fingers: SVGGElement[] = [];
  const labels: SVGGElement[] = [];

  for (const side of [0, 1] as const) {
    const g = svgEl('g', { transform: side === 0 ? `translate(${OX} ${TOP})` : `translate(${PAIR_W - OX} ${TOP}) scale(-1 1)` });
    const idx = (k: number) => (side === 0 ? k : 9 - k);
    const toPair = (p: { x: number; y: number }) => ({ x: side === 0 ? OX + p.x : PAIR_W - OX - p.x, y: TOP + p.y });

    // fingers behind the palm, so their bases tuck in
    FINGERS.forEach((f, k) => {
      const outer = svgEl('g', { transform: `rotate(${f.rot} ${f.bx} ${f.by})` });
      const body = svgEl('g', { class: `finger f-down`, 'data-finger': idx(k) }, svgEl('g', { class: 'body' }, ...fingerShape(f)));
      outer.append(body);
      g.append(outer);
      fingers[idx(k)] = body;
      labels[idx(k)] = labelAt(toPair(tipOf(f)));
    });
    // palm, knuckles and sleeve
    g.append(svgEl('path', {
      d: 'M 18 98 C 16 86 22 80 32 80 L 104 76 C 115 76 119 84 118 98 L 117 136 C 115 156 106 166 98 172 L 42 172 C 28 164 18 150 18 130 Z',
      fill: SKIN, stroke: LINE, 'stroke-width': 2.2, 'stroke-linejoin': 'round',
    }));
    g.append(svgEl('path', { d: 'M 40 96 q 4 -3 8 0 M 63 92 q 4 -3 8 0 M 86 92 q 4 -3 8 0', fill: 'none', stroke: LINE, 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.6 }));
    g.append(svgEl('rect', { x: 34, y: 166, width: 72, height: 30, rx: 7, fill: SLEEVE, stroke: SLEEVE_DARK, 'stroke-width': 2 }));
    // thumb in front of the palm: up it points at the other hand, folded it lies across the palm
    const outer = svgEl('g', { transform: `rotate(${THUMB.rot} ${THUMB.bx} ${THUMB.by})` });
    const thumb = svgEl('g', { class: 'finger thumb f-down', 'data-finger': idx(4) }, svgEl('g', { class: 'body' }, ...fingerShape(THUMB)));
    outer.append(thumb);
    g.append(outer);
    fingers[idx(4)] = thumb;
    labels[idx(4)] = labelAt(toPair(tipOf(THUMB)));

    svg.append(g);
  }
  labels.forEach((l) => svg.append(l));

  return {
    svg,
    set(i, state, label, answer = false) {
      fingers[i].setAttribute('class', `finger ${i === 4 || i === 5 ? 'thumb ' : ''}f-${state}`);
      const l = labels[i];
      l.setAttribute('class', `flabel ${label != null && state !== 'down' ? 'on' : ''} l-${state} ${answer ? 'answer' : ''} ${label != null && label >= 10 ? 'two' : ''}`);
      l.querySelector('text')!.textContent = label == null ? '' : String(label);
    },
  };
}

function labelAt(p: { x: number; y: number }) {
  const y = p.y - 17;
  return svgEl('g', { class: 'flabel' },
    svgEl('circle', { cx: p.x, cy: y, r: 14.5 }),
    svgEl('text', { x: p.x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, ''),
  );
}
