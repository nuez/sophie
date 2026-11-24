import { describe, it, expect, vi, beforeEach } from 'vitest';
import phrases from '../src/audio/phrases.json';
import { num, dedos, levanta, say, setAudioFactory, setVoiceSettings } from '../src/audio/speech';

class NeverEnds {
  src = ''; playbackRate = 1; currentTime = 0;
  listeners: Record<string, () => void> = {};
  addEventListener(e: string, f: () => void) { this.listeners[e] = f; }
  removeEventListener() {}
  play() { return Promise.resolve(); }
  pause() {}
}
class EndsAtOnce extends NeverEnds {
  static played: string[] = [];
  play() { EndsAtOnce.played.push(this.src); setTimeout(() => this.listeners['ended']?.(), 0); return Promise.resolve(); }
}

describe('speech', () => {
  beforeEach(() => setVoiceSettings({ voice: true, rate: 1 }));

  it('every generated id exists in phrases.json', () => {
    const ids = [
      ...Array.from({ length: 20 }, (_, i) => num(i)),
      ...Array.from({ length: 11 }, (_, i) => dedos(i)),
      ...Array.from({ length: 10 }, (_, i) => levanta(i + 1)),
    ];
    for (const id of ids) expect(phrases).toHaveProperty(id);
  });

  it('resolves even when a clip never ends (timeout)', async () => {
    vi.useFakeTimers();
    setAudioFactory(() => new NeverEnds() as unknown as HTMLAudioElement);
    const p = say(['hola', 'genial']);
    await vi.advanceTimersByTimeAsync(9000);
    await expect(p).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('plays clips in order', async () => {
    EndsAtOnce.played = [];
    setAudioFactory(() => new EndsAtOnce() as unknown as HTMLAudioElement);
    await say(['hola', num(5)]);
    expect(EndsAtOnce.played.map((s) => s.split('/').pop())).toEqual(['hola.mp3', 'n5.mp3']);
  });

  it('voice off resolves immediately without playing', async () => {
    EndsAtOnce.played = [];
    setAudioFactory(() => new EndsAtOnce() as unknown as HTMLAudioElement);
    setVoiceSettings({ voice: false, rate: 1 });
    await say(['hola']);
    expect(EndsAtOnce.played).toEqual([]);
  });

  it('a play() that rejects (autoplay blocked) does not hang', async () => {
    class Rejects extends NeverEnds { play() { return Promise.reject(new Error('NotAllowed')); } }
    setAudioFactory(() => new Rejects() as unknown as HTMLAudioElement);
    await expect(say(['hola'])).resolves.toBeUndefined();
  });
});

import { stopSpeech } from '../src/audio/speech';
describe('stopSpeech', () => {
  it('resolves the clip in flight right away instead of waiting for the timeout', async () => {
    vi.useFakeTimers();
    setVoiceSettings({ voice: true, rate: 1 });
    setAudioFactory(() => new NeverEnds() as unknown as HTMLAudioElement);
    let done = false;
    const p = say(['hola']).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(10);
    stopSpeech();
    await vi.advanceTimersByTimeAsync(10);
    expect(done).toBe(true);
    await p;
    vi.useRealTimers();
  });
});
