import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLegacyGameBoot } from './useLegacyGameBoot';

vi.mock('../lib/loadScript', () => ({
  loadScript: vi.fn(() => Promise.resolve()),
}));

const { loadScript } = await import('../lib/loadScript');

describe('useLegacyGameBoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = '';
    document.documentElement.lang = 'en';
    window.__TUG_AUDIO_PANEL__ = undefined;
    window.initTugOfWarGame = vi.fn();
  });

  it('sets page globals and boots legacy scripts in order', async () => {
    renderHook(() => useLegacyGameBoot());

    await vi.waitFor(() => {
      expect(loadScript).toHaveBeenNthCalledWith(1, '/game/arqon/i18n.js');
      expect(loadScript).toHaveBeenNthCalledWith(2, '/game/assets/scripts/audio-panel.js');
      expect(loadScript).toHaveBeenNthCalledWith(3, '/game/arqon/script.js');
    });

    expect(document.title).toBe('Tug of War: Mathematics');
    expect(document.documentElement.lang).toBe('en');
    expect(window.__TUG_AUDIO_PANEL__).toMatchObject({
      defaultAudioId: 'audio',
      audioElementId: 'backgroundMusic',
    });

    await vi.waitFor(() => {
      expect(window.initTugOfWarGame).toHaveBeenCalledTimes(1);
    });
  });
});
