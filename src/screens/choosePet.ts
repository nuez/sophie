import { h } from '../ui/dom';
import { petSvg } from '../art/pets';
import { say, SUGGESTED_NAMES } from '../audio/speech';
import type { Screen } from '../app';
import type { Gender, PetKind } from '../state/store';

const KINDS: PetKind[] = ['gato', 'perro', 'conejo', 'dragon'];
const LETTERS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

export const choosePetScreen: Screen = (root, app) => {
  let kind: PetKind = 'gato';
  let gender: Gender = 'chica';
  // one tap per step: a double tap must not jump back a step after the voice ends
  let busy = false;
  const guard = (fn: () => Promise<void>) => async () => {
    if (busy) return;
    busy = true;
    try { await fn(); } finally { busy = false; }
  };

  const stepKind = () => {
    root.replaceChildren(
      h('h1', { class: 'choose-title' }, 'Elige tu mascota'),
      h('div', { class: 'choose-grid' }, ...KINDS.map((k) =>
        h('button', { class: 'choose-card', onclick: guard(async () => { kind = k; await say([k]); stepGender(); }) },
          petSvg(k, { growth: 0, mood: 'feliz', equipped: [] })))),
    );
    say(['elige_mascota']);
  };

  const stepGender = () => {
    const card = (g: Gender, item: string, label: string) =>
      h('button', { class: 'choose-card', onclick: guard(async () => { gender = g; await say([g]); stepName(); }) },
        petSvg(kind, { growth: 0, mood: 'feliz', equipped: [item] }), h('span', { class: 'card-label' }, label));
    root.replaceChildren(
      h('h1', { class: 'choose-title' }, '¿Es chica o chico?'),
      h('div', { class: 'choose-grid two' }, card('chica', 'lazo-rosa', 'Chica'), card('chico', 'pajarita', 'Chico')),
    );
    say(['chica_o_chico']);
  };

  const finish = (name: string) => {
    app.update((s) => { s.pet = { kind, gender, name, equipped: [] }; });
    app.go('home');
  };

  const stepName = () => {
    root.replaceChildren(
      h('h1', { class: 'choose-title' }, '¿Cómo se llama?'),
      h('div', { class: 'name-row' },
        h('div', { class: 'name-pet' }, petSvg(kind, { growth: 0, mood: 'feliz', equipped: [gender === 'chica' ? 'lazo-rosa' : 'pajarita'] })),
        h('div', { class: 'name-grid' },
          ...SUGGESTED_NAMES.map((n) => h('button', { class: 'name-btn', onclick: guard(async () => { await say([`nombre_${n.toLowerCase()}`]); finish(n); }) }, n)),
          h('button', { class: 'name-btn write', onclick: stepKeyboard }, '✏️ Escribir'),
        ),
      ),
    );
    say(['como_se_llama']);
  };

  const stepKeyboard = () => {
    let name = '';
    const out = h('div', { class: 'name-out' }, '');
    const ok = h('button', { class: 'big', disabled: true, onclick: () => name && finish(name) }, '¡Listo!');
    const refresh = () => {
      out.textContent = name || ' ';
      ok.toggleAttribute('disabled', name.length === 0);
    };
    root.replaceChildren(
      h('h1', { class: 'choose-title' }, 'Escribe su nombre'),
      out,
      h('div', { class: 'keyboard' },
        ...LETTERS.map((L) => h('button', { class: 'key', onclick: () => { if (name.length < 12) name += name ? L.toLowerCase() : L; refresh(); } }, L)),
        h('button', { class: 'key wide', onclick: () => { name = name.slice(0, -1); refresh(); } }, '⌫'),
      ),
      h('div', { class: 'kb-actions' }, h('button', { onclick: stepName }, '← Volver'), ok),
    );
    refresh();
  };

  stepKind();
};
