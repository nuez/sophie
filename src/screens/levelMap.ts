import { h } from '../ui/dom';
import { icon } from '../art/icons';
import { topbar } from '../ui/topbar';
import { LEVELS } from '../math/levels';
import { masteredLevel } from '../progress/levelProgress';
import { say } from '../audio/speech';
import type { Screen } from '../app';

export const levelMapScreen: Screen = (root, app) => {
  const s = app.state;
  const path = h('div', { class: 'map-path' });
  LEVELS.forEach((L, i) => {
    const locked = L.id > s.unlocked;
    const done = masteredLevel(s.levels[L.id]);
    const b = h('button', {
      class: `map-node ${locked ? 'locked' : ''} ${L.id === s.current ? 'current' : ''} ${i % 2 ? 'low' : 'high'}`,
      onclick: () => {
        if (locked) { say(['nivel_bloqueado']); b.classList.add('wiggle'); setTimeout(() => b.classList.remove('wiggle'), 500); return; }
        app.update((st) => { st.current = L.id; });
        app.go('play');
      },
    },
      h('span', { class: 'node-num' }, String(L.id)),
      h('span', { class: 'node-ex' }, L.example),
      locked ? icon('lock', 26) : done ? icon('star', 28) : null,
    );
    path.append(b);
  });
  root.append(topbar(app, { home: true, title: 'Niveles' }).el, h('div', { class: 'map-scroll' }, path));
  say(['mapa']);
};
