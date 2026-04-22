import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the main game title and setup modal content', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /ARQON TORTISH: MATEMATIKA/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /PREPARE YOUR TEAMS/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /NEXT/i })).toBeInTheDocument();
    expect(document.getElementById('startScreen')).not.toBeNull();
    expect(document.getElementById('countdown')).not.toBeNull();
  });

  it('renders React-driven shell sections around the legacy game area', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    const controls = screen.getByLabelText(/zoom and fullscreen controls/i);
    expect(within(controls).getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(within(controls).getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
  });

  it('controls zoom and fullscreen from React', async () => {
    localStorage.setItem('arqonZoomPercent', '100');
    const requestFullscreen = vi.fn(() => Promise.resolve());
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });

    render(<App />);

    const stage = document.getElementById('gameStage');
    const board = document.getElementById('gameBoard');
    const shell = document.querySelector('.game-shell');
    const modalContent = document.querySelector('#startScreen .modal-content');

    Object.defineProperty(shell, 'clientWidth', { configurable: true, value: 1200 });
    Object.defineProperty(shell, 'clientHeight', { configurable: true, value: 700 });
    Object.defineProperty(board, 'offsetWidth', { configurable: true, value: 1000 });
    Object.defineProperty(board, 'offsetHeight', { configurable: true, value: 500 });
    Object.defineProperty(modalContent, 'offsetWidth', { configurable: true, value: 700 });
    Object.defineProperty(modalContent, 'offsetHeight', { configurable: true, value: 500 });

    window.dispatchEvent(new Event('resize'));

    const zoomOut = screen.getByRole('button', { name: /zoom out/i });
    const zoomIn = screen.getByRole('button', { name: /zoom in/i });
    const mute = screen.getByRole('button', { name: /mute audio/i });
    const fullscreen = screen.getByRole('button', { name: /enter fullscreen/i });
    const audio = document.getElementById('backgroundMusic');

    expect(document.getElementById('zoomLabel')).toHaveTextContent('100%');
    expect(zoomIn).not.toBeDisabled();
    expect(stage.style.getPropertyValue('--game-scale')).toBe('1.0000');

    fireEvent.click(zoomOut);

    expect(document.getElementById('zoomLabel')).toHaveTextContent('90%');
    expect(zoomIn).not.toBeDisabled();
    expect(stage.style.getPropertyValue('--game-scale')).toBe('0.9000');

    expect(audio.muted).toBe(false);
    fireEvent.click(mute);
    expect(audio.muted).toBe(true);
    expect(screen.getByRole('button', { name: /unmute audio/i })).toBeInTheDocument();

    await fireEvent.click(fullscreen);
    expect(requestFullscreen).toHaveBeenCalled();
  });

  it('renders both team panels and setup inputs', () => {
    render(<App />);

    expect(screen.getAllByRole('heading', { name: /TEAM 1/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: /TEAM 2/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText(/Team name/i)).toHaveLength(2);
    expect(document.getElementById('ropeContainer')).not.toBeNull();
    expect(document.getElementById('winnerDisplay')).not.toBeNull();
  });
});
