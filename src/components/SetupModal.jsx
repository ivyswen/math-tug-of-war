import { useMemo, useState } from 'react';

const OPERATIONS = [
  { op: '+', symbol: '+', text: 'Addition', textId: 'opAddText' },
  { op: '-', symbol: '−', text: 'Subtraction', textId: 'opSubText' },
  { op: '*', symbol: '×', text: 'Multiplication', textId: 'opMulText' },
  { op: '/', symbol: '÷', text: 'Division', textId: 'opDivText' },
];

const DIFFICULTIES = [
  { level: 'easy', icon: 'fas fa-lightbulb', text: 'Easy', textId: 'easyText' },
  { level: 'medium', icon: 'fas fa-brain', text: 'Medium', textId: 'mediumText' },
  { level: 'hard', icon: 'fas fa-network-wired', text: 'Hard', textId: 'hardText' },
];

const STEPS = [
  { step: 0, label: 'Operations', id: 'stepOperations' },
  { step: 1, label: 'Difficulty', id: 'stepDifficulty' },
  { step: 2, label: 'Teams', id: 'stepTeams' },
];

const DEFAULT_COUNTDOWN_STATE = {
  visible: false,
  text: '',
  isGo: false,
};

const noop = () => {};

function getValue(controlledValue, fallbackValue) {
  return controlledValue === undefined ? fallbackValue : controlledValue;
}

export function SetupModal({
  visible = true,
  countdownState = DEFAULT_COUNTDOWN_STATE,
  setupStep: controlledSetupStep,
  selectedOperations: controlledSelectedOperations,
  difficulty: controlledDifficulty,
  teamLeftName: controlledTeamLeftName,
  teamRightName: controlledTeamRightName,
  onSetupStepChange = noop,
  onSelectedOperationsChange = noop,
  onDifficultyChange = noop,
  onTeamNameChange = noop,
  onStart = noop,
}) {
  const [internalSetupStep, setInternalSetupStep] = useState(0);
  const [internalSelectedOperations, setInternalSelectedOperations] = useState(() => new Set(['+']));
  const [internalDifficulty, setInternalDifficulty] = useState('easy');
  const [internalTeamLeftName, setInternalTeamLeftName] = useState('');
  const [internalTeamRightName, setInternalTeamRightName] = useState('');

  const setupStep = getValue(controlledSetupStep, internalSetupStep);
  const selectedOperations = getValue(controlledSelectedOperations, internalSelectedOperations);
  const difficulty = getValue(controlledDifficulty, internalDifficulty);
  const teamLeftName = getValue(controlledTeamLeftName, internalTeamLeftName);
  const teamRightName = getValue(controlledTeamRightName, internalTeamRightName);

  const setSetupStep = (nextValue) => {
    setInternalSetupStep(nextValue);
    onSetupStepChange(nextValue);
  };

  const setSelectedOperations = (updater) => {
    const nextValue = typeof updater === 'function' ? updater(selectedOperations) : updater;
    const nextSet = new Set(nextValue);
    setInternalSelectedOperations(nextSet);
    onSelectedOperationsChange(nextSet);
  };

  const setDifficulty = (nextValue) => {
    setInternalDifficulty(nextValue);
    onDifficultyChange(nextValue);
  };

  const setTeamName = (side, nextValue) => {
    if (side === 'left') {
      setInternalTeamLeftName(nextValue);
    } else {
      setInternalTeamRightName(nextValue);
    }
    onTeamNameChange(side, nextValue);
  };

  const nextDisabled = setupStep === 0 && selectedOperations.size === 0;
  const showStartButton = setupStep === 2;
  const stepSet = useMemo(() => new Set(selectedOperations), [selectedOperations]);

  const toggleOperation = (op) => {
    setSelectedOperations((current) => {
      const next = new Set(current);
      if (next.has(op)) {
        next.delete(op);
      } else {
        next.add(op);
      }
      return next;
    });
  };

  const goNext = () => {
    if (nextDisabled) return;
    setSetupStep(Math.min(2, setupStep + 1));
  };

  const goBack = () => {
    setSetupStep(Math.max(0, setupStep - 1));
  };

  return (
    <>
      <div id="startScreen" className="modal-overlay" style={{ display: visible ? 'flex' : 'none' }}>
        <div className="modal-content start-modal">
          <h2 id="modalTitle">PREPARE YOUR TEAMS</h2>

          <div className="setup-stepper" aria-label="Setup steps">
            {STEPS.map((item, index) => (
              <div key={item.step} style={{ display: 'contents' }}>
                <div
                  className={`stepper-item${setupStep === item.step ? ' active' : ''}${setupStep > item.step ? ' done' : ''}`}
                  data-step={item.step}
                >
                  <div className="stepper-dot">{item.step + 1}</div>
                  <div className="stepper-label" id={item.id}>
                    {item.label}
                  </div>
                </div>
                {index < STEPS.length - 1 ? (
                  <div className="stepper-line" aria-hidden="true"></div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="setup-steps" id="setupSteps">
            <section className={`setup-step${setupStep === 0 ? ' active' : ''}`} data-step="0">
              <h3 id="operationLabel">Operations</h3>
              <p className="setup-hint" id="operationHint">
                Select one or more operations
              </p>

              <div className="operation-buttons" role="group" aria-labelledby="operationLabel">
                {OPERATIONS.map((item) => (
                  <button
                    key={item.op}
                    type="button"
                    className={`operation-btn${stepSet.has(item.op) ? ' active' : ''}`}
                    data-op={item.op}
                    onClick={() => toggleOperation(item.op)}
                  >
                    <span className="op-symbol">{item.symbol}</span>
                    <span className="op-text" id={item.textId}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className={`setup-step${setupStep === 1 ? ' active' : ''}`} data-step="1">
              <div className="difficulty-selector">
                <h3 id="difficultyLabel">Difficulty Level</h3>
                <div className="difficulty-buttons">
                  {DIFFICULTIES.map((item) => (
                    <button
                      key={item.level}
                      type="button"
                      className={`difficulty-btn${difficulty === item.level ? ' active' : ''}`}
                      data-level={item.level}
                      onClick={() => setDifficulty(item.level)}
                    >
                      <i className={item.icon}></i>
                      <span id={item.textId}>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={`setup-step${setupStep === 2 ? ' active' : ''}`} data-step="2">
              <div className="team-setup">
                <div className="team-box team-left">
                  <div className="team-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3 id="team1Label">TEAM 1 (BLUE)</h3>
                  <input
                    type="text"
                    id="teamLeftName"
                    placeholder="Team name"
                    maxLength="20"
                    autoComplete="off"
                    value={teamLeftName}
                    onChange={(event) => setTeamName('left', event.target.value)}
                  />
                </div>
                <div className="vs-divider">
                  <span>VS</span>
                </div>
                <div className="team-box team-right">
                  <div className="team-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h3 id="team2Label">TEAM 2 (RED)</h3>
                  <input
                    type="text"
                    id="teamRightName"
                    placeholder="Team name"
                    maxLength="20"
                    autoComplete="off"
                    value={teamRightName}
                    onChange={(event) => setTeamName('right', event.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="setup-nav">
            <button
              type="button"
              id="setupBackBtn"
              className="secondary-btn"
              disabled={setupStep === 0}
              onClick={goBack}
            >
              <i className="fas fa-arrow-left"></i>
              <span id="backBtnText">BACK</span>
            </button>

            <button
              type="button"
              id="setupNextBtn"
              className="primary-btn nav-btn"
              style={{ display: showStartButton ? 'none' : 'inline-flex' }}
              disabled={nextDisabled}
              onClick={goNext}
            >
              <span id="nextBtnText">NEXT</span>
              <i className="fas fa-arrow-right"></i>
            </button>

            <button
              type="button"
              id="startGameBtn"
              className="primary-btn nav-btn"
              style={{ display: showStartButton ? 'inline-flex' : 'none' }}
              data-selected-difficulty={difficulty}
              onClick={onStart}
            >
              <i className="fas fa-play"></i>
              <span id="startBtnText">START GAME</span>
            </button>
          </div>
        </div>
      </div>

      <div
        id="countdown"
        className="countdown-overlay"
        style={{ display: countdownState.visible ? 'flex' : 'none' }}
      >
        <div className={`countdown-content ${countdownState.isGo ? 'go' : ''}`}>{countdownState.text}</div>
      </div>
    </>
  );
}
