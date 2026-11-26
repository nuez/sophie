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
    // all levels are open: she can jump ahead to a harder one whenever she wants
    const ahead = L.id > s.unlocked;
    const done = masteredLevel(s.levels[L.id]);
    const b = h('button', {
      class: `map-node ${ahead ? 'ahead' : ''} ${L.id === s.current ? 'current' : ''} ${i % 2 ? 'low' : 'high'}`,
      onclick: () => {
        app.update((st) => { st.current = L.id; });
        app.go('play');
      },
    },
      h('span', { class: 'node-num' }, String(L.id)),
      h('span', { class: 'node-ex' }, L.example),
      done ? icon('star', 28) : null,
    );
    path.append(b);
  });
  root.append(topbar(app, { home: true, title: 'Niveles' }).el, h('div', { class: 'map-scroll' }, path));
  say(['mapa']);
};
