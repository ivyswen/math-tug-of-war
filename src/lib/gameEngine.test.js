import { describe, expect, it } from 'vitest';
import {
  clampRopePosition,
  evaluateSubmission,
  generateProblem,
  getWinnerSide,
  hasWinner,
} from './gameEngine';

describe('gameEngine', () => {
  it('generates subtraction problems with non-negative results for the selected difficulty', () => {
    const values = [0, 0.9];
    const rng = () => values.shift();

    const problem = generateProblem({
      difficulty: 'easy',
      selectedOperations: ['-'],
      rng,
    });

    expect(problem).toEqual({
      answer: 9,
      operator: '-',
      text: '10 - 1 = ?',
    });
  });

  it('evaluates a correct answer by incrementing score and moving the rope toward the answering side', () => {
    const result = evaluateSubmission({
      side: 'left',
      rawInput: '9',
      correctAnswer: 9,
      scores: { left: 2, right: 1 },
      position: 0,
      step: 50,
      wrongStepFactor: 1 / 3,
    });

    expect(result).toEqual({
      isCorrect: true,
      nextPosition: -50,
      nextScores: { left: 3, right: 1 },
    });
  });

  it('evaluates an incorrect answer without changing score and pushes the rope back', () => {
    const result = evaluateSubmission({
      side: 'right',
      rawInput: '4',
      correctAnswer: 9,
      scores: { left: 2, right: 1 },
      position: 0,
      step: 50,
      wrongStepFactor: 1 / 3,
    });

    expect(result.isCorrect).toBe(false);
    expect(result.nextScores).toEqual({ left: 2, right: 1 });
    expect(result.nextPosition).toBeCloseTo(-(50 / 3));
  });

  it('clamps rope position to arena boundaries', () => {
    expect(clampRopePosition(180, 250)).toBe(180);
    expect(clampRopePosition(400, 250)).toBe(250);
    expect(clampRopePosition(-500, 250)).toBe(-250);
  });

  it('detects a winner by score threshold or rope position', () => {
    expect(hasWinner({ scores: { left: 20, right: 3 }, position: 0, winLimit: 300, winByScore: 20 })).toBe(true);
    expect(getWinnerSide({ scores: { left: 20, right: 3 }, position: 0, winByScore: 20 })).toBe('left');
    expect(getWinnerSide({ scores: { left: 3, right: 4 }, position: 301, winByScore: 20 })).toBe('right');
    expect(hasWinner({ scores: { left: 3, right: 4 }, position: 20, winLimit: 300, winByScore: 20 })).toBe(false);
  });
});
