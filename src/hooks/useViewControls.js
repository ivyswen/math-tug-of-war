import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  calculateViewState,
  clamp,
  getFullscreenIconClass,
  getFullscreenLabel,
} from '../lib/viewControls';

const VIEW_CONFIG = {
  storageKey: 'arqonZoomPercent',
  minPercent: 60,
  maxPercent: 150,
  stepPercent: 10,
  defaultPercent: 100,
};

const AUDIO_CONFIG = {
  mutedStorageKey: 'arqonAudioMuted',
};

function getSavedZoomPercent() {
  const raw = localStorage.getItem(VIEW_CONFIG.storageKey);
  const parsed = Number.parseInt(raw || '', 10);
  if (!Number.isFinite(parsed)) {
    return VIEW_CONFIG.defaultPercent;
  }

  return clamp(parsed, VIEW_CONFIG.minPercent, VIEW_CONFIG.maxPercent);
}

function getSavedMutedState() {
  const raw = localStorage.getItem(AUDIO_CONFIG.mutedStorageKey);
  return raw === '1';
}

export function useViewControls({ setupVisible }) {
  const [zoomPercent, setZoomPercent] = useState(getSavedZoomPercent);
  const [zoomMaxPercent, setZoomMaxPercent] = useState(VIEW_CONFIG.maxPercent);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isMuted, setIsMuted] = useState(getSavedMutedState);

  const applyViewState = useCallback(
    (requestedZoomPercent = zoomPercent) => {
      const stage = document.getElementById('gameStage');
      const board = document.getElementById('gameBoard');
      const shell = document.querySelector('.game-shell');
      const modalContent = document.querySelector('#startScreen .modal-content');
      const startScreen = document.getElementById('startScreen');

      if (!stage || !board || !shell || !shell.clientWidth || !shell.clientHeight || !board.offsetWidth || !board.offsetHeight) {
        return;
      }

      stage.style.setProperty('--game-scale', '1');

      const styles = window.getComputedStyle(shell);
      const paddingX =
        Number.parseFloat(styles.paddingLeft || '0') + Number.parseFloat(styles.paddingRight || '0');
      const paddingY =
        Number.parseFloat(styles.paddingTop || '0') + Number.parseFloat(styles.paddingBottom || '0');

      const result = calculateViewState({
        shellWidth: shell.clientWidth,
        shellHeight: shell.clientHeight,
        paddingX,
        paddingY,
        boardWidth: board.offsetWidth,
        boardHeight: board.offsetHeight,
        modalVisible: Boolean(startScreen && window.getComputedStyle(startScreen).display !== 'none' && setupVisible),
        modalWidth: modalContent?.offsetWidth || 0,
        modalHeight: modalContent?.offsetHeight || 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        zoomPercent: requestedZoomPercent,
        minPercent: VIEW_CONFIG.minPercent,
        maxPercent: VIEW_CONFIG.maxPercent,
      });

      setZoomMaxPercent(result.zoomMaxPercent);
      setZoomPercent(result.zoomPercent);
      localStorage.setItem(VIEW_CONFIG.storageKey, String(result.zoomPercent));

      stage.style.setProperty('--game-scale', result.gameScale.toFixed(4));
      if (modalContent) {
        modalContent.style.setProperty('--modal-scale', result.modalScale.toFixed(4));
      }

      window.__ARQON_REACT_RUNTIME__?.autoFitAllProblemTexts?.();
    },
    [setupVisible, zoomPercent],
  );

  useEffect(() => {
    applyViewState(zoomPercent);
  }, [applyViewState, zoomPercent]);

  useEffect(() => {
    const handleResize = () => applyViewState();
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      applyViewState();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [applyViewState]);

  useEffect(() => {
    localStorage.setItem(AUDIO_CONFIG.mutedStorageKey, isMuted ? '1' : '0');

    const audio = document.getElementById('backgroundMusic');
    if (audio) {
      audio.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const audio = document.getElementById('backgroundMusic');
    if (!audio) return;

    const syncMutedState = () => {
      setIsMuted(Boolean(audio.muted));
    };

    syncMutedState();
    audio.addEventListener('volumechange', syncMutedState);

    return () => {
      audio.removeEventListener('volumechange', syncMutedState);
    };
  }, []);

  const changeZoom = useCallback(
    (deltaPercent) => {
      applyViewState(zoomPercent + deltaPercent);
    },
    [applyViewState, zoomPercent],
  );

  const resetZoom = useCallback(() => {
    applyViewState(VIEW_CONFIG.defaultPercent);
  }, [applyViewState]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch (_) {}
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => !current);
  }, []);

  return useMemo(
    () => ({
      zoomLabel: `${zoomPercent}%`,
      canZoomOut: zoomPercent > VIEW_CONFIG.minPercent,
      canZoomIn: zoomPercent < zoomMaxPercent,
      fullscreenLabel: getFullscreenLabel(isFullscreen),
      fullscreenIconClass: getFullscreenIconClass(isFullscreen),
      muteLabel: isMuted ? 'Unmute audio' : 'Mute audio',
      muteIconClass: isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high',
      onZoomOut: () => changeZoom(-VIEW_CONFIG.stepPercent),
      onZoomIn: () => changeZoom(VIEW_CONFIG.stepPercent),
      onZoomReset: resetZoom,
      onToggleMute: toggleMute,
      onToggleFullscreen: toggleFullscreen,
    }),
    [changeZoom, isFullscreen, isMuted, resetZoom, toggleFullscreen, toggleMute, zoomMaxPercent, zoomPercent],
  );
}
