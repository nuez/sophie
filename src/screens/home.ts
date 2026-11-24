import { h } from '../ui/dom';
import { icon } from '../art/icons';
import { topbar } from '../ui/topbar';
import { onLongPress } from '../ui/longpress';
import { say } from '../audio/speech';
import { room } from './room';
import type { Screen } from '../app';

export const homeScreen: Screen = (root, app) => {
  const s = app.state;
  if (!s.pet) return app.go('choose');
  const pet = s.pet;
  const r = room(s, s.scruffy ? 'despeinado' : 'feliz');
  const tb = topbar(app);
  const corner = h('div', { class: 'parents-door', 'aria-hidden': 'true' });
  onLongPress(corner, 3000, () => app.go('parents'));

  let busy = false;
  r.petHolder.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    r.draw(s.scruffy ? 'despeinado' : 'ronroneo');
    r.petHolder.classList.add('bounce');
    await say(s.scruffy ? ['me_cepillas'] : [pet.gender === 'chica' ? 'que_contenta' : 'que_contento']);
    r.petHolder.classList.remove('bounce');
    r.draw(s.scruffy ? 'despeinado' : 'feliz');
    busy = false;
  });

  root.append(
    tb.el,
    r.el,
    corner,
    h('div', { class: 'pet-name' }, pet.name),
    h('div', { class: 'home-actions' },
      h('button', { class: 'round-btn', onclick: () => app.go('shop') }, icon('shop', 48), h('span', {}, 'Tienda')),
      h('button', { class: 'big play-btn', onclick: () => app.go('play') }, '¡A jugar!'),
      h('button', { class: 'round-btn', onclick: () => app.go('map') }, icon('map', 48), h('span', {}, 'Niveles')),
    ),
  );
  if (s.scruffy) say(['hola', '@name', 'te_echaba_de_menos', 'me_cepillas'], { name: pet.name });
  else say(['hola', '@name'], { name: pet.name });
};
