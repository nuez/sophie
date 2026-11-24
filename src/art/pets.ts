import { svgEl } from '../ui/dom';
import type { PetKind } from '../state/store';
import { itemShape, isPetItem } from './items';

export type Mood = 'feliz' | 'emocion' | 'abrazo' | 'sueno' | 'despeinado' | 'comiendo' | 'ronroneo';

export interface PetOpts {
  growth: 0 | 1 | 2;
  mood: Mood;
  equipped: string[];
  tangles?: number;
  bubbles?: boolean;
}

interface Palette { body: string; dark: string; belly: string; accent: string }
const PAL: Record<PetKind, Palette> = {
  gato: { body: '#f4b26b', dark: '#d98c3f', belly: '#fde3c2', accent: '#f7a8b8' },
  perro: { body: '#d9ab7f', dark: '#9c6b45', belly: '#f5e1c8', accent: '#f7a8b8' },
  conejo: { body: '#eee6f1', dark: '#c3b3cf', belly: '#ffffff', accent: '#f7b6c8' },
  dragon: { body: '#8fd6b0', dark: '#5aa983', belly: '#e9f7c6', accent: '#f5d77a' },
};
const INK = '#3a3533';

export interface PetGeometry { hx: number; hy: number; r: number; bx: number; by: number; brx: number; bry: number }

export function geometry(growth: 0 | 1 | 2): PetGeometry {
  const r = [48, 45, 42][growth];
  const brx = [36, 46, 55][growth];
  const bry = [30, 40, 50][growth];
  const by = 188 - bry;
  const hy = by - bry * 0.7 - r * 0.72;
  return { hx: 100, hy, r, bx: 100, by, brx, bry };
}

/** Positions where tangles sit (used for brushing). */
export function tanglePoints(g: PetGeometry): [number, number][] {
  return [
    [g.hx - g.r * 0.55, g.hy - g.r * 0.75],
    [g.hx + g.r * 0.5, g.hy - g.r * 0.8],
    [g.hx - g.r * 0.95, g.hy + g.r * 0.1],
    [g.hx + g.r * 0.95, g.hy + g.r * 0.15],
    [g.bx - g.brx * 0.6, g.by + g.bry * 0.1],
    [g.bx + g.brx * 0.6, g.by + g.bry * 0.05],
  ];
}

export function petSvg(kind: PetKind, o: PetOpts): SVGSVGElement {
  const p = PAL[kind];
  const g = geometry(o.growth);
  const svg = svgEl('svg', { viewBox: '0 0 200 200', class: `pet pet-${kind} mood-${o.mood}` });
  const root = svgEl('g', { class: 'pet-root' });
  svg.append(root);

  // shadow
  root.append(svgEl('ellipse', { cx: 100, cy: 192, rx: g.brx * 1.1, ry: 6, fill: 'rgba(58,53,51,.12)' }));

  // tail / wings (behind body)
  root.append(tail(kind, g, p));

  // body
  root.append(svgEl('ellipse', { cx: g.bx, cy: g.by, rx: g.brx, ry: g.bry, fill: p.body }));
  root.append(svgEl('ellipse', { cx: g.bx, cy: g.by + g.bry * 0.18, rx: g.brx * 0.62, ry: g.bry * 0.7, fill: p.belly }));
  if (kind === 'gato') {
    for (const dx of [-0.75, 0.75]) root.append(svgEl('path', { d: `M${g.bx + dx * g.brx} ${g.by - 10} q${-dx * 10} 6 0 14`, stroke: p.dark, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
  }
  // feet
  for (const dx of [-0.45, 0.45]) root.append(svgEl('ellipse', { cx: g.bx + dx * g.brx, cy: 186, rx: g.brx * 0.3, ry: 8, fill: p.dark }));
  // arms
  const armUp = o.mood === 'abrazo' || o.mood === 'emocion';
  for (const s of [-1, 1]) {
    const ax = g.bx + s * g.brx * 0.82, ay = g.by - g.bry * 0.15;
    root.append(svgEl('ellipse', {
      cx: ax, cy: ay, rx: 9, ry: g.bry * 0.42, fill: p.body, stroke: p.dark, 'stroke-width': 2,
      transform: `rotate(${armUp ? -s * 140 : s * 20} ${ax} ${ay - g.bry * 0.3})`,
    }));
  }

  // ears / horns (behind head)
  root.append(ears(kind, g, p, 'back'));
  // head
  root.append(svgEl('circle', { cx: g.hx, cy: g.hy, r: g.r, fill: p.body }));
  root.append(ears(kind, g, p, 'front'));
  if (kind === 'perro') root.append(svgEl('ellipse', { cx: g.hx + g.r * 0.38, cy: g.hy - g.r * 0.1, rx: g.r * 0.28, ry: g.r * 0.25, fill: p.dark, opacity: 0.5 }));
  // muzzle
  root.append(svgEl('ellipse', { cx: g.hx, cy: g.hy + g.r * 0.32, rx: g.r * 0.42, ry: g.r * 0.28, fill: p.belly }));
  root.append(face(kind, g, p, o));

  if (o.mood === 'despeinado' || (o.tangles ?? 0) > 0) root.append(tufts(g, p));
  const nT = o.tangles ?? (o.mood === 'despeinado' ? 4 : 0);
  if (nT > 0) {
    const tg = svgEl('g', { class: 'tangles' });
    tanglePoints(g).slice(0, nT).forEach(([x, y], i) => {
      tg.append(svgEl('path', {
        class: 'tangle', 'data-i': i,
        d: `M${x - 10} ${y} c4 -10 10 8 14 -2 s6 10 -4 10 s-8 -12 4 -10`,
        stroke: p.dark, 'stroke-width': 3.2, fill: 'none', 'stroke-linecap': 'round',
      }));
    });
    root.append(tg);
  }

  // equipped pet items
  for (const id of o.equipped.filter(isPetItem)) {
    const item = itemShape(id);
    if (!item) continue;
    const s = g.r / 50;
    item.setAttribute('transform', `translate(${g.hx} ${g.hy}) scale(${s})`);
    root.append(item);
  }

  if (o.bubbles) {
    const bg = svgEl('g', { class: 'bubbles' });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      bg.append(svgEl('circle', { cx: 100 + Math.cos(a) * g.brx * 0.9, cy: g.by - 10 + Math.sin(a) * g.bry, r: 7 + (i % 3) * 4, fill: 'rgba(255,255,255,.85)', stroke: '#bfe3ff', 'stroke-width': 2 }));
    }
    root.append(bg);
  }
  return svg;
}

function tail(kind: PetKind, g: PetGeometry, p: Palette) {
  const t = svgEl('g', { class: 'tail' });
  const x = g.bx + g.brx * 0.85, y = g.by + g.bry * 0.3;
  if (kind === 'gato') t.append(svgEl('path', { d: `M${x} ${y} q30 -10 22 -50 q-4 -14 6 -18`, stroke: p.body, 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' }));
  if (kind === 'perro') t.append(svgEl('path', { d: `M${x} ${y - 5} q22 -10 24 -36`, stroke: p.body, 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round' }));
  if (kind === 'conejo') t.append(svgEl('circle', { cx: x + 4, cy: y, r: 12, fill: '#fff', stroke: p.dark, 'stroke-width': 2 }));
  if (kind === 'dragon') {
    t.append(svgEl('path', { d: `M${x - 6} ${y} q36 6 38 -28`, stroke: p.body, 'stroke-width': 13, fill: 'none', 'stroke-linecap': 'round' }));
    t.append(svgEl('path', { d: `M${x + 26} ${y - 30} l12 -12 l2 16 z`, fill: p.accent }));
    for (const s of [-1, 1]) {
      const wx = g.bx + s * g.brx * 0.7, wy = g.by - g.bry * 0.6;
      t.append(svgEl('path', { d: `M${wx} ${wy} q${s * 34} -30 ${s * 40} 6 q${-s * 12} -6 ${-s * 18} 6 q${-s * 8} -8 ${-s * 22} -12 z`, fill: '#b9e8cf', stroke: p.dark, 'stroke-width': 2 }));
    }
  }
  return t;
}

function ears(kind: PetKind, g: PetGeometry, p: Palette, layer: 'back' | 'front') {
  const e = svgEl('g');
  const { hx, hy, r } = g;
  for (const s of [-1, 1]) {
    if (kind === 'gato' && layer === 'back') {
      e.append(svgEl('path', { d: `M${hx + s * r * 0.85} ${hy - r * 0.2} L${hx + s * r * 0.75} ${hy - r * 1.15} L${hx + s * r * 0.15} ${hy - r * 0.8} Z`, fill: p.body, 'stroke-linejoin': 'round', stroke: p.body, 'stroke-width': 6 }));
      e.append(svgEl('path', { d: `M${hx + s * r * 0.7} ${hy - r * 0.45} L${hx + s * r * 0.68} ${hy - r * 0.95} L${hx + s * r * 0.35} ${hy - r * 0.72} Z`, fill: p.accent }));
    }
    if (kind === 'perro' && layer === 'front') {
      e.append(svgEl('ellipse', { cx: hx + s * r * 0.92, cy: hy + r * 0.05, rx: r * 0.26, ry: r * 0.58, fill: p.dark, transform: `rotate(${s * -18} ${hx + s * r * 0.92} ${hy - r * 0.4})` }));
    }
    if (kind === 'conejo' && layer === 'back') {
      const x = hx + s * r * 0.38;
      e.append(svgEl('ellipse', { cx: x, cy: hy - r * 1.25, rx: r * 0.24, ry: r * 0.75, fill: p.body, stroke: p.dark, 'stroke-width': 2, transform: `rotate(${s * 10} ${x} ${hy - r * 0.6})` }));
      e.append(svgEl('ellipse', { cx: x, cy: hy - r * 1.22, rx: r * 0.12, ry: r * 0.55, fill: p.accent, transform: `rotate(${s * 10} ${x} ${hy - r * 0.6})` }));
    }
    if (kind === 'dragon' && layer === 'back') {
      e.append(svgEl('path', { d: `M${hx + s * r * 0.5} ${hy - r * 0.7} q${s * 4} -30 ${s * 16} -36 q${-s * 2} 22 ${s * 4} 30 z`, fill: p.accent, stroke: '#d9b54f', 'stroke-width': 2 }));
      e.append(svgEl('ellipse', { cx: hx + s * r * 0.98, cy: hy - r * 0.05, rx: r * 0.18, ry: r * 0.3, fill: p.dark }));
    }
  }
  if (kind === 'dragon' && layer === 'back') {
    for (const dx of [-0.3, 0, 0.3]) e.append(svgEl('path', { d: `M${hx + dx * r - 7} ${hy - r * 0.92} l7 -14 l7 14 z`, fill: p.dark }));
  }
  return e;
}

function face(kind: PetKind, g: PetGeometry, p: Palette, o: PetOpts) {
  const f = svgEl('g', { class: 'face' });
  const { hx, hy, r } = g;
  const er = r * (o.growth === 0 ? 0.16 : 0.14);
  const ey = hy - r * 0.08;
  for (const s of [-1, 1]) {
    const ex = hx + s * r * 0.38;
    if (o.mood === 'emocion' || o.mood === 'ronroneo' || o.mood === 'abrazo') {
      f.append(svgEl('path', { d: `M${ex - er} ${ey + 2} q${er} ${-er * 1.6} ${er * 2} 0`, stroke: INK, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
    } else if (o.mood === 'sueno') {
      f.append(svgEl('path', { d: `M${ex - er} ${ey} q${er} ${er} ${er * 2} 0`, stroke: INK, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
    } else {
      f.append(svgEl('circle', { cx: ex, cy: ey, r: er, fill: INK }));
      f.append(svgEl('circle', { cx: ex + er * 0.35, cy: ey - er * 0.4, r: er * 0.38, fill: '#fff' }));
      f.append(svgEl('circle', { cx: ex - er * 0.3, cy: ey + er * 0.35, r: er * 0.15, fill: '#fff' }));
    }
    f.append(svgEl('ellipse', { cx: hx + s * r * 0.62, cy: hy + r * 0.22, rx: r * 0.14, ry: r * 0.09, fill: '#f49aa8', opacity: o.mood === 'abrazo' ? 0.9 : 0.55 }));
  }
  // nose
  const ny = hy + r * 0.18;
  f.append(svgEl('ellipse', { cx: hx, cy: ny, rx: kind === 'perro' ? r * 0.12 : r * 0.07, ry: kind === 'perro' ? r * 0.08 : r * 0.05, fill: kind === 'conejo' || kind === 'gato' ? '#e57f95' : INK }));
  // mouth
  const my = ny + r * 0.1;
  if (o.mood === 'emocion' || o.mood === 'comiendo') {
    f.append(svgEl('path', { d: `M${hx - r * 0.16} ${my} q${r * 0.16} ${r * 0.32} ${r * 0.32} 0 z`, fill: '#c8576b', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  } else {
    f.append(svgEl('path', { d: `M${hx - r * 0.18} ${my} q${r * 0.09} ${r * 0.12} ${r * 0.18} 0 q${r * 0.09} ${r * 0.12} ${r * 0.18} 0`, stroke: INK, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }));
  }
  if (kind === 'gato') {
    for (const s of [-1, 1]) for (const dy of [-4, 4]) f.append(svgEl('line', { x1: hx + s * r * 0.3, y1: ny + dy * 0.6, x2: hx + s * r * 0.85, y2: ny + dy * 1.6, stroke: INK, 'stroke-width': 1.5, opacity: 0.5 }));
  }
  if (o.mood === 'ronroneo') f.append(svgEl('text', { x: hx + r * 0.9, y: hy - r * 0.9, 'font-size': 18, fill: p.dark, 'font-weight': 700 }, '~'));
  if (o.mood === 'sueno') f.append(svgEl('text', { x: hx + r * 0.8, y: hy - r * 0.9, 'font-size': 16, fill: p.dark, 'font-weight': 700 }, 'z'));
  if (o.mood === 'abrazo') {
    f.append(svgEl('path', { d: heartPath(hx + r * 1.05, hy - r * 0.85, 9), fill: '#f2708c' }));
  }
  return f;
}

function tufts(g: PetGeometry, p: Palette) {
  const t = svgEl('g', { class: 'tufts' });
  const { hx, hy, r } = g;
  for (const dx of [-0.3, -0.1, 0.12, 0.32]) {
    t.append(svgEl('path', { d: `M${hx + dx * r} ${hy - r * 0.95} l${-4 + dx * 10} -12 l6 6 l3 -10 l3 12`, stroke: p.dark, 'stroke-width': 2.5, fill: p.body, 'stroke-linejoin': 'round' }));
  }
  return t;
}

export function heartPath(cx: number, cy: number, s: number) {
  return `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.2} ${cx - s * 0.7} ${cy - s * 1.4} ${cx} ${cy - s * 0.5} C${cx + s * 0.7} ${cy - s * 1.4} ${cx + s * 1.6} ${cy - s * 0.2} ${cx} ${cy + s * 0.9} Z`;
}
