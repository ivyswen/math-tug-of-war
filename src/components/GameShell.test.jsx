import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameShell } from './GameShell';

describe('GameShell', () => {
  it('renders both calculator panels and central scoreboard with legacy ids', () => {
    render(<GameShell />);

    expect(screen.getByRole('heading', { name: /Team 1/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Team 2/i })).toBeInTheDocument();
    expect(document.getElementById('leftScore')).not.toBeNull();
    expect(document.getElementById('rightScore')).not.toBeNull();
    expect(document.getElementById('leftProblem')).not.toBeNull();
    expect(document.getElementById('rightProblem')).not.toBeNull();
    expect(document.getElementById('gameTimer')).toHaveTextContent('00:00');
    expect(document.getElementById('leftCorrectCount')).toHaveTextContent('0');
    expect(document.getElementById('rightCorrectCount')).toHaveTextContent('0');
  });

  it('renders rope video, win videos, winner overlay, and keypad controls', () => {
    render(<GameShell />);

    expect(document.getElementById('ropeContainer')).not.toBeNull();
    expect(document.getElementById('ropeVideo')).not.toBeNull();
    expect(document.getElementById('blueWinVideo')).not.toBeNull();
    expect(document.getElementById('redWinVideo')).not.toBeNull();
    expect(document.getElementById('winnerDisplay')).not.toBeNull();
    expect(document.getElementById('winnerName')).not.toBeNull();
    expect(document.getElementById('winnerMessage')).toHaveTextContent('Winner!');
    expect(document.getElementById('winnerCorrectAnswers')).toHaveTextContent('0');
    expect(document.getElementById('winnerTime')).toHaveTextContent('00:00');
    expect(screen.getAllByRole('button', { name: '1' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '0' })).toHaveLength(2);
    expect(document.querySelectorAll('.key-btn.key-submit')).toHaveLength(2);
    expect(document.querySelectorAll('.key-btn.key-clear')).toHaveLength(2);
  });
});
