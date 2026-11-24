import { svgEl } from '../ui/dom';

export type FingerState = 'down' | 'ghost' | 'ghostCarry' | 'up' | 'carry';

const SKIN = '#f6c9a8', SKIN_DARK = '#e2a57f', CARRY = '#e0567a';

// Local finger geometry for one hand, thumb on the right (towards the centre). k: 0 = pinky … 4 = thumb.
const F = [
  { x: 26, w: 15, h: 40, base: 62 },
  { x: 43, w: 16, h: 52, base: 58 },
  { x: 61, w: 16, h: 58, base: 57 },
  { x: 79, w: 16, h: 52, base: 58 },
];

/**
 * Two hands. Finger i: 0–4 left hand pinky→thumb, 5–9 right hand thumb→pinky,
 * so counting runs left to right across the screen like the number track.
 */
export function handsSvg(states: FingerState[], labels: (number | null)[] = []): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: '0 -24 300 168', class: 'hands' });
  svg.append(hand(0, states, labels, 'translate(5 0)'));
  svg.append(hand(1, states, labels, 'translate(295 0) scale(-1 1)'));
  return svg;
}

function hand(side: 0 | 1, states: FingerState[], labels: (number | null)[], transform: string) {
  const g = svgEl('g', { transform });
  const idx = (k: number) => (side === 0 ? k : 9 - k);
  for (let k = 0; k < 4; k++) g.append(finger(idx(k), F[k], states[idx(k)] ?? 'down', labels[idx(k)], side));
  // palm
  g.append(svgEl('rect', { x: 22, y: 60, width: 78, height: 74, rx: 28, fill: SKIN, stroke: SKIN_DARK, 'stroke-width': 2 }));
  // thumb
  const i = idx(4), st0 = states[i] ?? 'down';
  const st = st0 === 'ghostCarry' ? 'ghost' : st0;
  const ghostStroke = st0 === 'ghostCarry' ? CARRY : '#c98f6a';
  const tg = svgEl('g', { class: `finger f-${st}`, 'data-finger': i });
  const up = st === 'up' || st === 'carry';
  const open = up || st === 'ghost';
  // up: tilted outwards towards the centre; down: folded across the palm
  const tf = open ? 'rotate(32 96 116)' : 'rotate(-62 96 116)';
  const fill = st === 'carry' ? CARRY : up ? SKIN : st === 'ghost' ? 'rgba(255,255,255,.6)' : SKIN_DARK;
  tg.append(svgEl('rect', {
    x: 87.5, y: open ? 66 : 92, width: 17, height: open ? 50 : 26, rx: 8.5, transform: tf, fill,
    stroke: st === 'ghost' ? ghostStroke : SKIN_DARK, 'stroke-width': 2.5, 'stroke-dasharray': st === 'ghost' ? '5 4' : null,
  }));
  tg.append(svgEl('rect', { x: 100, y: 40, width: 46, height: 90, fill: 'transparent' }));
  if (labels[i] != null && up) tg.append(label(labels[i]!, 124, 58, side));
  g.append(tg);
  return g;
}

function finger(i: number, f: (typeof F)[number], st0: FingerState, lab: number | null | undefined, side: 0 | 1) {
  const g = svgEl('g', { class: `finger f-${st0}`, 'data-finger': i });
  const st = st0 === 'ghostCarry' ? 'ghost' : st0;
  const ghostStroke = st0 === 'ghostCarry' ? CARRY : '#c98f6a';
  const up = st === 'up' || st === 'carry';
  const h = up || st === 'ghost' ? f.h : 16;
  const y = f.base + 8 - h;
  g.append(svgEl('rect', {
    x: f.x, y, width: f.w, height: h + 8, rx: f.w / 2,
    fill: st === 'carry' ? CARRY : up ? SKIN : st === 'ghost' ? 'rgba(255,255,255,.6)' : SKIN_DARK,
    stroke: st === 'ghost' ? ghostStroke : SKIN_DARK, 'stroke-width': 2.5, 'stroke-dasharray': st === 'ghost' ? '5 4' : null,
  }));
  if (up) g.append(svgEl('rect', { x: f.x + 3, y: y + 3, width: f.w - 6, height: 8, rx: 4, fill: '#fde6d6' }));
  // generous invisible hit area
  g.append(svgEl('rect', { x: f.x - 2, y: 0, width: f.w + 4, height: f.base + 10, fill: 'transparent' }));
  if (lab != null && up) g.append(label(lab, f.x + f.w / 2, y - 6, side));
  return g;
}

function label(n: number, x: number, y: number, side: 0 | 1) {
  // counter the mirror transform on the right hand so digits read correctly
  return svgEl('text', {
    x: side === 1 ? -x : x, y, transform: side === 1 ? 'scale(-1 1)' : null,
    'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#3a3533',
  }, String(n));
}
