import { describe, it, expect } from 'vitest';
import { h } from '../src/ui/dom';

describe('h()', () => {
  it('builds an element with class and text', () => {
    expect(h('div', { class: 'x' }, 'hi').outerHTML).toBe('<div class="x">hi</div>');
  });
  it('wires on* attributes as listeners', () => {
    let clicked = 0;
    const b = h('button', { onclick: () => clicked++ });
    b.click();
    expect(clicked).toBe(1);
  });
  it('skips null and false children', () => {
    expect(h('p', {}, null, false, 'a').outerHTML).toBe('<p>a</p>');
  });
});
