import { describe, it, expect } from 'vitest';
import { payFlow } from '../src/screens/pay';
import { itemById } from '../src/pet/catalog';

const gafas = itemById('gafas-sol')!; // 3,10 €
const coin = (el: HTMLElement, label: string) => el.querySelector<HTMLButtonElement>(`.pay-coin[aria-label="Poner ${label}"]`)!;
const pagar = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.pay-go')!;

describe('paying with coins', () => {
  it('she puts coins down until it is enough, pays, and sees her change', async () => {
    const f = payFlow(gafas, 655);
    expect(pagar(f.el).disabled).toBe(true);
    coin(f.el, '2 euros').click();
    coin(f.el, '1 euro').click();
    expect(f.el.querySelector('.pay-total')!.textContent).toBe('3,00 €');
    expect(f.el.querySelector('.pay-left')!.textContent).toContain('0,10 €');
    coin(f.el, '50 céntimos').click();
    expect(f.el.querySelector('.pay-question')!.textContent).toContain('Ya llega');
    expect(coin(f.el, '1 euro').disabled).toBe(true); // enough: no more coins
    pagar(f.el).click();
    expect(f.el.querySelector('.pay-back')!.textContent).toContain('0,40 €');
    expect(f.el.querySelectorAll('.change-coins .coin')).toHaveLength(2);
    f.el.querySelector<HTMLButtonElement>('.pay-result button')!.click();
    expect(await f.done).toBe(true);
  });

  it('she can drag a coin onto the counter; the drag is not also a tap', () => {
    const f = payFlow(gafas, 655);
    document.body.append(f.el);
    const c = coin(f.el, '2 euros');
    const tray = f.el.querySelector<HTMLElement>('.pay-tray')!;
    tray.getBoundingClientRect = () => ({ left: 0, top: 300, right: 500, bottom: 380, width: 500, height: 80, x: 0, y: 300, toJSON() {} });
    const ev = (type: string, x: number, y: number) => c.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true }));
    ev('pointerdown', 100, 100);
    ev('pointermove', 100, 200);
    ev('pointermove', 100, 340);
    ev('pointerup', 100, 340);
    c.click(); // the browser's click after a drag
    expect(f.el.querySelector('.pay-total')!.textContent).toBe('2,00 €');
    expect(document.querySelector('.drag-ghost')).toBeNull();
    f.el.remove();
  });

  it('a coin dropped somewhere else is not put down', () => {
    const f = payFlow(gafas, 655);
    document.body.append(f.el);
    const c = coin(f.el, '1 euro');
    f.el.querySelector<HTMLElement>('.pay-tray')!.getBoundingClientRect = () => ({ left: 0, top: 300, right: 500, bottom: 380, width: 500, height: 80, x: 0, y: 300, toJSON() {} });
    const ev = (type: string, x: number, y: number) => c.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true }));
    ev('pointerdown', 100, 100);
    ev('pointermove', 100, 160);
    ev('pointerup', 100, 160);
    expect(f.el.querySelector('.pay-total')!.textContent).toBe('0,00 €');
    f.el.remove();
  });

  it('a coin she put down can be taken back', () => {
    const f = payFlow(gafas, 655);
    coin(f.el, '2 euros').click();
    f.el.querySelector<HTMLButtonElement>('.tray-coin')!.click();
    expect(f.el.querySelector('.pay-total')!.textContent).toBe('0,00 €');
  });

  it('cannot put down more than her purse holds', () => {
    const f = payFlow(gafas, 350);
    coin(f.el, '2 euros').click();
    coin(f.el, '1 euro').click();
    expect(coin(f.el, '2 euros').disabled).toBe(true);
    expect(coin(f.el, '50 céntimos').disabled).toBe(false);
  });

  it('with 3,12 € she puts the missing cents down and pays exactly', () => {
    const f = payFlow(gafas, 312);
    coin(f.el, '2 euros').click();
    coin(f.el, '1 euro').click();
    f.el.querySelector<HTMLButtonElement>('.pay-small')!.click();
    pagar(f.el).click();
    expect(f.el.querySelector('.pay-back')!.textContent).toContain('Justo');
  });

  it('✕ backs out without paying', async () => {
    const f = payFlow(gafas, 655);
    f.el.querySelector<HTMLButtonElement>('[aria-label="No comprar"]')!.click();
    expect(await f.done).toBe(false);
  });
});
