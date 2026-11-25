import { h } from '../ui/dom';
import { formatEuros } from '../money/money';
import { topbar } from '../ui/topbar';
import { LEVELS } from '../math/levels';
import { MAX_STAGE, SKILLS, type SkillId } from '../progress/skills';
import { defaultState } from '../state/store';
import type { Screen } from '../app';

const SKILL_NAMES: Record<SkillId, string> = { fingerAdd: 'Contar sumando', fingerSub: 'Contar restando', carry: 'Llevadas (suma)', borrow: 'Llevadas (resta)' };

export const parentsScreen: Screen = (root, app) => {
  const render = () => {
    const s = app.state;
    const rows = LEVELS.map((L) => {
      const st = s.levels[L.id];
      const pct = st && st.recent.length ? Math.round((100 * st.recent.filter(Boolean).length) / st.recent.length) : null;
      return h('tr', { class: L.id > s.unlocked ? 'muted' : '' },
        h('td', {}, String(L.id)), h('td', {}, L.name), h('td', {}, L.example),
        h('td', {}, String(st?.done ?? 0)), h('td', {}, pct === null ? '—' : `${pct}%`));
    });
    const skillRows = SKILLS.map((k) => h('tr', {},
      h('td', {}, SKILL_NAMES[k]),
      h('td', {}, `${s.skills[k].stage} / ${MAX_STAGE[k]}`),
      h('td', {},
        h('button', { class: 'small', onclick: () => { app.update((st) => { st.skills[k] = { ...st.skills[k], stage: Math.max(1, st.skills[k].stage - 1), streak: 0, recent: [] }; }); render(); } }, '−'),
        h('button', { class: 'small', onclick: () => { app.update((st) => { st.skills[k] = { ...st.skills[k], stage: Math.min(MAX_STAGE[k], st.skills[k].stage + 1), streak: 0, recent: [] }; }); render(); } }, '+'),
      )));
    const levelSelect = h('select', { onchange: (e: Event) => { const v = Number((e.target as HTMLSelectElement).value); app.update((st) => { st.unlocked = Math.max(st.unlocked, v); st.current = v; }); render(); } },
      ...LEVELS.map((L) => { const o = h('option', { value: L.id }, `${L.id}. ${L.name}`) as HTMLOptionElement; o.selected = L.id === s.current; return o; }));
    const resetBox = h('div', { class: 'reset-box' });
    const askReset = () => resetBox.replaceChildren(
      h('span', {}, '¿Seguro? Se borra todo: mascota, dinero y progreso.'),
      h('button', { class: 'small danger', onclick: () => { const fresh = defaultState(); app.update((st) => Object.assign(st, fresh)); app.go('choose'); } }, 'Sí, borrar'),
      h('button', { class: 'small', onclick: () => resetBox.replaceChildren(resetBtn) } , 'No'),
    );
    const resetBtn = h('button', { class: 'small danger', onclick: askReset }, 'Empezar de cero…');
    resetBox.append(resetBtn);

    root.replaceChildren(
      topbar(app, { home: true, title: 'Para padres' }).el,
      h('div', { class: 'parents-body' },
        h('section', {},
          h('h2', {}, 'Niveles'),
          h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Nivel'), h('th', {}, 'Ejemplo'), h('th', {}, 'Sumas'), h('th', {}, 'Últimas 10'))), h('tbody', {}, ...rows)),
          h('label', {}, 'Jugar nivel: ', levelSelect),
        ),
        h('section', {},
          h('h2', {}, 'Ayudas (1 = la app lo hace, máx = sola)'),
          h('table', {}, h('tbody', {}, ...skillRows)),
          h('h2', {}, 'Ajustes'),
          h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: s.settings.voice, onchange: (e: Event) => { app.update((st) => { st.settings.voice = (e.target as HTMLInputElement).checked; }); } }), ' Voz activada'),
          h('label', { class: 'row' }, 'Velocidad de la voz ',
            h('input', { type: 'range', min: 0.7, max: 1.1, step: 0.05, value: s.settings.rate, onchange: (e: Event) => { app.update((st) => { st.settings.rate = Number((e.target as HTMLInputElement).value); }); } })),
          h('label', { class: 'row' }, 'Al sumar, empezar a contar desde ',
            (() => { const sel = h('select', { onchange: (e: Event) => { app.update((st) => { st.settings.addStart = (e.target as HTMLSelectElement).value as 'larger' | 'top'; }); } },
              h('option', { value: 'larger' }, 'el número más grande'), h('option', { value: 'top' }, 'el número de arriba')) as HTMLSelectElement; sel.value = s.settings.addStart; return sel; })()),
          h('p', {}, `Dinero: ${formatEuros(s.cents)} · Objetos: ${s.owned.length}`),
          h('button', { class: 'small', onclick: () => app.go('care', { test: true }) }, 'Probar un momento de mimos'),
          h('button', { class: 'small', onclick: () => { app.update((st) => { st.cents += 500; }); render(); } }, '+5 €'),
          resetBox,
        ),
      ),
    );
  };
  render();
};
