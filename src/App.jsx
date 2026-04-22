import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameRuntimeState } from './hooks/useGameRuntimeState';
import { GameShell } from './components/GameShell';
import { SetupModal } from './components/SetupModal';
import {
  GameAudio,
  GameFooter,
  GameHeader,
  HomeButton,
  LanguageSelector,
  ViewControls,
} from './components/StaticUiPieces';
import { useLegacyGameBoot } from './hooks/useLegacyGameBoot';
import { useViewControls } from './hooks/useViewControls';
import {
  clampRopePosition,
  evaluateSubmission,
  generateProblem,
  getWinnerSide,
  hasWinner,
} from './lib/gameEngine';
import './styles/arqon.css';
import './styles/audio-panel.css';

const defaultSetupState = {
  visible: true,
  step: 0,
  selectedOperations: new Set(['+']),
  difficulty: 'easy',
  teamNames: {
    left: '',
    right: '',
  },
};

export default function App() {
  useLegacyGameBoot();
  const runtime = useGameRuntimeState();
  const [setupState, setSetupState] = useState(defaultSetupState);
  const viewControls = useViewControls({ setupVisible: setupState.visible });
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const countdownFinishTimeoutRef = useRef(null);

  const getLegacyGame = useCallback(() => window.__ARQON_GAME__, []);

  const setSetupStep = useCallback((step) => {
    setSetupState((current) => ({ ...current, step }));
  }, []);

  const setSelectedOperations = useCallback((selectedOperations) => {
    setSetupState((current) => ({
      ...current,
      selectedOperations: new Set(selectedOperations),
    }));
  }, []);

  const setDifficulty = useCallback((difficulty) => {
    setSetupState((current) => ({ ...current, difficulty }));
  }, []);

  const setTeamName = useCallback((side, value) => {
    setSetupState((current) => ({
      ...current,
      teamNames: { ...current.teamNames, [side]: value },
    }));
  }, []);

  const syncProblemTextToDom = useCallback((side, text) => {
    const id = side === 'left' ? 'leftProblemText' : 'rightProblemText';
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  }, []);

  const handleAutoFitProblemText = useCallback((side) => {
    const problemText = document.getElementById(side === 'left' ? 'leftProblemText' : 'rightProblemText');
    const container = document.getElementById(side === 'left' ? 'leftProblem' : 'rightProblem');

    if (!problemText || !container) return;

    problemText.style.fontSize = '';
    let fontSize = 32;
    problemText.style.fontSize = `${fontSize}px`;

    while (problemText.scrollWidth > container.clientWidth && fontSize > 16) {
      fontSize -= 2;
      problemText.style.fontSize = `${fontSize}px`;
    }
  }, []);

  const handleAutoFitAllProblemTexts = useCallback(() => {
    handleAutoFitProblemText('left');
    handleAutoFitProblemText('right');
  }, [handleAutoFitProblemText]);

  const handleUpdateRopePosition = useCallback(
    (position) => {
      runtime.actions.setPosition(clampRopePosition(position));
    },
    [runtime.actions],
  );

  const clearTimerLoop = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const clearCountdownLoop = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (countdownFinishTimeoutRef.current) {
      clearTimeout(countdownFinishTimeoutRef.current);
      countdownFinishTimeoutRef.current = null;
    }
  }, []);

  const setTimerFromElapsed = useCallback(
    (elapsed, forceZero = false) => {
      const totalMs = forceZero ? 0 : elapsed;
      const seconds = Math.floor(totalMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      runtime.actions.setTimer(timeStr);
      return timeStr;
    },
    [runtime.actions],
  );

  const handleStartTimer = useCallback(() => {
    const game = getLegacyGame();
    if (!game) return;

    clearTimerLoop();
    game.state.startTime = Date.now();
    game.state.elapsedTime = 0;
    setTimerFromElapsed(0, true);

    timerIntervalRef.current = setInterval(() => {
      if (!game.state.isActive || !game.state.startTime) return;
      game.state.elapsedTime = Date.now() - game.state.startTime;
      setTimerFromElapsed(game.state.elapsedTime);
    }, 100);

    game.timerInterval = timerIntervalRef.current;
  }, [clearTimerLoop, getLegacyGame, setTimerFromElapsed]);

  const handleStartCountdown = useCallback(() => {
    const game = getLegacyGame();
    if (!game) return;

    clearCountdownLoop();
    clearTimerLoop();
    runtime.actions.setCountdown({ visible: true, text: window.i18n?.getCountdown?.(3) ?? '3', isGo: false });

    const audio = document.getElementById('backgroundMusic');
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play?.().catch?.(() => {});
      } catch (_) {}
    }

    let count = game.config?.countdownStart ?? 3;

    countdownIntervalRef.current = setInterval(() => {
      if (count > 0) {
        runtime.actions.setCountdown({
          visible: true,
          text: window.i18n?.getCountdown?.(count) ?? String(count),
          isGo: false,
        });
        count -= 1;
        return;
      }

      runtime.actions.setCountdown({
        visible: true,
        text: window.i18n?.getCountdown?.('go') ?? 'GO',
        isGo: true,
      });
      clearCountdownLoop();

      countdownFinishTimeoutRef.current = setTimeout(() => {
        runtime.actions.setCountdown({ visible: false, text: '', isGo: false });
        game.state.isActive = true;
        runtime.actions.setInteraction({ isActive: true, locks: { left: false, right: false } });
        window.__ARQON_REACT_RUNTIME__?.generateProblem?.('left');
        window.__ARQON_REACT_RUNTIME__?.generateProblem?.('right');
        handleStartTimer();
      }, 800);
    }, 1000);
  }, [clearCountdownLoop, clearTimerLoop, getLegacyGame, handleStartTimer, runtime.actions]);

  const handleStartGame = useCallback(() => {
    const game = getLegacyGame();
    if (!game) return;

    const selectedOperations = new Set(setupState.selectedOperations.size ? setupState.selectedOperations : ['+']);
    const leftTeamName = setupState.teamNames.left.trim() || 'Team 1';
    const rightTeamName = setupState.teamNames.right.trim() || 'Team 2';

    game.state.selectedOperations = new Set(selectedOperations);
    game.state.setupStep = setupState.step;
    game.state.difficulty = setupState.difficulty;
    game.state.leftTeamName = leftTeamName;
    game.state.rightTeamName = rightTeamName;
    game.state.position = 0;
    game.state.isActive = false;
    game.state.answers = { left: 0, right: 0 };
    game.state.scores = { left: 0, right: 0 };
    game.state.locks = { left: false, right: false };
    game.state.startTime = null;
    game.state.elapsedTime = 0;

    setSetupState((current) => ({ ...current, visible: false }));
    runtime.actions.setTeamNames({
      leftHeader: leftTeamName,
      rightHeader: rightTeamName,
      leftArena: leftTeamName,
      rightArena: rightTeamName,
    });
    runtime.actions.setScores({ left: 0, right: 0 });
    runtime.actions.setPosition(0);
    runtime.actions.setTimer('00:00');
    runtime.actions.setProblemText('left', '? + ? = ?');
    runtime.actions.setProblemText('right', '? + ? = ?');
    runtime.actions.setAnswer('left', null);
    runtime.actions.setAnswer('right', null);
    runtime.actions.setInputValue('left', '');
    runtime.actions.setInputValue('right', '');
    runtime.actions.setWinner({
      name: '',
      message: window.i18n?.t?.('winnerMessage') ?? 'Winner!',
      correctAnswers: '0',
      time: '00:00',
    });
    runtime.actions.setPresentation({
      ropeVisible: true,
      winnerVisible: false,
      winVideoSide: null,
    });
    runtime.actions.setInteraction({
      isActive: false,
      locks: { left: false, right: false },
    });
    runtime.actions.setCountdown({ visible: false, text: '', isGo: false });

    document.querySelectorAll('.confetti').forEach((confetti) => confetti.remove());
    handleStartCountdown();
  }, [getLegacyGame, handleStartCountdown, runtime.actions, setupState]);

  const handleEndGame = useCallback(() => {
    const game = getLegacyGame();
    if (!game) return;

    game.state.isActive = false;
    runtime.actions.setInteraction({ isActive: false, locks: { left: false, right: false } });
    clearCountdownLoop();
    clearTimerLoop();

    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    const winnerSide = getWinnerSide({
      scores: game.state.scores,
      position: game.state.position,
      winByScore: game.config?.winByScore ?? 20,
    });
    const winnerName = winnerSide === 'left' ? game.state.leftTeamName : game.state.rightTeamName;
    const winnerScore = game.state.scores[winnerSide];
    const winnerTime = runtime.state.timer || document.getElementById('gameTimer')?.textContent || '00:00';
    const winnerMessage = window.i18n?.t?.('winnerMessage') ?? 'Winner!';

    runtime.actions.setPresentation({
      ropeVisible: false,
      winnerVisible: true,
      winVideoSide: winnerSide,
    });
    runtime.actions.setPosition(0);
    runtime.actions.setWinner({
      name: winnerName,
      message: winnerMessage,
      correctAnswers: String(winnerScore),
      time: winnerTime,
    });
  }, [getLegacyGame, runtime.actions, runtime.state.timer]);

  const handleCheckWin = useCallback(() => {
    const game = getLegacyGame();
    if (!game) return false;

    const won = hasWinner({
      scores: game.state.scores,
      position: game.state.position,
      winLimit: game.config?.winLimit ?? 300,
      winByScore: game.config?.winByScore ?? 20,
    });

    if (won) {
      handleEndGame();
      return true;
    }

    return false;
  }, [getLegacyGame, handleEndGame]);

  const handleGenerateProblem = useCallback(
    (side) => {
      const game = getLegacyGame();
      const selectedOperations = Array.from(game?.state?.selectedOperations ?? ['+']);
      const difficulty = game?.state?.difficulty ?? 'easy';

      const problem = generateProblem({ difficulty, selectedOperations });
      runtime.actions.setAnswer(side, problem.answer);
      runtime.actions.setProblemText(side, problem.text);
      syncProblemTextToDom(side, problem.text);

      if (game?.state?.answers) {
        game.state.answers[side] = problem.answer;
      }
      handleAutoFitProblemText(side);

      return problem;
    },
    [getLegacyGame, handleAutoFitProblemText, runtime.actions, syncProblemTextToDom],
  );

  const handleDigit = useCallback(
    (side, value) => {
      const sideLocked = runtime.state.interaction.locks[side];
      if (!runtime.state.interaction.isActive || sideLocked) return;
      runtime.actions.appendInput(side, value);
    },
    [runtime.actions, runtime.state.interaction],
  );

  const handleClear = useCallback(
    (side) => {
      const sideLocked = runtime.state.interaction.locks[side];
      if (!runtime.state.interaction.isActive || sideLocked) return;
      runtime.actions.clearInput(side);
    },
    [runtime.actions, runtime.state.interaction],
  );

  const handleSubmit = useCallback(
    (side) => {
      const game = getLegacyGame();
      const sideLocked = runtime.state.interaction.locks[side];
      const inputId = side === 'left' ? 'leftInput' : 'rightInput';
      const inputElement = document.getElementById(inputId);
      if (!game || !runtime.state.interaction.isActive || sideLocked || !inputElement) return;

      game.state.locks[side] = true;
      runtime.actions.setInteraction({ locks: { [side]: true } });

      const result = evaluateSubmission({
        side,
        rawInput: runtime.state.inputs[side],
        correctAnswer: runtime.state.answers[side] ?? game.state.answers?.[side],
        scores: runtime.state.scores,
        position: game.state.position ?? 0,
        step: game.config?.step ?? 50,
        wrongStepFactor: game.config?.wrongStepFactor ?? 1 / 3,
      });

      game.state.scores = { ...result.nextScores };
      game.state.position = result.nextPosition;

      if (result.isCorrect) {
        inputElement.classList.add('correct');
        runtime.actions.setScores(result.nextScores);
        handleUpdateRopePosition(result.nextPosition);

        setTimeout(() => {
          inputElement.classList.remove('correct');
          runtime.actions.clearInput(side);
          game.state.locks[side] = false;
          runtime.actions.setInteraction({ locks: { [side]: false } });
          if (!handleCheckWin() && game.state.isActive) {
            handleGenerateProblem(side);
          }
        }, 400);

        return;
      }

      inputElement.classList.add('incorrect', 'shake');
      handleUpdateRopePosition(result.nextPosition);

      setTimeout(() => {
        inputElement.classList.remove('incorrect', 'shake');
        runtime.actions.clearInput(side);
        game.state.locks[side] = false;
        runtime.actions.setInteraction({ locks: { [side]: false } });
        handleCheckWin();
      }, 500);
    },
    [getLegacyGame, handleCheckWin, handleGenerateProblem, handleUpdateRopePosition, runtime.actions, runtime.state],
  );

  useEffect(() => {
    window.__ARQON_REACT_RUNTIME__ = {
      isSetupManaged: () => true,
      isViewManaged: () => true,
      isTextFitManaged: () => true,
      isKeypadManaged: () => true,
      isRuntimeLogicManaged: () => true,
      startGame: handleStartGame,
      setTimer: runtime.actions.setTimer,
      setScores: runtime.actions.setScores,
      setProblemText: runtime.actions.setProblemText,
      setAnswer: runtime.actions.setAnswer,
      setPosition: handleUpdateRopePosition,
      setCountdown: runtime.actions.setCountdown,
      startCountdown: handleStartCountdown,
      startTimer: handleStartTimer,
      updateTimerDisplay: setTimerFromElapsed,
      generateProblem: handleGenerateProblem,
      checkAnswer: handleSubmit,
      checkWin: handleCheckWin,
      endGame: handleEndGame,
      setTeamNames: runtime.actions.setTeamNames,
      setInputValue: runtime.actions.setInputValue,
      getInputValue: (side) => runtime.state.inputs[side] ?? '',
      autoFitProblemText: handleAutoFitProblemText,
      autoFitAllProblemTexts: handleAutoFitAllProblemTexts,
      setInteraction: runtime.actions.setInteraction,
      setPresentation: runtime.actions.setPresentation,
      setWinner: runtime.actions.setWinner,
    };

    return () => {
      delete window.__ARQON_REACT_RUNTIME__;
    };
  }, [
    handleCheckWin,
    handleEndGame,
    handleGenerateProblem,
    handleAutoFitAllProblemTexts,
    handleAutoFitProblemText,
    handleStartCountdown,
    handleStartGame,
    handleStartTimer,
    handleSubmit,
    handleUpdateRopePosition,
    runtime.actions,
    runtime.state.inputs,
    setTimerFromElapsed,
  ]);

  useEffect(() => () => {
    clearCountdownLoop();
    clearTimerLoop();
  }, [clearCountdownLoop, clearTimerLoop]);

  return (
    <div className="app-shell" data-testid="arqon-app-shell">
      <GameAudio />
      <HomeButton />
      <LanguageSelector />
      <GameHeader />
      <SetupModal
        visible={setupState.visible}
        countdownState={runtime.state.countdown}
        setupStep={setupState.step}
        selectedOperations={setupState.selectedOperations}
        difficulty={setupState.difficulty}
        teamLeftName={setupState.teamNames.left}
        teamRightName={setupState.teamNames.right}
        onSetupStepChange={setSetupStep}
        onSelectedOperationsChange={setSelectedOperations}
        onDifficultyChange={setDifficulty}
        onTeamNameChange={setTeamName}
        onStart={handleStartGame}
      />
      <GameShell
        runtimeState={runtime.state}
        onDigit={handleDigit}
        onClear={handleClear}
        onSubmit={handleSubmit}
      />
      <GameFooter />
      <ViewControls {...viewControls} />
    </div>
  );
}
