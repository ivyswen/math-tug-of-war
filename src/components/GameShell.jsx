function Keypad({ side, disabled, onDigit, onClear, onSubmit }) {
  return (
    <div className="keypad">
      <button className="key-btn" data-side={side} data-value="1" disabled={disabled} onClick={() => onDigit(side, '1')}>1</button>
      <button className="key-btn" data-side={side} data-value="2" disabled={disabled} onClick={() => onDigit(side, '2')}>2</button>
      <button className="key-btn" data-side={side} data-value="3" disabled={disabled} onClick={() => onDigit(side, '3')}>3</button>
      <button className="key-btn" data-side={side} data-value="4" disabled={disabled} onClick={() => onDigit(side, '4')}>4</button>
      <button className="key-btn" data-side={side} data-value="5" disabled={disabled} onClick={() => onDigit(side, '5')}>5</button>
      <button className="key-btn" data-side={side} data-value="6" disabled={disabled} onClick={() => onDigit(side, '6')}>6</button>
      <button className="key-btn" data-side={side} data-value="7" disabled={disabled} onClick={() => onDigit(side, '7')}>7</button>
      <button className="key-btn" data-side={side} data-value="8" disabled={disabled} onClick={() => onDigit(side, '8')}>8</button>
      <button className="key-btn" data-side={side} data-value="9" disabled={disabled} onClick={() => onDigit(side, '9')}>9</button>
      <button className="key-btn key-clear" data-side={side} data-action="clear" disabled={disabled} onClick={() => onClear(side)}>
        <i className="fas fa-times"></i>
      </button>
      <button className="key-btn" data-side={side} data-value="0" disabled={disabled} onClick={() => onDigit(side, '0')}>0</button>
      <button className="key-btn key-submit" data-side={side} data-action="submit" disabled={disabled} onClick={() => onSubmit(side)}>
        <i className="fas fa-check"></i>
      </button>
    </div>
  );
}

function CalculatorPanel({
  side,
  headerId,
  scoreId,
  problemId,
  problemTextId,
  inputId,
  title,
  score,
  problemText,
  inputValue,
  disabled,
  onDigit,
  onClear,
  onSubmit,
}) {
  return (
    <div className={`calculator-panel panel-${side}`}>
      <div className="panel-header">
        <h3 id={headerId}>{title}</h3>
        <div className="score-badge" id={scoreId}>{score}</div>
      </div>
      <div className="problem-display" id={problemId}>
        <span id={problemTextId}>{problemText}</span>
      </div>
      <input
        type="text"
        className="answer-input"
        id={inputId}
        readOnly
        placeholder={disabled ? '—' : '0'}
        disabled={disabled}
        value={inputValue}
        onChange={() => {}}
      />
      <Keypad side={side} disabled={disabled} onDigit={onDigit} onClear={onClear} onSubmit={onSubmit} />
    </div>
  );
}

function ArenaBoard({ runtimeState }) {
  const ropeTransform = `translate(calc(-50% + ${runtimeState.position}px), -50%)`;
  const showBlueWin = runtimeState.presentation.winVideoSide === 'left';
  const showRedWin = runtimeState.presentation.winVideoSide === 'right';

  return (
    <div className="arena-container">
      <div className="arena-scoreboard">
        <div className="score-item">
          <span id="leftTeamName">{runtimeState.teamNames.leftArena}</span>
          <span className="score-value" id="leftCorrectCount">{runtimeState.scores.left}</span>
        </div>
        <div className="timer-display">
          <i className="fas fa-clock"></i>
          <span id="gameTimer">{runtimeState.timer}</span>
        </div>
        <div className="score-item">
          <span id="rightTeamName">{runtimeState.teamNames.rightArena}</span>
          <span className="score-value" id="rightCorrectCount">{runtimeState.scores.right}</span>
        </div>
      </div>

      <div className="arena">
        <div className="center-line"></div>
        <div className="rope-container" id="ropeContainer" style={{ transform: ropeTransform }}>
          <video id="ropeVideo" autoPlay loop muted playsInline style={{ display: runtimeState.presentation.ropeVisible ? 'block' : 'none' }}>
            <source src="/game/assets/media/main.mp4" type="video/mp4" />
          </video>
        </div>

        <div
          id="win-video"
          className="win-video-wrap"
          style={{ display: runtimeState.presentation.winVideoSide ? 'block' : 'none' }}
          aria-hidden={runtimeState.presentation.winVideoSide ? 'false' : 'true'}
        >
          <video id="blueWinVideo" className="win-video" style={{ display: showBlueWin ? 'block' : 'none' }} autoPlay loop muted playsInline>
            <source src="/game/assets/media/win_blue.mp4" type="video/mp4" />
          </video>
          <video id="redWinVideo" className="win-video" style={{ display: showRedWin ? 'block' : 'none' }} autoPlay loop muted playsInline>
            <source src="/game/assets/media/win_red.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      <div id="winnerDisplay" className="winner-overlay" style={{ display: runtimeState.presentation.winnerVisible ? 'flex' : 'none' }}>
        <div className="winner-content">
          <div className="trophy-animation"><i className="fas fa-trophy"></i></div>
          <h2 id="winnerName" className="winner-title">{runtimeState.winner.name}</h2>
          <p id="winnerMessage" className="winner-message">{runtimeState.winner.message}</p>
          <div className="winner-stats">
            <div className="stat-item">
              <i className="fas fa-check-circle"></i>
              <span id="winnerCorrectAnswers">{runtimeState.winner.correctAnswers}</span>
              <small id="correctAnswersLabel">correct answers</small>
            </div>
            <div className="stat-item">
              <i className="fas fa-clock"></i>
              <span id="winnerTime">{runtimeState.winner.time}</span>
              <small id="timeLabel">time</small>
            </div>
          </div>
          <button className="primary-btn" onClick={() => window.location.reload()}>
            <i className="fas fa-redo"></i>
            <span id="playAgainText">PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const defaultRuntimeState = {
  teamNames: {
    leftHeader: 'Team 1',
    rightHeader: 'Team 2',
    leftArena: 'Team 1',
    rightArena: 'Team 2',
  },
  scores: { left: 0, right: 0 },
  timer: '00:00',
  problemTexts: { left: '? + ? = ?', right: '? + ? = ?' },
  inputs: { left: '', right: '' },
  position: 0,
  presentation: {
    ropeVisible: true,
    winnerVisible: false,
    winVideoSide: null,
  },
  interaction: {
    isActive: false,
    locks: { left: false, right: false },
  },
  winner: {
    name: '',
    message: 'Winner!',
    correctAnswers: '0',
    time: '00:00',
  },
};

const noop = () => {};

export function GameShell({
  runtimeState = defaultRuntimeState,
  onDigit = noop,
  onClear = noop,
  onSubmit = noop,
}) {
  const mergedRuntimeState = {
    ...defaultRuntimeState,
    ...runtimeState,
    teamNames: { ...defaultRuntimeState.teamNames, ...(runtimeState.teamNames || {}) },
    scores: { ...defaultRuntimeState.scores, ...(runtimeState.scores || {}) },
    problemTexts: { ...defaultRuntimeState.problemTexts, ...(runtimeState.problemTexts || {}) },
    inputs: { ...defaultRuntimeState.inputs, ...(runtimeState.inputs || {}) },
    presentation: { ...defaultRuntimeState.presentation, ...(runtimeState.presentation || {}) },
    interaction: {
      ...defaultRuntimeState.interaction,
      ...(runtimeState.interaction || {}),
      locks: {
        ...defaultRuntimeState.interaction.locks,
        ...((runtimeState.interaction && runtimeState.interaction.locks) || {}),
      },
    },
    winner: { ...defaultRuntimeState.winner, ...(runtimeState.winner || {}) },
  };

  const leftDisabled = !mergedRuntimeState.interaction.isActive || mergedRuntimeState.interaction.locks.left;
  const rightDisabled = !mergedRuntimeState.interaction.isActive || mergedRuntimeState.interaction.locks.right;

  return (
    <main className="game-shell">
      <div className="game-stage" id="gameStage">
        <div className="game-board" id="gameBoard">
          <CalculatorPanel
            side="left"
            headerId="leftTeamHeader"
            scoreId="leftScore"
            problemId="leftProblem"
            problemTextId="leftProblemText"
            inputId="leftInput"
            title={mergedRuntimeState.teamNames.leftHeader}
            score={mergedRuntimeState.scores.left}
            problemText={mergedRuntimeState.problemTexts.left}
            inputValue={mergedRuntimeState.inputs.left}
            disabled={leftDisabled}
            onDigit={onDigit}
            onClear={onClear}
            onSubmit={onSubmit}
          />
          <ArenaBoard runtimeState={mergedRuntimeState} />
          <CalculatorPanel
            side="right"
            headerId="rightTeamHeader"
            scoreId="rightScore"
            problemId="rightProblem"
            problemTextId="rightProblemText"
            inputId="rightInput"
            title={mergedRuntimeState.teamNames.rightHeader}
            score={mergedRuntimeState.scores.right}
            problemText={mergedRuntimeState.problemTexts.right}
            inputValue={mergedRuntimeState.inputs.right}
            disabled={rightDisabled}
            onDigit={onDigit}
            onClear={onClear}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </main>
  );
}
