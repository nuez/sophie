import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/patrick-hand/400.css';
import './styles.css';
import { createApp, type ScreenId, type Screen } from './app';
import { load, save } from './state/store';
import { applyVisit, growth } from './pet/petState';
import { h } from './ui/dom';
import { petSvg } from './art/pets';
import { homeScreen } from './screens/home';
import { choosePetScreen } from './screens/choosePet';
import { playScreen } from './screens/play';
import { careScreen } from './screens/care';
import { shopScreen } from './screens/shop';
import { levelMapScreen } from './screens/levelMap';
import { parentsScreen } from './screens/parents';
import { preload, ALL_CLIPS } from './audio/speech';

const screens: Record<ScreenId, Screen> = {
  home: homeScreen, choose: choosePetScreen, play: playScreen, care: careScreen,
  shop: shopScreen, map: levelMapScreen, parents: parentsScreen,
};

const root = document.getElementById('app')!;
const state = applyVisit(load(), Date.now());
save(state);
const app = createApp(root, state, screens);
(window as any).__app = app; // handy for debugging from the console

// Browsers only allow sound after a tap, so start with a big friendly button.
root.append(h('div', { class: 'splash' },
  state.pet
    ? h('div', { class: 'splash-pet' }, petSvg(state.pet.kind, { growth: growth(state.unlocked), mood: state.scruffy ? 'despeinado' : 'feliz', equipped: state.pet.equipped }))
    : h('div', { class: 'splash-pets' }, ...(['gato', 'perro', 'conejo', 'dragon'] as const).map((k) => petSvg(k, { growth: 0, mood: 'feliz', equipped: [] }))),
  h('h1', {}, 'Mates con mi mascota'),
  h('button', { class: 'big', onclick: () => { preload(ALL_CLIPS); app.go(state.pet ? 'home' : 'choose'); } }, '¡Hola! ▶'),
));
