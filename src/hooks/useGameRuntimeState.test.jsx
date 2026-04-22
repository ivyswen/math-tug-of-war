import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGameRuntimeState } from './useGameRuntimeState';

describe('useGameRuntimeState', () => {
  it('provides runtime state and updater actions for timer, scores, team names, and problems', () => {
    const { result } = renderHook(() => useGameRuntimeState());

    expect(result.current.state.timer).toBe('00:00');
    expect(result.current.state.scores.left).toBe(0);
    expect(result.current.state.scores.right).toBe(0);
    expect(result.current.state.problemTexts.left).toBe('? + ? = ?');

    act(() => {
      result.current.actions.setTimer('00:42');
      result.current.actions.setScores({ left: 3, right: 5 });
      result.current.actions.setProblemText('left', '9 - 4 = ?');
      result.current.actions.setAnswer('left', 5);
      result.current.actions.setTeamNames({
        leftHeader: 'Blue Team',
        rightHeader: 'Red Team',
        leftArena: 'Blue Team',
        rightArena: 'Red Team',
      });
    });

    expect(result.current.state.timer).toBe('00:42');
    expect(result.current.state.scores.left).toBe(3);
    expect(result.current.state.scores.right).toBe(5);
    expect(result.current.state.problemTexts.left).toBe('9 - 4 = ?');
    expect(result.current.state.answers.left).toBe(5);
    expect(result.current.state.teamNames.leftHeader).toBe('Blue Team');
    expect(result.current.state.teamNames.rightArena).toBe('Red Team');
  });

  it('tracks keypad input values and interaction state for each side', () => {
    const { result } = renderHook(() => useGameRuntimeState());

    expect(result.current.state.inputs.left).toBe('');
    expect(result.current.state.inputs.right).toBe('');
    expect(result.current.state.interaction.isActive).toBe(false);
    expect(result.current.state.interaction.locks.left).toBe(false);

    act(() => {
      result.current.actions.setInteraction({
        isActive: true,
        locks: { left: false, right: true },
      });
      result.current.actions.setPosition(-120);
      result.current.actions.setPresentation({
        ropeVisible: false,
        winnerVisible: true,
        winVideoSide: 'left',
      });
      result.current.actions.setCountdown({ visible: true, text: '3', isGo: false });
      result.current.actions.setInputValue('left', '12');
      result.current.actions.appendInput('left', '3');
      result.current.actions.clearInput('right');
    });

    expect(result.current.state.inputs.left).toBe('123');
    expect(result.current.state.inputs.right).toBe('');
    expect(result.current.state.position).toBe(-120);
    expect(result.current.state.presentation.ropeVisible).toBe(false);
    expect(result.current.state.presentation.winnerVisible).toBe(true);
    expect(result.current.state.presentation.winVideoSide).toBe('left');
    expect(result.current.state.countdown.visible).toBe(true);
    expect(result.current.state.countdown.text).toBe('3');
    expect(result.current.state.interaction.isActive).toBe(true);
    expect(result.current.state.interaction.locks.left).toBe(false);
    expect(result.current.state.interaction.locks.right).toBe(true);
  });
});
