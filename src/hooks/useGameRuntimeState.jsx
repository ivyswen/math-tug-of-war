import { useMemo, useState } from 'react';

const defaultState = {
  teamNames: {
    leftHeader: 'Team 1',
    rightHeader: 'Team 2',
    leftArena: 'Team 1',
    rightArena: 'Team 2',
  },
  scores: {
    left: 0,
    right: 0,
  },
  timer: '00:00',
  problemTexts: {
    left: '? + ? = ?',
    right: '? + ? = ?',
  },
  answers: {
    left: null,
    right: null,
  },
  inputs: {
    left: '',
    right: '',
  },
  position: 0,
  presentation: {
    ropeVisible: true,
    winnerVisible: false,
    winVideoSide: null,
  },
  countdown: {
    visible: false,
    text: '',
    isGo: false,
  },
  interaction: {
    isActive: false,
    locks: {
      left: false,
      right: false,
    },
  },
  winner: {
    name: '',
    message: 'Winner!',
    correctAnswers: '0',
    time: '00:00',
  },
};

export function useGameRuntimeState() {
  const [state, setState] = useState(defaultState);

  const actions = useMemo(
    () => ({
      setTimer(timer) {
        setState((current) => ({ ...current, timer }));
      },
      setScores(scores) {
        setState((current) => ({ ...current, scores: { ...current.scores, ...scores } }));
      },
      setProblemText(side, text) {
        setState((current) => ({
          ...current,
          problemTexts: { ...current.problemTexts, [side]: text },
        }));
      },
      setAnswer(side, answer) {
        setState((current) => ({
          ...current,
          answers: { ...current.answers, [side]: answer },
        }));
      },
      setTeamNames(teamNames) {
        setState((current) => ({
          ...current,
          teamNames: { ...current.teamNames, ...teamNames },
        }));
      },
      setInputValue(side, value) {
        setState((current) => ({
          ...current,
          inputs: { ...current.inputs, [side]: value },
        }));
      },
      appendInput(side, value, maxLength = 6) {
        setState((current) => ({
          ...current,
          inputs: {
            ...current.inputs,
            [side]: `${current.inputs[side] || ''}${value}`.slice(0, maxLength),
          },
        }));
      },
      clearInput(side) {
        setState((current) => ({
          ...current,
          inputs: { ...current.inputs, [side]: '' },
        }));
      },
      setPosition(position) {
        setState((current) => ({ ...current, position }));
      },
      setPresentation(presentation) {
        setState((current) => ({
          ...current,
          presentation: { ...current.presentation, ...presentation },
        }));
      },
      setCountdown(countdown) {
        setState((current) => ({
          ...current,
          countdown: { ...current.countdown, ...countdown },
        }));
      },
      setInteraction(interaction) {
        setState((current) => ({
          ...current,
          interaction: {
            ...current.interaction,
            ...interaction,
            locks: {
              ...current.interaction.locks,
              ...(interaction.locks || {}),
            },
          },
        }));
      },
      setWinner(winner) {
        setState((current) => ({
          ...current,
          winner: { ...current.winner, ...winner },
        }));
      },
    }),
    [],
  );

  return { state, actions };
}
