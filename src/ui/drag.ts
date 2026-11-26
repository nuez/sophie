export interface DragOpts {
  /** What follows the finger; by default a copy of the element. */
  ghost?: () => Element;
  /** Size of what follows the finger, in px; by default the element's own size. */
  ghostSize?: number;
  /** Called while dragging, to light up the place it would land. */
  onMove?(x: number, y: number): void;
  /** Called where she lets go (screen coordinates). */
  onDrop(x: number, y: number): void;
  /**
   * The element sits in a list that scrolls up and down: a sideways move starts dragging at once,
   * an up-or-down move scrolls, and holding the finger still for a moment picks it up for any direction.
   */
  inScroller?: boolean;
}

const MOVE = 8, HOLD_MS = 220;

/**
 * Drag with a finger or the mouse. A plain tap still works as a click; after a drag the click is
 * swallowed so it doesn't count as a tap too. From the moment she presses, the whole page is
 * listened to, so a fast drag that leaves the element at once still works.
 */
export function makeDraggable(el: HTMLElement, opts: DragOpts): void {
  el.classList.add(opts.inScroller ? 'drag-scroll' : 'drag-free');
  let press: { x: number; y: number; id: number } | null = null;
  let ghost: HTMLElement | null = null;
  let size = { w: 0, h: 0 };
  let hold: ReturnType<typeof setTimeout> | undefined;
  let swallowClick = false;
  let last = { x: 0, y: 0 };

  const stopScroll = (e: TouchEvent) => { if (ghost) e.preventDefault(); };

  const place = () => {
    if (ghost) ghost.style.transform = `translate(${last.x - size.w / 2}px, ${last.y - size.h / 2}px) scale(1.12)`;
  };

  const begin = () => {
    if (!press || ghost) return;
    const r = el.getBoundingClientRect();
    const holder = document.createElement('div');
    holder.className = 'drag-ghost';
    holder.append((opts.ghost?.() ?? el.cloneNode(true)) as Node);
    size = opts.ghostSize ? { w: opts.ghostSize, h: opts.ghostSize } : { w: r.width, h: r.height };
    holder.style.width = `${size.w}px`;
    holder.style.height = `${size.h}px`;
    document.body.append(holder);
    ghost = holder;
    el.classList.add('drag-source');
    document.addEventListener('touchmove', stopScroll, { passive: false });
    place();
    opts.onMove?.(last.x, last.y);
  };

  const end = (drop: boolean) => {
    clearTimeout(hold);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    press = null;
    if (!ghost) return;
    ghost.remove();
    ghost = null;
    el.classList.remove('drag-source');
    document.removeEventListener('touchmove', stopScroll);
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 400);
    if (drop) opts.onDrop(last.x, last.y);
  };

  const onMove = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return;
    last = { x: e.clientX, y: e.clientY };
    if (ghost) { place(); opts.onMove?.(last.x, last.y); return; }
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (Math.hypot(dx, dy) < MOVE) return;
    if (opts.inScroller && Math.abs(dy) > Math.abs(dx)) { end(false); return; } // she is scrolling
    begin();
  };
  const onUp = (e: PointerEvent) => { if (e.pointerId === press?.id) end(true); };
  const onCancel = (e: PointerEvent) => { if (e.pointerId === press?.id) end(false); };

  // no browser image-dragging or text selection getting in the way
  el.setAttribute('draggable', 'false');
  el.addEventListener('dragstart', (e) => e.preventDefault());

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (el as HTMLButtonElement).disabled || press) return;
    if (e.pointerType === 'mouse') e.preventDefault();
    press = { x: e.clientX, y: e.clientY, id: e.pointerId };
    last = { x: e.clientX, y: e.clientY };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    if (opts.inScroller) hold = setTimeout(begin, HOLD_MS);
  });
  el.addEventListener('click', (e) => {
    if (swallowClick) { e.stopImmediatePropagation(); e.preventDefault(); swallowClick = false; }
  }, true);
}

/** Is the point over this element? */
export function isOver(target: Element | null, x: number, y: number): boolean {
  if (!target) return false;
  const r = target.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}
