import { h } from '../ui/dom';
import { icon } from '../art/icons';

export interface Pad {
  el: HTMLElement;
  value: string;
  clear(): void;
  set(v: string): void;
  glow(digits: string | null): void;
  enable(on: boolean): void;
}

/** Big number pad: 0–9, borrar and a green ✓. Nothing is judged until ✓ (spec §15). */
export function createPad(onChange: (v: string) => void, onCheck: (v: string) => void, maxLen = 2): Pad {
  let value = '';
  let enabled = true;
  const keys: Record<string, HTMLElement> = {};
  const check = h('button', { class: 'pad-key check', 'aria-label': 'Comprobar', disabled: true, onclick: () => { if (enabled && value) onCheck(value); } }, icon('check', 44));
  const update = () => {
    onChange(value);
    check.toggleAttribute('disabled', !value || !enabled);
  };
  const digit = (d: string) => {
    const b = h('button', { class: 'pad-key', onclick: () => { if (!enabled) return; if (value.length < maxLen) value = value === '0' ? d : value + d; update(); } }, d);
    keys[d] = b;
    return b;
  };
  const el = h('div', { class: 'pad' },
    ...['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(digit),
    h('button', { class: 'pad-key back', 'aria-label': 'Borrar', onclick: () => { if (!enabled) return; value = value.slice(0, -1); update(); } }, icon('back', 40)),
    digit('0'),
    check,
  );
  const pad: Pad = {
    el,
    get value() { return value; },
    clear() { value = ''; update(); },
    set(v) { value = v; update(); },
    glow(digits) {
      for (const [d, k] of Object.entries(keys)) k.classList.toggle('glow', !!digits && digits.includes(d));
    },
    enable(on) { enabled = on; el.classList.toggle('disabled', !on); update(); },
  };
  return pad;
}
