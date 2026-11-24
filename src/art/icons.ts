import { svgEl } from '../ui/dom';
import { heartPath } from './pets';

type IconName = 'coin' | 'home' | 'speaker' | 'paw' | 'star' | 'lock' | 'hand' | 'check' | 'back' | 'shop' | 'map' | 'brush' | 'heart' | 'shower' | 'flag';

export function icon(name: IconName, size = 32): SVGSVGElement {
  const s = svgEl('svg', { viewBox: '0 0 32 32', width: size, height: size, class: `icon icon-${name}`, 'aria-hidden': 'true' });
  const A = (tag: any, a: Record<string, any>, t?: string) => s.append(svgEl(tag, a, t ?? null));
  switch (name) {
    case 'coin': A('circle', { cx: 16, cy: 16, r: 13, fill: '#f7cf4a', stroke: '#d4a017', 'stroke-width': 2.5 }); A('circle', { cx: 16, cy: 16, r: 7, fill: 'none', stroke: '#d4a017', 'stroke-width': 2 }); break;
    case 'home': A('path', { d: 'M5 15 L16 5 L27 15 V27 H19 V19 H13 V27 H5 Z', fill: '#f6a96b', stroke: '#c9773f', 'stroke-width': 2, 'stroke-linejoin': 'round' }); break;
    case 'speaker': A('path', { d: 'M5 12 h6 l7 -6 v20 l-7 -6 h-6 z', fill: '#6b8fd6' }); A('path', { d: 'M22 11 q4 5 0 10 M25 8 q7 8 0 16', stroke: '#6b8fd6', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }); break;
    case 'paw': A('ellipse', { cx: 16, cy: 21, rx: 7, ry: 6, fill: 'currentColor' }); for (const [x, y] of [[8, 13], [13, 8], [19, 8], [24, 13]]) A('circle', { cx: x, cy: y, r: 3.4, fill: 'currentColor' }); break;
    case 'star': A('path', { d: 'M16 3 l4 8.5 l9 1.2 l-6.6 6.2 l1.7 9 l-8.1 -4.4 l-8.1 4.4 l1.7 -9 l-6.6 -6.2 l9 -1.2 z', fill: '#f7cf4a', stroke: '#d4a017', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }); break;
    case 'lock': A('rect', { x: 7, y: 14, width: 18, height: 14, rx: 3, fill: '#a89f99' }); A('path', { d: 'M11 14 v-4 a5 5 0 0 1 10 0 v4', stroke: '#a89f99', 'stroke-width': 3, fill: 'none' }); break;
    case 'hand': A('path', { d: 'M9 28 q-4 -6 -4 -12 v-3 a2 2 0 0 1 4 0 v3 v-10 a2 2 0 0 1 4 0 v8 v-11 a2 2 0 0 1 4 0 v11 v-9 a2 2 0 0 1 4 0 v10 v-6 a2 2 0 0 1 4 0 v10 q0 6 -4 9 z', fill: '#f6c9a8', stroke: '#c98f6a', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }); break;
    case 'check': A('path', { d: 'M6 17 l7 7 l13 -15', stroke: '#fff', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); break;
    case 'back': A('path', { d: 'M12 7 h15 v18 h-15 l-8 -9 z', fill: '#e9ddd2', stroke: '#a89f99', 'stroke-width': 2, 'stroke-linejoin': 'round' }); A('path', { d: 'M14 12 l8 8 M22 12 l-8 8', stroke: '#7a716b', 'stroke-width': 2.5, 'stroke-linecap': 'round' }); break;
    case 'shop': A('path', { d: 'M6 11 h20 l-2 17 h-16 z', fill: '#f48fb1' }); A('path', { d: 'M11 11 v-2 a5 5 0 0 1 10 0 v2', stroke: '#c2185b', 'stroke-width': 2.5, fill: 'none' }); break;
    case 'map': A('path', { d: 'M4 7 l8 -3 l8 3 l8 -3 v21 l-8 3 l-8 -3 l-8 3 z', fill: '#a5d6a7', stroke: '#5f9b62', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }); A('path', { d: 'M8 20 q6 -10 16 -8', stroke: '#e57373', 'stroke-width': 2, 'stroke-dasharray': '2 2', fill: 'none' }); break;
    case 'brush': A('rect', { x: 14, y: 3, width: 5, height: 14, rx: 2, fill: '#a1887f' }); A('rect', { x: 8, y: 16, width: 17, height: 8, rx: 2, fill: '#ce93d8' }); for (let i = 0; i < 6; i++) A('line', { x1: 10 + i * 2.6, y1: 24, x2: 10 + i * 2.6, y2: 29, stroke: '#7a716b', 'stroke-width': 1.4 }); break;
    case 'heart': A('path', { d: heartPath(16, 16, 10), fill: '#f2708c' }); break;
    case 'shower': A('path', { d: 'M8 6 h10 a6 6 0 0 1 6 6 v2', stroke: '#90a4ae', 'stroke-width': 3, fill: 'none' }); A('rect', { x: 18, y: 14, width: 12, height: 4, rx: 2, fill: '#90a4ae' }); for (const x of [20, 24, 28]) A('line', { x1: x, y1: 21, x2: x - 1, y2: 27, stroke: '#64b5f6', 'stroke-width': 2, 'stroke-linecap': 'round' }); break;
    case 'flag': A('line', { x1: 8, y1: 4, x2: 8, y2: 29, stroke: '#7a716b', 'stroke-width': 2.5 }); A('path', { d: 'M8 5 h16 l-4 5 l4 5 h-16 z', fill: '#e0567a' }); break;
  }
  return s;
}
