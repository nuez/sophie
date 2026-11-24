import { h, svgEl, wait } from '../ui/dom';
import { icon } from '../art/icons';
import { geometry, heartPath, tanglePoints, type Mood } from '../art/pets';
import { topbar } from '../ui/topbar';
import { growth, nextActivity, type ActivityId } from '../pet/petState';
import { say, type Clip } from '../audio/speech';
import { room } from './room';
import type { Screen } from '../app';
import type { PetKind } from '../state/store';

const TREAT: Record<PetKind, string> = { gato: '🐟', perro: '🦴', conejo: '🥕', dragon: '🍓' };
const INSTR: Record<ActivityId, [Clip, string]> = {
  cepillar: ['cepillar_instr', 'Cepíllale el pelo: pasa el cepillo por los nudos.'],
  acariciar: ['acariciar_instr', 'Acaríciale con el dedo.'],
  comer: ['comer_instr', 'Dale su premio: arrástralo hasta la boca.'],
  banar: ['banar_instr', '¡Hora del baño! Frota para hacer espuma.'],
  lazo: ['lazo_instr', 'Elige un lazo bonito.'],
  pelota: ['pelota_instr', '¡Lánzale la pelota! Tócala.'],
};

export const careScreen: Screen = (root, app, params?: { test?: boolean; activity?: ActivityId }) => {
  const s = app.state;
  if (!s.pet) return app.go('choose');
  const pet = s.pet;
  const activity: ActivityId = params?.activity ?? nextActivity(s);
  const g = geometry(growth(s.unlocked));
  const startMood: Mood = s.scruffy ? 'despeinado' : 'feliz';
  const r = room(s, startMood, activity === 'cepillar' ? { tangles: s.scruffy ? 6 : 4 } : {});
  const stage = h('div', { class: 'care-stage' }, r.el);
  const fx = h('div', { class: 'care-fx' });
  stage.append(fx);
  const [clip, text] = INSTR[activity];
  let finished = false;
  const cleanups: (() => void)[] = [];

  const petSvgEl = () => r.petHolder.querySelector('svg') as SVGSVGElement;
  const toSvg = (x: number, y: number) => {
    const svg = petSvgEl();
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const fromSvg = (x: number, y: number) => {
    const svg = petSvgEl();
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    const p = pt.matrixTransform(svg.getScreenCTM()!);
    const box = stage.getBoundingClientRect();
    return { x: p.x - box.left, y: p.y - box.top };
  };
  const float = (x: number, y: number, content: Node | string, cls = 'float') => {
    const box = stage.getBoundingClientRect();
    const el = h('div', { class: cls, style: `left:${x - box.left}px;top:${y - box.top}px` }, content);
    fx.append(el);
    setTimeout(() => el.remove(), 1200);
  };
  const heart = () => { const sv = svgEl('svg', { viewBox: '0 0 32 32', width: 34, height: 34 }); sv.append(svgEl('path', { d: heartPath(16, 16, 11), fill: '#f2708c' })); return sv; };
  let tempBow: SVGGElement | null = null;
  const mood = (m: Mood, extra?: any) => {
    r.draw(m, extra);
    if (tempBow) petSvgEl().querySelector('.pet-root')?.append(tempBow);
  };

  const finish = async () => {
    if (finished) return;
    finished = true;
    cleanups.forEach((c) => c());
    app.update((st) => { if (activity === 'cepillar' || !st.scruffy) st.scruffy = false; st.careRotation += 1; });
    mood('emocion');
    const go = h('button', { class: 'big' }, '¡Seguimos!');
    go.addEventListener('click', () => app.go(params?.test ? 'parents' : 'play'));
    root.querySelector('.bow-row')?.remove();
    root.append(h('div', { class: 'overlay low' }, h('div', { class: 'overlay-card row' }, h('h2', {}, '¡Gracias!'), go)));
    await say([pet.gender === 'chica' ? 'que_contenta' : 'que_contento', 'gracias_seguimos']);
  };

  const tb = topbar(app, { home: !!params?.test });
  root.append(
    tb.el,
    h('h1', { class: 'care-title' }, `¡Hora de mimar a ${pet.name}!`),
    stage,
    h('div', { class: 'care-instr' }, text),
    h('button', { class: 'skip-btn', onclick: () => { cleanups.forEach((c) => c()); app.update((st) => { st.careRotation += 1; }); app.go(params?.test ? 'parents' : 'play'); } }, 'seguir →'),
  );

  (async () => {
    await say(['hora_de_mimar_a', '@name', clip], { name: pet.name });
  })();

  // ── activities ──
  const onPointer = (el: HTMLElement, fn: (e: PointerEvent, phase: 'down' | 'move' | 'up') => void) => {
    let down = false;
    const d = (e: PointerEvent) => { down = true; el.setPointerCapture?.(e.pointerId); fn(e, 'down'); };
    const m = (e: PointerEvent) => { if (down) fn(e, 'move'); };
    const u = (e: PointerEvent) => { if (down) { down = false; fn(e, 'up'); } };
    el.addEventListener('pointerdown', d);
    el.addEventListener('pointermove', m);
    el.addEventListener('pointerup', u);
    el.addEventListener('pointercancel', u);
    cleanups.push(() => { el.removeEventListener('pointerdown', d); el.removeEventListener('pointermove', m); el.removeEventListener('pointerup', u); });
  };

  if (activity === 'cepillar') {
    const brush = h('div', { class: 'tool brush hidden' }, icon('brush', 72));
    fx.append(brush);
    const pts = tanglePoints(g).slice(0, s.scruffy ? 6 : 4);
    const hits = pts.map(() => 0);
    let left = pts.length;
    onPointer(stage, (e, phase) => {
      const box = stage.getBoundingClientRect();
      brush.style.left = `${e.clientX - box.left}px`;
      brush.style.top = `${e.clientY - box.top}px`;
      brush.classList.toggle('hidden', phase === 'up');
      if (phase === 'up') return;
      const p = toSvg(e.clientX, e.clientY);
      pts.forEach(([x, y], i) => {
        if (hits[i] >= 4) return;
        if (Math.hypot(p.x - x, p.y - y) < 24) {
          hits[i]++;
          if (hits[i] === 4) {
            petSvgEl().querySelector(`.tangle[data-i="${i}"]`)?.classList.add('gone');
            float(e.clientX, e.clientY, '✨', 'float sparkle');
            left--;
            if (left === 0) {
              petSvgEl().querySelector('.tufts')?.classList.add('gone');
              finish();
            }
          }
        }
      });
    });
  }

  if (activity === 'acariciar') {
    let dist = 0, last: { x: number; y: number } | null = null, purring = false;
    onPointer(r.petHolder, (e, phase) => {
      if (phase === 'down') { last = { x: e.clientX, y: e.clientY }; return; }
      if (phase === 'up') { last = null; return; }
      if (!last) return;
      const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      const before = Math.floor(dist / 140);
      dist += d;
      last = { x: e.clientX, y: e.clientY };
      if (!purring) { purring = true; mood('ronroneo'); r.petHolder.classList.add('wiggle-soft'); }
      if (Math.floor(dist / 140) > before) float(e.clientX, e.clientY - 30, heart());
      if (dist > 1400) finish();
    });
  }

  if (activity === 'comer') {
    let eaten = 0;
    const treat = h('div', { class: 'tool treat' }, TREAT[pet.kind]);
    fx.append(treat);
    const home = () => { treat.style.left = '82%'; treat.style.top = '72%'; };
    home();
    onPointer(treat, async (e, phase) => {
      const box = stage.getBoundingClientRect();
      if (phase !== 'up') { treat.style.left = `${e.clientX - box.left}px`; treat.style.top = `${e.clientY - box.top}px`; return; }
      const p = toSvg(e.clientX, e.clientY);
      if (Math.hypot(p.x - g.hx, p.y - (g.hy + g.r * 0.35)) < 40) {
        eaten++;
        treat.classList.add('hidden');
        mood('comiendo');
        float(e.clientX, e.clientY - 20, heart());
        await wait(900);
        mood('feliz');
        if (eaten >= 3) return finish();
        treat.classList.remove('hidden');
      }
      home();
    });
  }

  if (activity === 'banar') {
    let bubbles = 0;
    const layer = svgEl('g', { class: 'soap' });
    const ensureLayer = () => { const svg = petSvgEl(); if (!layer.isConnected) svg.append(layer); };
    const shower = h('button', { class: 'tool-btn hidden', onclick: async () => {
      shower.classList.add('hidden');
      for (let i = 0; i < 14; i++) {
        const c = fromSvg(60 + Math.random() * 80, 20 + Math.random() * 40);
        const box = stage.getBoundingClientRect();
        float(c.x + box.left, c.y + box.top, '💧', 'float drop');
      }
      layer.classList.add('gone');
      await wait(800);
      finish();
    } }, icon('shower', 56), h('span', {}, 'Ducha'));
    stage.append(shower);
    onPointer(r.petHolder, (e, phase) => {
      if (phase === 'up') return;
      ensureLayer();
      if (bubbles >= 26 || Math.random() < 0.55) return;
      const p = toSvg(e.clientX, e.clientY);
      layer.append(svgEl('circle', { cx: p.x, cy: p.y, r: 6 + Math.random() * 9, fill: 'rgba(255,255,255,.9)', stroke: '#bfe3ff', 'stroke-width': 2 }));
      bubbles++;
      if (bubbles === 26) { shower.classList.remove('hidden'); say(['aclarar']); }
    });
  }

  if (activity === 'lazo') {
    const colours = ['#f48fb1', '#81d4fa', '#fff176', '#ce93d8'];
    const row = h('div', { class: 'bow-row' }, ...colours.map((c) => h('button', { class: 'bow-btn', style: `--bow:${c}`, onclick: async () => {
      const svg = petSvgEl();
      svg.querySelector('.temp-bow')?.remove();
      const bow = svgEl('g', { class: 'temp-bow', transform: `translate(${g.hx - g.r * 0.4} ${g.hy - g.r * 0.85}) scale(${g.r / 50})` });
      bow.append(svgEl('path', { d: 'M0 0 l-20 -13 v26 z M0 0 l20 -13 v26 z', fill: c, stroke: '#3a3533', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      bow.append(svgEl('circle', { cx: 0, cy: 0, r: 6, fill: c, stroke: '#3a3533', 'stroke-width': 1.5 }));
      svg.querySelector('.pet-root')?.append(bow);
      tempBow = bow;
      const b = stage.getBoundingClientRect();
      float(b.left + b.width / 2, b.top + b.height * 0.3, heart());
      await wait(1500);
      finish();
    } })));
    stage.append(row);
  }

  if (activity === 'pelota') {
    let catches = 0;
    const ball = h('div', { class: 'tool ball' }, '⚽');
    fx.append(ball);
    const home = () => { ball.className = 'tool ball'; ball.style.left = '80%'; ball.style.top = '75%'; };
    home();
    ball.addEventListener('pointerdown', async () => {
      if (ball.classList.contains('flying')) return;
      ball.classList.add('flying');
      const c = fromSvg(g.hx, g.hy - g.r);
      ball.style.left = `${c.x}px`;
      ball.style.top = `${c.y}px`;
      await wait(500);
      mood('emocion');
      r.petHolder.classList.remove('bounce'); void r.petHolder.offsetWidth; r.petHolder.classList.add('bounce');
      catches++;
      await wait(700);
      mood('feliz');
      if (catches >= 3) return finish();
      home();
    });
  }

  return () => cleanups.forEach((c) => c());
};
