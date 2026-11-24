import { svgEl } from '../ui/dom';
import { itemById } from '../pet/catalog';
import { heartPath } from './pets';

const PET_SLOTS = ['cabeza', 'cuello', 'cara'];
export const isPetItem = (id: string) => PET_SLOTS.includes(itemById(id)?.slot ?? '');

/** Pet items, drawn around the head centre for a head radius of 50. */
export function itemShape(id: string): SVGGElement | null {
  const g = svgEl('g', { class: `item item-${id}` });
  const S = (tag: any, a: Record<string, any>) => g.append(svgEl(tag, a));
  switch (id) {
    case 'lazo-rosa':
      S('path', { d: 'M18 -44 l-22 -14 v28 z', fill: '#f48fb1', stroke: '#c2185b', 'stroke-width': 2 });
      S('path', { d: 'M18 -44 l22 -14 v28 z', fill: '#f48fb1', stroke: '#c2185b', 'stroke-width': 2 });
      S('circle', { cx: 18, cy: -44, r: 6, fill: '#ec407a' });
      break;
    case 'gorro-lana':
      S('path', { d: 'M-42 -26 q42 -70 84 0 z', fill: '#7cb7e8' });
      S('rect', { x: -46, y: -32, width: 92, height: 14, rx: 7, fill: '#e8f2fb' });
      S('circle', { cx: 0, cy: -66, r: 10, fill: '#e8f2fb' });
      break;
    case 'corona':
      S('path', { d: 'M-28 -40 l0 -26 l14 12 l14 -20 l14 20 l14 -12 l0 26 z', fill: '#f7cf4a', stroke: '#d4a017', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
      S('circle', { cx: 0, cy: -48, r: 4, fill: '#e94f6a' });
      break;
    case 'sombrero':
      S('ellipse', { cx: 0, cy: -38, rx: 62, ry: 12, fill: '#e9c98a', stroke: '#b8935a', 'stroke-width': 2 });
      S('path', { d: 'M-30 -38 q0 -34 30 -34 q30 0 30 34 z', fill: '#e9c98a', stroke: '#b8935a', 'stroke-width': 2 });
      S('rect', { x: -30, y: -48, width: 60, height: 8, fill: '#e57373' });
      break;
    case 'flores':
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI, x = Math.cos(a) * 44, y = Math.sin(a) * 40 - 8;
        S('circle', { cx: x, cy: y, r: 8, fill: ['#f48fb1', '#fff176', '#ce93d8', '#81d4fa'][i % 4] });
        S('circle', { cx: x, cy: y, r: 3, fill: '#ffb300' });
      }
      break;
    case 'gorra':
      S('path', { d: 'M-40 -28 q40 -56 80 0 z', fill: '#ef6c57' });
      S('path', { d: 'M20 -30 q30 -4 46 6 q-22 8 -46 2 z', fill: '#d4533f' });
      break;
    case 'pajarita':
      S('path', { d: 'M0 54 l-20 -12 v24 z', fill: '#5c6bc0' });
      S('path', { d: 'M0 54 l20 -12 v24 z', fill: '#5c6bc0' });
      S('circle', { cx: 0, cy: 54, r: 5, fill: '#3949ab' });
      break;
    case 'bufanda':
      S('rect', { x: -40, y: 42, width: 80, height: 16, rx: 8, fill: '#e57373' });
      S('rect', { x: 14, y: 50, width: 14, height: 34, rx: 6, fill: '#ef9a9a' });
      break;
    case 'collar':
      for (let i = 0; i < 9; i++) S('circle', { cx: -32 + i * 8, cy: 48 + Math.sin((i / 8) * Math.PI) * 8, r: 4.5, fill: '#fffdf5', stroke: '#d7ccc8' });
      break;
    case 'cascabel':
      S('path', { d: 'M-36 46 q36 14 72 0', stroke: '#e53935', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' });
      S('circle', { cx: 0, cy: 60, r: 9, fill: '#fbc02d', stroke: '#c49000', 'stroke-width': 2 });
      break;
    case 'gafas':
      for (const s of [-1, 1]) S('circle', { cx: s * 19, cy: -4, r: 13, fill: 'rgba(255,255,255,.25)', stroke: '#5d4037', 'stroke-width': 3 });
      S('path', { d: 'M-6 -6 q6 -5 12 0', stroke: '#5d4037', 'stroke-width': 3, fill: 'none' });
      break;
    case 'gafas-sol':
      for (const s of [-1, 1]) S('rect', { x: s * 19 - 14, y: -14, width: 28, height: 20, rx: 8, fill: '#37474f' });
      S('path', { d: 'M-5 -8 h10', stroke: '#37474f', 'stroke-width': 4 });
      break;
    case 'gafas-corazon':
      for (const s of [-1, 1]) S('path', { d: heartPath(s * 19, -4, 13), fill: 'rgba(244,143,177,.7)', stroke: '#d81b60', 'stroke-width': 2.5 });
      S('path', { d: 'M-6 -6 h12', stroke: '#d81b60', 'stroke-width': 3 });
      break;
    default:
      return null;
  }
  return g;
}

/** Room items, drawn in a 100×100 box. */
export function roomShape(id: string): SVGGElement | null {
  const g = svgEl('g', { class: `room-item item-${id}` });
  const S = (tag: any, a: Record<string, any>, text?: string) => g.append(svgEl(tag, a, text ?? null));
  switch (id) {
    case 'cojin':
      S('rect', { x: 10, y: 55, width: 80, height: 34, rx: 16, fill: '#ffcc80', stroke: '#f0a94a', 'stroke-width': 3 });
      break;
    case 'cama-nube':
      S('path', { d: 'M12 85 q-8 -24 14 -26 q4 -20 26 -14 q12 -16 30 0 q20 -2 16 22 q8 18 -10 18 z', fill: '#fff', stroke: '#b3d4f5', 'stroke-width': 3 });
      break;
    case 'alfombra-redonda':
      S('ellipse', { cx: 50, cy: 70, rx: 46, ry: 16, fill: '#ce93d8' });
      S('ellipse', { cx: 50, cy: 70, rx: 32, ry: 10, fill: '#e1bee7' });
      break;
    case 'alfombra-arcoiris':
      ['#ef9a9a', '#ffcc80', '#fff59d', '#a5d6a7', '#90caf9'].forEach((c, i) => S('ellipse', { cx: 50, cy: 70, rx: 48 - i * 8, ry: 17 - i * 3, fill: c }));
      break;
    case 'pelota':
      S('circle', { cx: 50, cy: 62, r: 24, fill: '#ef5350' });
      S('path', { d: 'M26 62 q24 -16 48 0', stroke: '#fff', 'stroke-width': 6, fill: 'none' });
      break;
    case 'osito':
      for (const s of [-1, 1]) S('circle', { cx: 50 + s * 16, cy: 30, r: 9, fill: '#a1887f' });
      S('ellipse', { cx: 50, cy: 70, rx: 22, ry: 20, fill: '#a1887f' });
      S('circle', { cx: 50, cy: 42, r: 18, fill: '#a1887f' });
      S('circle', { cx: 44, cy: 40, r: 2.5, fill: '#3a3533' });
      S('circle', { cx: 56, cy: 40, r: 2.5, fill: '#3a3533' });
      S('ellipse', { cx: 50, cy: 48, rx: 6, ry: 4, fill: '#d7ccc8' });
      break;
    case 'planta':
      S('path', { d: 'M34 70 h32 l-5 24 h-22 z', fill: '#e07a5f' });
      for (const [dx, dy] of [[-14, -30], [0, -40], [14, -30]]) S('ellipse', { cx: 50 + dx, cy: 60 + dy / 2, rx: 8, ry: 18, fill: '#81c784', transform: `rotate(${dx * 2} ${50 + dx} ${60 + dy / 2})` });
      break;
    case 'cohete':
      S('path', { d: 'M50 10 q20 22 16 56 h-32 q-4 -34 16 -56 z', fill: '#eceff1', stroke: '#90a4ae', 'stroke-width': 3 });
      S('circle', { cx: 50, cy: 40, r: 8, fill: '#64b5f6' });
      S('path', { d: 'M34 66 l-10 18 h14 z M66 66 l10 18 h-14 z', fill: '#ef5350' });
      S('path', { d: 'M42 66 q8 24 16 0 z', fill: '#ffb74d' });
      break;
    case 'pared-estrellas':
    case 'pared-rayas':
    case 'pared-corazones': {
      S('rect', { x: 6, y: 6, width: 88, height: 88, rx: 12, fill: wallColor(id) });
      if (id === 'pared-rayas') for (let i = 0; i < 5; i++) S('rect', { x: 10 + i * 18, y: 6, width: 8, height: 88, fill: '#ffffff', opacity: 0.45 });
      if (id === 'pared-estrellas') for (const [x, y] of [[25, 25], [70, 30], [45, 60], [80, 75], [20, 78]]) S('text', { x, y, 'font-size': 16, fill: '#fff59d', 'text-anchor': 'middle' }, '★');
      if (id === 'pared-corazones') for (const [x, y] of [[25, 28], [70, 30], [45, 62], [78, 76], [20, 78]]) S('path', { d: heartPath(x, y, 7), fill: '#f48fb1' });
      break;
    }
    default:
      return null;
  }
  return g;
}

export const wallColor = (id: string | undefined) =>
  id === 'pared-estrellas' ? '#4b5a9e' : id === 'pared-rayas' ? '#a5d6c8' : id === 'pared-corazones' ? '#fde4ec' : '#fbe9d0';

/** Shop thumbnail: any item, fitted to its own drawing once it is on the page. */
export function itemThumb(id: string): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: '0 0 100 100', class: 'thumb' });
  const pet = itemShape(id);
  if (pet) {
    svg.append(pet);
    requestAnimationFrame(() => {
      try {
        const b = svg.getBBox();
        const size = Math.max(b.width, b.height, 46) + 14;
        svg.setAttribute('viewBox', `${b.x + b.width / 2 - size / 2} ${b.y + b.height / 2 - size / 2} ${size} ${size}`);
      } catch { /* not rendered yet */ }
    });
  } else {
    const r = roomShape(id);
    if (r) svg.append(r);
  }
  return svg;
}
