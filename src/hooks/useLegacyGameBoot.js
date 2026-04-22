import { useEffect } from 'react';
import { audioPanelConfig } from '../config/audioPanelConfig';
import { loadScript } from '../lib/loadScript';

export function useLegacyGameBoot() {
  useEffect(() => {
    document.title = 'Tug of War: Mathematics';
    document.documentElement.lang = 'en';
    window.__TUG_AUDIO_PANEL__ = audioPanelConfig;

    let cancelled = false;

    const boot = async () => {
      try {
        await loadScript('/game/arqon/i18n.js');
        await loadScript('/game/assets/scripts/audio-panel.js');
        await loadScript('/game/arqon/script.js');

        if (!cancelled && typeof window.initTugOfWarGame === 'function') {
          window.initTugOfWarGame();
        }
      } catch (error) {
        console.error(error);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);
}
