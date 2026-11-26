import { svgEl } from '../ui/dom';

/** down = folded; up = already up at the start; new = raised while counting; carry = the carried 1. */
export type FingerState = 'down' | 'up' | 'new' | 'carry';

const SKIN = '#f7c9a7', LINE = '#c98762', CREASE = '#d99a76', NAIL = '#fde9de', NAIL_LINE = '#e3a88a';
const SLEEVE = '#8fb8de', SLEEVE_DARK = '#6d97c0';
const NAIL_COLOR: Record<FingerState, [string, string]> = {
  down: [NAIL, NAIL_LINE], up: [NAIL, NAIL_LINE], new: ['#f6a96b', '#e0824a'], carry: ['#e0567a', '#b23d5c'],
};

export const PAIR_W = 430;
const TOP = 44; // room above the fingers for the numbers
const HAND_H = 242;
const PAIR_H = TOP + HAND_H;
const OX = 4;

type Pt = { x: number; y: number };
interface FingerGeo {
  base: Pt;          // knuckle, on the edge of the palm
  tilt: number;      // degrees from straight up, + towards the thumb
  len: [number, number, number];          // the three bones
  w: [number, number, number, number];    // width at knuckle, middle joint, last joint, tip
  down: { tilt: number; bend: [number, number, number] }; // folded pose
}

// A left hand seen from the back, thumb on the right (towards the other hand). 0 pinky … 3 index, 4 thumb.
const FOLD: [number, number, number] = [88, 95, 60];
const GEO: FingerGeo[] = [
  { base: { x: 37, y: 108 }, tilt: -11, len: [27, 18, 17], w: [19, 17.5, 16, 14.5], down: { tilt: -11, bend: FOLD } },
  { base: { x: 60, y: 97 }, tilt: -4, len: [35, 23, 20], w: [21.5, 20, 18, 16.5], down: { tilt: -4, bend: FOLD } },
  { base: { x: 87, y: 93 }, tilt: 1, len: [38, 25, 21], w: [23, 21, 19, 17.5], down: { tilt: 1, bend: FOLD } },
  { base: { x: 113, y: 97 }, tilt: 6, len: [34, 22, 20], w: [22, 20, 18.5, 17], down: { tilt: 6, bend: FOLD } },
  { base: { x: 121, y: 176 }, tilt: 52, len: [30, 26, 22], w: [30, 25, 22.5, 19.5], down: { tilt: 10, bend: [0, 40, 80] } },
];

const PALM = 'M 50 232 C 42 204 24 170 22 136 C 21 116 26 106 36 104 C 52 92 70 88 88 88 C 104 88 118 90 126 98 C 134 106 136 120 134 138 C 132 160 124 186 118 204 C 116 214 114 222 114 232 Z';

const rad = (d: number) => (d * Math.PI) / 180;
const add = (p: Pt, u: Pt, k: number): Pt => ({ x: p.x + u.x * k, y: p.y + u.y * k });
const f1 = (n: number) => n.toFixed(1);

/** A rounded, tapering bone from a to b. n is the finger's sideways unit vector. */
function capsule(a: Pt, b: Pt, ra: number, rb: number, n: Pt): string {
  const p1 = add(a, n, ra), p2 = add(b, n, rb), p3 = add(b, n, -rb), p4 = add(a, n, -ra);
  return `M ${f1(p1.x)} ${f1(p1.y)} L ${f1(p2.x)} ${f1(p2.y)} A ${f1(rb)} ${f1(rb)} 0 0 0 ${f1(p3.x)} ${f1(p3.y)} L ${f1(p4.x)} ${f1(p4.y)} A ${f1(ra)} ${f1(ra)} 0 0 0 ${f1(p1.x)} ${f1(p1.y)} Z`;
}

/** Where the joints are for pose t (0 folded … 1 straight). A bent bone points into the screen, so it looks shorter. */
function pose(g: FingerGeo, t: number) {
  const tilt = g.down.tilt + (g.tilt - g.down.tilt) * t;
  const u = { x: Math.sin(rad(tilt)), y: -Math.cos(rad(tilt)) };
  const n = { x: -u.y, y: u.x };
  let cum = 0, p = g.base;
  const bones = g.len.map((L, k) => {
    cum += g.down.bend[k] * (1 - t);
    const vis = Math.cos(rad(cum));
    const a = p, b = add(p, u, L * Math.max(0, vis));
    p = b;
    return { a, b, vis, L };
  });
  return { u, n, tilt, bones };
}

interface FingerEls { outline: SVGPathElement[]; fill: SVGPathElement[]; creases: SVGPathElement; nail: SVGEllipseElement; knuckle: SVGEllipseElement; cover?: SVGPathElement }

function makeFinger(): FingerEls {
  return {
    outline: [0, 1, 2].map(() => svgEl('path', { fill: LINE, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' })),
    fill: [0, 1, 2].map(() => svgEl('path', { fill: SKIN })),
    creases: svgEl('path', { fill: 'none', stroke: CREASE, 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
    nail: svgEl('ellipse', { 'stroke-width': 1.3 }),
    knuckle: svgEl('ellipse', { fill: '#fde0cc', opacity: 0 }),
  };
}

function drawFinger(els: FingerEls, g: FingerGeo, t: number, nail: [string, string]) {
  const { u, n, tilt, bones } = pose(g, t);
  bones.forEach((bn, k) => {
    const d = k > 0 && bn.vis <= 0.02 ? '' : capsule(bn.a, bn.b, g.w[k] / 2, g.w[k + 1] / 2, n);
    els.outline[k].setAttribute('d', d);
    els.fill[k].setAttribute('d', d);
    if (k === 0) els.cover?.setAttribute('d', d);
  });
  // joint creases, fading as the bone turns away
  let c = '';
  for (const k of [1, 2]) {
    const bn = bones[k];
    if (bn.vis <= 0.15) continue;
    const at = add(bn.a, u, 3), hw = g.w[k] * 0.28;
    const l = add(at, n, -hw), r = add(at, n, hw), mid = add(at, u, -2.5);
    c += `M ${f1(l.x)} ${f1(l.y)} Q ${f1(mid.x)} ${f1(mid.y)} ${f1(r.x)} ${f1(r.y)} `;
    if (k === 1) {
      const at2 = add(at, u, 3.5), l2 = add(at2, n, -hw * 0.8), r2 = add(at2, n, hw * 0.8), m2 = add(at2, u, -2);
      c += `M ${f1(l2.x)} ${f1(l2.y)} Q ${f1(m2.x)} ${f1(m2.y)} ${f1(r2.x)} ${f1(r2.y)} `;
    }
  }
  els.creases.setAttribute('d', c);
  // the nail, seen flat on a straight finger and edge-on as it curls
  const tip = bones[2];
  if (tip.vis > 0.05) {
    const center = add(tip.a, u, tip.L * tip.vis * 0.6);
    els.nail.setAttribute('cx', f1(center.x));
    els.nail.setAttribute('cy', f1(center.y));
    els.nail.setAttribute('rx', f1(g.w[3] * 0.33));
    els.nail.setAttribute('ry', f1(tip.L * 0.3 * tip.vis));
    els.nail.setAttribute('transform', `rotate(${f1(tilt)} ${f1(center.x)} ${f1(center.y)})`);
    els.nail.setAttribute('fill', nail[0]);
    els.nail.setAttribute('stroke', nail[1]);
    els.nail.removeAttribute('display');
  } else els.nail.setAttribute('display', 'none');
  // a folded finger shows its knuckle
  const kn = bones[0];
  els.knuckle.setAttribute('cx', f1(kn.b.x));
  els.knuckle.setAttribute('cy', f1(kn.b.y - 1));
  els.knuckle.setAttribute('rx', f1(g.w[0] * 0.22));
  els.knuckle.setAttribute('ry', f1(g.w[0] * 0.14));
  els.knuckle.setAttribute('opacity', f1(Math.max(0, 1 - t * 2.5) * 0.9));
}

export interface HandPair {
  svg: SVGSVGElement;
  /** i: 0–9, left pinky → left thumb, right thumb → right pinky, so counting runs left to right. */
  set(i: number, state: FingerState, label: number | null, answer?: boolean): void;
}

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOutBack = (x: number) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

interface Finger { els: FingerEls; geo: FingerGeo; t: number; state: FingerState; anim: number }

/**
 * Two human hands seen from the back. Each finger is three bones that uncurl joint by joint
 * when it rises. Only a picture: nothing to tap. The finger states are on the svg as
 * data-fingers ("uuuunddddd": up, new, carry, down) for tests.
 */
export function handPair(): HandPair {
  const svg = svgEl('svg', { viewBox: `0 0 ${PAIR_W} ${PAIR_H}`, class: 'hands', 'aria-hidden': 'true', 'data-fingers': 'dddddddddd' });
  const fingers: Finger[] = [];
  const labels: SVGGElement[] = [];

  for (const side of [0, 1] as const) {
    const g = svgEl('g', { transform: side === 0 ? `translate(${OX} ${TOP})` : `translate(${PAIR_W - OX} ${TOP}) scale(-1 1)` });
    const idx = (k: number) => (side === 0 ? k : 9 - k);
    const toPair = (p: Pt) => ({ x: side === 0 ? OX + p.x : PAIR_W - OX - p.x, y: TOP + p.y });
    const els = GEO.map(makeFinger);

    g.append(svgEl('ellipse', { cx: 84, cy: 236, rx: 46, ry: 6, fill: 'rgba(58,53,51,.08)' }));
    // outlines first, then the skin on top: hand and fingers read as one shape
    g.append(svgEl('path', { d: PALM, fill: LINE, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' }));
    for (let k = 0; k < 4; k++) g.append(...els[k].outline);
    g.append(els[4].outline[0]); // the thumb's root is part of the hand
    g.append(svgEl('path', { d: PALM, fill: SKIN }));
    for (let k = 0; k < 4; k++) g.append(...els[k].fill);
    g.append(els[4].fill[0]);
    // a little light on the back of the hand, and the tendons
    g.append(svgEl('path', { d: 'M 64 130 Q 68 160 72 192 M 88 126 Q 88 160 88 192 M 110 130 Q 106 160 102 192', fill: 'none', stroke: CREASE, 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: 0.22 }));
    for (let k = 0; k < 4; k++) g.append(els[k].creases, els[k].knuckle, els[k].nail);
    // the rest of the thumb lies on top of the hand; its root is drawn again over the join so it blends in
    const rootCover = svgEl('path', { fill: SKIN });
    els[4].cover = rootCover;
    g.append(els[4].outline[1], els[4].outline[2], els[4].fill[1], els[4].fill[2], rootCover, els[4].creases, els[4].nail);
    // sleeve
    g.append(svgEl('rect', { x: 38, y: 206, width: 92, height: 32, rx: 9, fill: SLEEVE, stroke: SLEEVE_DARK, 'stroke-width': 2.5 }));
    g.append(svgEl('path', { d: 'M 50 210 v 24 M 62 210 v 24 M 74 210 v 24 M 86 210 v 24 M 98 210 v 24 M 110 210 v 24 M 122 210 v 24', stroke: SLEEVE_DARK, 'stroke-width': 1.5, opacity: 0.45 }));

    GEO.forEach((geo, k) => {
      const f: Finger = { els: els[k], geo, t: 0, state: 'down', anim: 0 };
      fingers[idx(k)] = f;
      drawFinger(f.els, geo, 0, NAIL_COLOR.down);
      const { u, bones } = pose(geo, 1);
      labels[idx(k)] = labelAt(toPair(add(bones[2].b, u, 4)));
    });
    svg.append(g);
  }
  labels.forEach((l) => svg.append(l));

  function animate(f: Finger, to: number) {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(f.anim);
    const from = f.t;
    if (from === to || reduceMotion() || typeof requestAnimationFrame !== 'function') {
      f.t = to;
      drawFinger(f.els, f.geo, to, NAIL_COLOR[f.state]);
      return;
    }
    const ms = to > from ? 650 : 380, ease = to > from ? easeOutBack : easeInOut, start = performance.now();
    const frame = (now: number) => {
      const x = Math.min(1, Math.max(0, (now - start) / ms));
      f.t = x < 1 ? from + (to - from) * ease(x) : to;
      drawFinger(f.els, f.geo, f.t, NAIL_COLOR[f.state]);
      if (x < 1) f.anim = requestAnimationFrame(frame);
    };
    f.anim = requestAnimationFrame(frame);
  }

  return {
    svg,
    set(i, state, label, answer = false) {
      const f = fingers[i];
      if (f.state !== state) {
        f.state = state;
        const s = svg.dataset.fingers!.split('');
        s[i] = state[0];
        svg.dataset.fingers = s.join('');
        animate(f, state === 'down' ? 0 : 1);
      }
      const l = labels[i];
      l.setAttribute('class', `flabel ${label != null && state !== 'down' ? 'on' : ''} l-${state} ${answer ? 'answer' : ''} ${label != null && label >= 10 ? 'two' : ''}`);
      l.querySelector('text')!.textContent = label == null ? '' : String(label);
    },
  };
}

function labelAt(p: Pt) {
  const y = p.y - 18;
  return svgEl('g', { class: 'flabel' },
    svgEl('circle', { cx: f1(p.x), cy: f1(y), r: 15 }),
    svgEl('text', { x: f1(p.x), y: f1(y + 1), 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, ''),
  );
}
