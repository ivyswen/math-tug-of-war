import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

vi.mock('./hooks/useLegacyGameBoot', () => ({
  useLegacyGameBoot: () => {},
}));

import App from './App';

describe('App runtime game logic bridge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.i18n = {
      t: vi.fn((key) => (key === 'winnerMessage' ? 'Winner!' : key)),
      getCountdown: vi.fn((value) => String(value).toUpperCase()),
    };
    window.__ARQON_GAME__ = {
      state: {
        selectedOperations: new Set(['-']),
        difficulty: 'easy',
        answers: { left: 0, right: 0 },
        scores: { left: 0, right: 0 },
        locks: { left: false, right: false },
        position: 0,
        isActive: true,
        leftTeamName: 'Blue Team',
        rightTeamName: 'Red Team',
        startTime: null,
        elapsedTime: 0,
      },
      config: {
        step: 50,
        wrongStepFactor: 1 / 3,
        winLimit: 300,
        winByScore: 20,
      },
      timerInterval: 42,
      autoFitProblemText: vi.fn(),
      updateSideEnabledStates: vi.fn(),
      updateRopePosition: vi.fn(),
      checkWin: vi.fn(),
      generateProblem: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.__ARQON_GAME__;
    delete window.__ARQON_REACT_RUNTIME__;
    delete window.i18n;
    vi.restoreAllMocks();
  });

  it('generates problems and resolves correct submissions through the React runtime bridge', async () => {
    render(<App />);

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.setInteraction({
        isActive: true,
        locks: { left: false, right: false },
      });
    });

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.generateProblem('left');
    });

    const firstProblem = document.getElementById('leftProblemText').textContent;
    const match = firstProblem.match(/(\d+) - (\d+) = \?/);
    expect(match).not.toBeNull();

    const expectedAnswer = Number(match[1]) - Number(match[2]);
    expect(window.__ARQON_GAME__.state.answers.left).toBe(expectedAnswer);

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.setInputValue('left', String(expectedAnswer));
    });

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.checkAnswer('left');
    });

    expect(document.getElementById('leftScore')).toHaveTextContent('1');
    expect(window.__ARQON_GAME__.state.scores.left).toBe(1);
    expect(window.__ARQON_GAME__.state.position).toBe(-50);
    expect(document.getElementById('ropeContainer').style.transform).toContain('-50px');

    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    expect(document.getElementById('leftInput')).toHaveValue('');
    expect(window.__ARQON_GAME__.updateSideEnabledStates).not.toHaveBeenCalled();
    expect(document.getElementById('leftInput')).not.toBeDisabled();
    expect(document.getElementById('leftProblemText').style.fontSize).toBeTruthy();
  });

  it('starts a game from the React-managed setup flow and syncs the legacy shell state', async () => {
    render(<App />);

    const audio = document.getElementById('backgroundMusic');
    audio.play = vi.fn(() => Promise.resolve());

    fireEvent.click(screen.getByRole('button', { name: /NEXT/i }));
    fireEvent.click(screen.getByRole('button', { name: /Hard/i }));
    fireEvent.click(screen.getByRole('button', { name: /NEXT/i }));
    fireEvent.change(document.getElementById('teamLeftName'), { target: { value: 'Blue Team' } });
    fireEvent.change(document.getElementById('teamRightName'), { target: { value: 'Red Team' } });
    fireEvent.click(document.getElementById('startGameBtn'));

    expect(document.getElementById('startScreen')).toHaveStyle({ display: 'none' });
    expect(document.getElementById('countdown')).toHaveTextContent('3');
    expect(window.__ARQON_GAME__.state.selectedOperations).toEqual(new Set(['+']));
    expect(window.__ARQON_GAME__.state.difficulty).toBe('hard');
    expect(window.__ARQON_GAME__.state.leftTeamName).toBe('Blue Team');
    expect(window.__ARQON_GAME__.state.rightTeamName).toBe('Red Team');
    expect(document.getElementById('leftTeamHeader')).toHaveTextContent('Blue Team');
    expect(document.getElementById('rightTeamHeader')).toHaveTextContent('Red Team');

    await act(async () => {
      vi.advanceTimersByTime(4900);
    });

    expect(window.__ARQON_GAME__.state.isActive).toBe(true);
    expect(window.__ARQON_GAME__.generateProblem).not.toHaveBeenCalled();
    expect(document.getElementById('leftProblemText').textContent).not.toBe('? + ? = ?');
    expect(document.getElementById('rightProblemText').textContent).not.toBe('? + ? = ?');
    expect(audio.play).toHaveBeenCalled();
  });

  it('runs countdown and timer through the React runtime bridge', async () => {
    render(<App />);

    const audio = document.getElementById('backgroundMusic');
    audio.play = vi.fn(() => Promise.resolve());

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.startCountdown();
    });

    expect(document.getElementById('countdown')).toHaveTextContent('3');
    expect(document.getElementById('countdown')).toHaveStyle({ display: 'flex' });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(document.getElementById('countdown')).toHaveTextContent('GO');

    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    expect(document.getElementById('countdown')).toHaveStyle({ display: 'none' });
    expect(window.__ARQON_GAME__.state.isActive).toBe(true);
    expect(window.__ARQON_GAME__.generateProblem).not.toHaveBeenCalled();
    expect(document.getElementById('leftProblemText').textContent).not.toBe('? + ? = ?');
    expect(document.getElementById('rightProblemText').textContent).not.toBe('? + ? = ?');
    expect(audio.play).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(document.getElementById('gameTimer')).toHaveTextContent('00:02');
  });

  it('auto-fits problem text through the React runtime bridge', async () => {
    render(<App />);

    const problemBox = document.getElementById('leftProblem');
    const problemText = document.getElementById('leftProblemText');

    Object.defineProperty(problemBox, 'clientWidth', { configurable: true, value: 120 });
    Object.defineProperty(problemText, 'scrollWidth', {
      configurable: true,
      get: () => {
        const currentSize = Number.parseInt(problemText.style.fontSize || '32', 10);
        return currentSize * 8;
      },
    });

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.setProblemText('left', '123456789 + 987654321 = ?');
      window.__ARQON_REACT_RUNTIME__.autoFitProblemText('left');
    });

    expect(problemText.style.fontSize).toBe('16px');
  });

  it('ends the game through React when a win condition is reached', async () => {
    render(<App />);

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.setTeamNames({
        leftHeader: 'Blue Team',
        rightHeader: 'Red Team',
        leftArena: 'Blue Team',
        rightArena: 'Red Team',
      });
      window.__ARQON_REACT_RUNTIME__.setTimer('00:19');
      window.__ARQON_REACT_RUNTIME__.setScores({ left: 19, right: 3 });
      window.__ARQON_REACT_RUNTIME__.setInteraction({
        isActive: true,
        locks: { left: false, right: false },
      });
    });

    window.__ARQON_GAME__.state.scores = { left: 19, right: 3 };
    window.__ARQON_GAME__.state.position = -301;

    await act(async () => {
      window.__ARQON_REACT_RUNTIME__.checkWin();
    });

    expect(window.__ARQON_GAME__.state.isActive).toBe(false);
    expect(document.getElementById('winnerDisplay')).toHaveStyle({ display: 'flex' });
    expect(document.getElementById('winnerName')).toHaveTextContent('Blue Team');
    expect(document.getElementById('winnerMessage')).toHaveTextContent('Winner!');
    expect(document.getElementById('winnerCorrectAnswers')).toHaveTextContent('19');
    expect(document.getElementById('winnerTime')).toHaveTextContent('00:19');
    expect(document.getElementById('ropeVideo')).toHaveStyle({ display: 'none' });
    expect(document.getElementById('blueWinVideo')).toHaveStyle({ display: 'block' });
    expect(document.getElementById('rightInput')).toBeDisabled();
  });
});
