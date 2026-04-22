import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GameShell } from './GameShell';

describe('GameShell runtime props', () => {
  it('renders runtime values provided by React state', () => {
    render(
      <GameShell
        runtimeState={{
          teamNames: {
            leftHeader: 'Blue Team',
            rightHeader: 'Red Team',
            leftArena: 'Blue Team',
            rightArena: 'Red Team',
          },
          scores: { left: 4, right: 6 },
          timer: '00:42',
          problemTexts: { left: '9 - 4 = ?', right: '3 + 5 = ?' },
          inputs: { left: '12', right: '9' },
          position: -180,
          presentation: {
            ropeVisible: false,
            winnerVisible: true,
            winVideoSide: 'left',
          },
          interaction: {
            isActive: true,
            locks: { left: false, right: true },
          },
          winner: {
            name: 'Blue Team',
            message: 'Winner!',
            correctAnswers: '4',
            time: '00:42',
          },
        }}
      />,
    );

    expect(document.getElementById('leftTeamHeader')).toHaveTextContent('Blue Team');
    expect(document.getElementById('rightTeamHeader')).toHaveTextContent('Red Team');
    expect(document.getElementById('leftScore')).toHaveTextContent('4');
    expect(document.getElementById('rightScore')).toHaveTextContent('6');
    expect(document.getElementById('gameTimer')).toHaveTextContent('00:42');
    expect(document.getElementById('leftProblemText')).toHaveTextContent('9 - 4 = ?');
    expect(document.getElementById('rightProblemText')).toHaveTextContent('3 + 5 = ?');
    expect(document.getElementById('leftInput')).toHaveValue('12');
    expect(document.getElementById('rightInput')).toHaveValue('9');
    expect(document.getElementById('ropeContainer').style.transform).toContain('-180px');
    expect(document.getElementById('ropeVideo')).toHaveStyle({ display: 'none' });
    expect(document.getElementById('blueWinVideo')).toHaveStyle({ display: 'block' });
    expect(document.getElementById('redWinVideo')).toHaveStyle({ display: 'none' });
    expect(document.getElementById('winnerDisplay')).toHaveStyle({ display: 'flex' });
    expect(document.querySelector('.key-btn[data-side="left"][data-value="1"]')).not.toBeDisabled();
    expect(document.querySelector('.key-btn[data-side="right"][data-value="1"]')).toBeDisabled();
    expect(document.getElementById('winnerName')).toHaveTextContent('Blue Team');
    expect(document.getElementById('winnerMessage')).toHaveTextContent('Winner!');
  });
  it('routes keypad and submit interactions through React callbacks', () => {
    const onDigit = vi.fn();
    const onClear = vi.fn();
    const onSubmit = vi.fn();

    render(
      <GameShell
        runtimeState={{
          teamNames: {
            leftHeader: 'Blue Team',
            rightHeader: 'Red Team',
            leftArena: 'Blue Team',
            rightArena: 'Red Team',
          },
          scores: { left: 0, right: 0 },
          timer: '00:00',
          problemTexts: { left: '1 + 1 = ?', right: '2 + 2 = ?' },
          inputs: { left: '', right: '' },
          interaction: {
            isActive: true,
            locks: { left: false, right: false },
          },
          winner: {
            name: '',
            message: "G'olib bo'ldi!",
            correctAnswers: '0',
            time: '00:00',
          },
        }}
        onDigit={onDigit}
        onClear={onClear}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(document.querySelector('.key-btn[data-side="left"][data-value="7"]'));
    fireEvent.click(document.querySelector('.key-btn.key-clear[data-side="left"]'));
    fireEvent.click(document.querySelector('.key-btn.key-submit[data-side="left"]'));

    expect(onDigit).toHaveBeenCalledWith('left', '7');
    expect(onClear).toHaveBeenCalledWith('left');
    expect(onSubmit).toHaveBeenCalledWith('left');
  });
});
