import { clear } from './ui/dom';
import { save, type AppState, type Settings } from './state/store';
import { CONFIG } from './config';
import { setVoiceSettings, stopSpeech } from './audio/speech';

/** The saved voice setting, unless the voice is switched off for the whole game. */
export const voiceSettings = (s: Settings) => ({ voice: CONFIG.voice && s.voice, rate: s.rate });

export type ScreenId = 'home' | 'choose' | 'play' | 'care' | 'shop' | 'map' | 'parents';
export type Screen = (root: HTMLElement, app: App, params?: any) => (() => void) | void;

export interface App {
  state: AppState;
  update(fn: (s: AppState) => void): void;
  go(screen: ScreenId, params?: any): void;
}

export function createApp(root: HTMLElement, state: AppState, screens: Record<ScreenId, Screen>): App {
  let cleanup: (() => void) | void;
  const app: App = {
    state,
    update(fn) {
      fn(app.state);
      setVoiceSettings(voiceSettings(app.state.settings));
      save(app.state);
    },
    go(screen, params) {
      stopSpeech();
      try { cleanup?.(); } catch { /* ignore */ }
      clear(root);
      const holder = document.createElement('div');
      holder.className = `screen screen-${screen}`;
      root.append(holder);
      cleanup = screens[screen](holder, app, params);
    },
  };
  setVoiceSettings(voiceSettings(state.settings));
  return app;
}
