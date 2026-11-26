import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeDraggable } from '../src/ui/drag';

const ev = (target: EventTarget, type: string, x: number, y: number) =>
  target.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true }));

afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe('dragging', () => {
  it('a fast drag that leaves the element in one move still drops where she lets go', () => {
    const el = document.createElement('button');
    const other = document.createElement('div');
    document.body.append(el, other);
    const drops: number[][] = [];
    makeDraggable(el, { inScroller: true, onDrop: (x, y) => drops.push([x, y]) });
    ev(el, 'pointerdown', 500, 100);
    ev(other, 'pointermove', 100, 300); // the next move is already over something else
    ev(other, 'pointerup', 100, 300);
    expect(drops).toEqual([[100, 300]]);
    expect(document.querySelector('.drag-ghost')).toBeNull();
  });

  it('a quick tap in a scrolling list never leaves a stuck picture behind', () => {
    vi.useFakeTimers();
    const el = document.createElement('button');
    document.body.append(el);
    makeDraggable(el, { inScroller: true, onDrop: () => {} });
    ev(el, 'pointerdown', 10, 10);
    ev(el, 'pointerup', 10, 10);
    vi.advanceTimersByTime(1000);
    expect(document.querySelector('.drag-ghost')).toBeNull();
  });

  it('in a scrolling list, an up-or-down swipe scrolls instead of dragging', () => {
    const el = document.createElement('button');
    document.body.append(el);
    const drops: number[][] = [];
    makeDraggable(el, { inScroller: true, onDrop: (x, y) => drops.push([x, y]) });
    ev(el, 'pointerdown', 100, 100);
    ev(el, 'pointermove', 102, 160);
    ev(el, 'pointerup', 102, 160);
    expect(drops).toEqual([]);
  });
});
