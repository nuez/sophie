/** Fire `fn` after the element is held down for `ms` (the hidden parents' door). */
export function onLongPress(el: HTMLElement, ms: number, fn: () => void) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const start = () => { t = setTimeout(fn, ms); };
  const cancel = () => { if (t) clearTimeout(t); t = undefined; };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
}
