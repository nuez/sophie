import { describe, it, expect } from 'vitest';
import { payFlow } from '../src/screens/pay';
import { itemById } from '../src/pet/catalog';

const corona = itemById('corona')!; // 3,45 €
const coin = (el: HTMLElement, label: string) => el.querySelector<HTMLButtonElement>(`.pay-coin[aria-label="Poner ${label}"]`)!;
const pagar = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('.pay-go')!;

describe('paying with coins', () => {
  it('she puts coins down until it is enough, pays, and sees her change', async () => {
    const f = payFlow(corona, 655);
    expect(pagar(f.el).disabled).toBe(true);
    coin(f.el, '2 euros').click();
    coin(f.el, '1 euro').click();
    expect(f.el.querySelector('.pay-total')!.textContent).toBe('3,00 €');
    expect(f.el.querySelector('.pay-left')!.textContent).toContain('0,45 €');
    coin(f.el, '50 céntimos').click();
    expect(f.el.querySelector('.pay-question')!.textContent).toContain('Ya llega');
    expect(coin(f.el, '1 euro').disabled).toBe(true); // enough: no more coins
    pagar(f.el).click();
    expect(f.el.querySelector('.pay-back')!.textContent).toContain('0,05 €');
    expect(f.el.querySelectorAll('.change-coins .coin')).toHaveLength(1);
    f.el.querySelector<HTMLButtonElement>('.pay-result button')!.click();
    expect(await f.done).toBe(true);
  });

  it('a coin she put down can be taken back', () => {
    const f = payFlow(corona, 655);
    coin(f.el, '2 euros').click();
    f.el.querySelector<HTMLButtonElement>('.tray-coin')!.click();
    expect(f.el.querySelector('.pay-total')!.textContent).toBe('0,00 €');
  });

  it('cannot put down more than her purse holds', () => {
    const f = payFlow(corona, 350);
    coin(f.el, '2 euros').click();
    coin(f.el, '1 euro').click();
    expect(coin(f.el, '2 euros').disabled).toBe(true);
    expect(coin(f.el, '50 céntimos').disabled).toBe(false);
  });

  it('with 3,47 € she puts the missing cents down and pays exactly', () => {
    const f = payFlow(corona, 347);
    coin(f.el, '2 euros').click();
    coin(f.el, '1 euro').click();
    f.el.querySelector<HTMLButtonElement>('.pay-small')!.click();
    pagar(f.el).click();
    expect(f.el.querySelector('.pay-back')!.textContent).toContain('Justo');
  });

  it('✕ backs out without paying', async () => {
    const f = payFlow(corona, 655);
    f.el.querySelector<HTMLButtonElement>('[aria-label="No comprar"]')!.click();
    expect(await f.done).toBe(false);
  });
});
