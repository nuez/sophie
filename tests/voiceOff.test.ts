import { describe, it, expect } from 'vitest';
import { voiceSettings } from '../src/app';
import { CONFIG } from '../src/config';

describe('voice switch', () => {
  it('is off for now, whatever the saved setting says', () => {
    expect(CONFIG.voice).toBe(false);
    expect(voiceSettings({ voice: true, rate: 0.9, addStart: 'larger' })).toEqual({ voice: false, rate: 0.9 });
  });
});
