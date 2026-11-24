import { CONFIG } from '../config';
import phrases from './phrases.json';

export type Clip = string;

export const num = (n: number): Clip => `n${n}`;
export const dedos = (n: number): Clip => `dedos${n}`;
export const levanta = (n: number): Clip => `levanta${n}`;
export const hasClip = (id: string) => id in phrases;

const BASE = (import.meta as any).env?.BASE_URL ?? '/';
const urlFor = (id: Clip) => `${BASE}audio/${id}.mp3`;

let makeAudio: () => HTMLAudioElement = () => new Audio();
let settings = { voice: true, rate: 1 };
let token = 0;
let current: HTMLAudioElement | null = null;
let currentFinish: (() => void) | null = null;

export function setAudioFactory(f: () => HTMLAudioElement) { makeAudio = f; }
export function setVoiceSettings(s: { voice: boolean; rate: number }) { settings = { ...s }; }

export function stopSpeech() {
  token++;
  try { current?.pause(); } catch { /* ignore */ }
  current = null;
  const f = currentFinish;
  currentFinish = null;
  f?.();
  try { globalThis.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

function playOne(id: Clip, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (my !== token) return resolve();
    const a = makeAudio();
    current = a;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (currentFinish === finish) currentFinish = null;
      resolve();
    };
    currentFinish = finish;
    const timer = setTimeout(finish, CONFIG.clipTimeoutMs);
    a.addEventListener('ended', finish);
    a.addEventListener('error', finish);
    a.src = urlFor(id);
    a.playbackRate = settings.rate;
    try {
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(finish);
    } catch {
      finish();
    }
  });
}

/** Play clips one after another. Always resolves; never blocks the game (Review Focus #2). */
export async function say(clips: Clip[], opts: { name?: string } = {}): Promise<void> {
  stopSpeech();
  const my = token;
  if (!settings.voice) return;
  for (const c of clips) {
    if (my !== token) return;
    if (c === '@name') {
      if (opts.name) await speakName(opts.name, my);
      continue;
    }
    if (!hasClip(c)) continue;
    await playOne(c, my);
  }
}

const SUGGESTED = ['Luna', 'Coco', 'Nube', 'Kiwi', 'Chispa', 'Pipo'];
export const SUGGESTED_NAMES = SUGGESTED;
const nameClip = (name: string) => `nombre_${name.toLowerCase()}`;

/** Speak the pet's name: pre-recorded if suggested, else the browser's Spanish voice, else nothing. */
export function speakName(name: string, my = token): Promise<void> {
  if (!settings.voice || my !== token) return Promise.resolve();
  if (hasClip(nameClip(name))) return playOne(nameClip(name), my);
  const synth = globalThis.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return Promise.resolve();
  const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('es-es')) ?? synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('es'));
  if (!voice) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(name);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = settings.rate;
    const timer = setTimeout(resolve, CONFIG.clipTimeoutMs);
    u.onend = u.onerror = () => { clearTimeout(timer); resolve(); };
    synth.speak(u);
  });
}

const PRAISE = ['muy_bien', 'genial', 'eso_es', 'fantastico', 'perfecto', 'bravo'];
let praiseIdx = 0;
export const praise = (): Clip => PRAISE[praiseIdx++ % PRAISE.length];

/** Warm the browser cache so clips start instantly. */
export function preload(ids: Clip[]) {
  for (const id of ids) {
    try { fetch(urlFor(id)).catch(() => {}); } catch { /* ignore */ }
  }
}
export const ALL_CLIPS = Object.keys(phrases);
