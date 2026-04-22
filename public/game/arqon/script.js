class TugOfWarGame {
  constructor() {
    this.config = {
      step: 50,
      winLimit: 300,
      winByScore: 20,

      wrongStepFactor: 1 / 3,

      maxInputLength: 6,
      countdownStart: 3,

      zoom: {
        storageKey: "arqonZoomPercent",
        minPercent: 60,
        maxPercent: 150,
        stepPercent: 10,
        defaultPercent: 100,
      },
    };

    this.state = {
      position: 0,
      isActive: false,
      difficulty: "easy",

      selectedOperations: new Set(["+"]),
      setupStep: 0,

      leftTeamName: "",
      rightTeamName: "",

      answers: { left: 0, right: 0 },
      scores: { left: 0, right: 0 },
      locks: { left: false, right: false },

      startTime: null,
      elapsedTime: 0,

      // View controls
      zoomPercent: this.getSavedZoomPercent(),
      zoomMinPercent: this.config.zoom.minPercent,
      zoomMaxPercent: this.config.zoom.maxPercent, // will be recalculated per viewport

      devtoolsDetected: false,
    };

    this.elements = {};
    this.timerInterval = null;

    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupViewControls();

    this.showSetupStep(0);

    this.updateScores();
    this.updateRopePosition();
    this.updateSideEnabledStates();

    if (!window.__ARQON_REACT_RUNTIME__?.isViewManaged?.()) {
      this.fitBoardToViewport();
    }
  }

  disableCopyPaste() {
    document.addEventListener("copy", (e) => e.preventDefault());
    document.addEventListener("cut", (e) => e.preventDefault());
    document.addEventListener("paste", (e) => e.preventDefault());

    document.addEventListener("selectstart", (e) => {
      if (e.target.tagName !== "INPUT") {
        e.preventDefault();
      }
    });

    document.onselectstart = function () {
      return false;
    };

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.mozUserSelect = "none";
    document.body.style.msUserSelect = "none";
  }

  cacheElements() {
    this.elements = {
      startScreen: document.getElementById("startScreen"),
      startGameBtn: document.getElementById("startGameBtn"),
      countdown: document.getElementById("countdown"),
      startModalContent: document.querySelector("#startScreen .modal-content"),

      homeBtn: document.getElementById("homeBtn"),

      zoomOutBtn: document.getElementById("zoomOutBtn"),
      zoomInBtn: document.getElementById("zoomInBtn"),
      zoomLabel: document.getElementById("zoomLabel"),
      fullscreenBtn: document.getElementById("fullscreenBtn"),

      setupSteps: Array.from(document.querySelectorAll(".setup-step")),
      setupStepperItems: Array.from(document.querySelectorAll(".stepper-item")),
      setupBackBtn: document.getElementById("setupBackBtn"),
      setupNextBtn: document.getElementById("setupNextBtn"),
      operationButtons: Array.from(document.querySelectorAll(".operation-btn")),

      teamLeftName: document.getElementById("teamLeftName"),
      teamRightName: document.getElementById("teamRightName"),
      leftTeamHeader: document.getElementById("leftTeamHeader"),
      rightTeamHeader: document.getElementById("rightTeamHeader"),
      leftTeamName: document.getElementById("leftTeamName"),
      rightTeamName: document.getElementById("rightTeamName"),

      leftProblemBox: document.getElementById("leftProblem"),
      rightProblemBox: document.getElementById("rightProblem"),
      leftProblemText: document.getElementById("leftProblemText"),
      rightProblemText: document.getElementById("rightProblemText"),
      leftInput: document.getElementById("leftInput"),
      rightInput: document.getElementById("rightInput"),

      leftScore: document.getElementById("leftScore"),
      rightScore: document.getElementById("rightScore"),
      leftCorrectCount: document.getElementById("leftCorrectCount"),
      rightCorrectCount: document.getElementById("rightCorrectCount"),

      ropeContainer: document.getElementById("ropeContainer"),
      ropeVideo: document.getElementById("ropeVideo"),

      winVideoWrap: document.getElementById("win-video"),
      blueWinVideo: document.getElementById("blueWinVideo"),
      redWinVideo: document.getElementById("redWinVideo"),

      winnerDisplay: document.getElementById("winnerDisplay"),
      winnerName: document.getElementById("winnerName"),
      winnerCorrectAnswers: document.getElementById("winnerCorrectAnswers"),
      winnerTime: document.getElementById("winnerTime"),
      winnerMessage: document.getElementById("winnerMessage"),

      gameTimer: document.getElementById("gameTimer"),

      backgroundMusic: document.getElementById("backgroundMusic"),

      gameShell: document.querySelector(".game-shell"),
      gameStage: document.getElementById("gameStage"),
      gameBoard: document.getElementById("gameBoard"),
    };
  }

  setupEventListeners() {
    if (!window.__ARQON_REACT_RUNTIME__?.isSetupManaged?.()) {
      this.elements.setupNextBtn?.addEventListener("click", () =>
        this.goSetupNext(),
      );
      this.elements.setupBackBtn?.addEventListener("click", () =>
        this.goSetupBack(),
      );

      this.elements.startGameBtn?.addEventListener("click", () =>
        this.startGame(),
      );

      this.elements.operationButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => this.toggleOperation(e));
      });

      document.querySelectorAll(".difficulty-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => this.selectDifficulty(e));
      });
    }

    this.elements.homeBtn?.addEventListener("click", () => {
      if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/";
      }
    });

    document.querySelectorAll(".key-btn").forEach((btn) => {
      const side = btn.getAttribute("data-side");
      const value = btn.getAttribute("data-value");
      const action = btn.getAttribute("data-action");

      btn.addEventListener("click", () => {
        if (window.__ARQON_REACT_RUNTIME__?.isKeypadManaged?.()) return;
        if (!this.state.isActive) return;
        if (!side) return;
        if (this.state.locks[side]) return;

        if (action === "clear") {
          this.clearInput(side);
        } else if (action === "submit") {
          this.checkAnswer(side);
        } else if (value) {
          this.pressKey(side, value);
        }
      });

      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        btn.click();
      });
    });

    ["left", "right"].forEach((side) => {
      const input = this.elements[`${side}Input`];
      if (!input) return;
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.checkAnswer(side);
        }
      });
    });

    if (!window.__ARQON_REACT_RUNTIME__?.isViewManaged?.()) {
      window.addEventListener("resize", () => this.fitBoardToViewport());
      window.addEventListener("orientationchange", () =>
        this.fitBoardToViewport(),
      );

      document.addEventListener("fullscreenchange", () =>
        this.updateFullscreenIcon(),
      );
    }
  }

  setupSecurityMeasures() {
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    document.addEventListener(
      "keydown",
      (e) => {
        const key = String(e.key || "").toLowerCase();
        const isF12 = e.key === "F12";
        const isInspectCombo =
          e.ctrlKey &&
          e.shiftKey &&
          (key === "i" || key === "j" || key === "c");
        const isViewSource = e.ctrlKey && (key === "u" || key === "s");

        if (isF12 || isInspectCombo || isViewSource) {
          e.preventDefault();
          e.stopPropagation();
          this.onDevToolsDetected("shortcut");
          return false;
        }
      },
      true,
    );

    const checkDebuggerPause = () => {
      const start = performance.now();
      debugger;
      const end = performance.now();

      if (end - start > 100) {
        this.onDevToolsDetected("debugger");
      }
    };

    setInterval(checkDebuggerPause, 500);
  }

  onDevToolsDetected(reason = "unknown") {
    if (this.state.devtoolsDetected) return;
    this.state.devtoolsDetected = true;

    if (this.state.isActive) {
      this.state.isActive = false;
      this.updateSideEnabledStates();
    }

    const msg =
      i18n.t("devToolsWarning") || "Developer tools detected! Game paused.";

    if (this.elements.countdown) {
      this.elements.countdown.style.display = "flex";
      this.elements.countdown.classList.remove("go");
      this.elements.countdown.textContent = msg;
    }

    try {
      alert(msg);
    } catch (_) {}

    setTimeout(() => {
      this.state.devtoolsDetected = false;
      if (this.elements.countdown && !this.state.isActive) {
        this.elements.countdown.style.display = "none";
      }
    }, 1500);
  }

  showSetupStep(stepIndex) {
    const clamped = Math.max(0, Math.min(2, stepIndex));
    this.state.setupStep = clamped;

    this.elements.setupSteps.forEach((stepEl) => {
      const s = Number(stepEl.getAttribute("data-step"));
      stepEl.classList.toggle("active", s === clamped);
    });

    this.elements.setupStepperItems.forEach((item) => {
      const s = Number(item.getAttribute("data-step"));
      item.classList.toggle("active", s === clamped);
      item.classList.toggle("done", s < clamped);
    });

    const backBtn = this.elements.setupBackBtn;
    const nextBtn = this.elements.setupNextBtn;
    const startBtn = this.elements.startGameBtn;

    if (backBtn) backBtn.disabled = clamped === 0;

    if (nextBtn && startBtn) {
      if (clamped < 2) {
        nextBtn.style.display = "inline-flex";
        startBtn.style.display = "none";
      } else {
        nextBtn.style.display = "none";
        startBtn.style.display = "inline-flex";
      }
    }

    this.updateSetupNavState();
  }

  goSetupNext() {
    if (
      this.state.setupStep === 0 &&
      this.state.selectedOperations.size === 0
    ) {
      this.pulseOperationButtons();
      return;
    }
    this.showSetupStep(this.state.setupStep + 1);
  }

  goSetupBack() {
    this.showSetupStep(this.state.setupStep - 1);
  }

  toggleOperation(event) {
    const btn = event.currentTarget;
    const op = btn.getAttribute("data-op");
    if (!op) return;

    if (btn.classList.contains("active")) {
      btn.classList.remove("active");
      this.state.selectedOperations.delete(op);
    } else {
      btn.classList.add("active");
      this.state.selectedOperations.add(op);
    }

    this.updateSetupNavState();
  }

  updateSetupNavState() {
    if (!this.elements.setupNextBtn) return;

    if (this.state.setupStep === 0) {
      this.elements.setupNextBtn.disabled =
        this.state.selectedOperations.size === 0;
    } else {
      this.elements.setupNextBtn.disabled = false;
    }
  }

  pulseOperationButtons() {
    this.elements.operationButtons.forEach((btn) => {
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 350);
    });
  }

  selectDifficulty(event) {
    document.querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    event.currentTarget.classList.add("active");
    this.state.difficulty =
      event.currentTarget.getAttribute("data-level") || "easy";
  }

  getSavedZoomPercent() {
    const raw = localStorage.getItem(this.config.zoom.storageKey);
    const num = parseInt(raw || "", 10);
    if (!Number.isFinite(num)) return this.config.zoom.defaultPercent;
    return this.clamp(
      num,
      this.config.zoom.minPercent,
      this.config.zoom.maxPercent,
    );
  }

  setupViewControls() {
    if (window.__ARQON_REACT_RUNTIME__?.isViewManaged?.()) {
      return;
    }

    this.elements.zoomOutBtn?.addEventListener("click", () =>
      this.changeZoom(-this.config.zoom.stepPercent),
    );
    this.elements.zoomInBtn?.addEventListener("click", () =>
      this.changeZoom(this.config.zoom.stepPercent),
    );
    this.elements.zoomLabel?.addEventListener("dblclick", () =>
      this.setZoom(this.config.zoom.defaultPercent),
    );

    this.elements.fullscreenBtn?.addEventListener("click", () =>
      this.toggleFullscreen(),
    );

    this.updateZoomControls();
    this.updateFullscreenIcon();
  }

  changeZoom(deltaPercent) {
    this.setZoom(this.state.zoomPercent + deltaPercent);
  }

  setZoom(percent) {
    const next = this.clamp(
      percent,
      this.state.zoomMinPercent,
      this.state.zoomMaxPercent,
    );
    if (next === this.state.zoomPercent) {
      this.updateZoomControls();
      return;
    }

    this.state.zoomPercent = next;
    localStorage.setItem(this.config.zoom.storageKey, String(next));

    this.fitBoardToViewport();
  }

  updateZoomControls() {
    if (this.elements.zoomLabel) {
      this.elements.zoomLabel.textContent = `${this.state.zoomPercent}%`;
    }

    if (this.elements.zoomOutBtn) {
      this.elements.zoomOutBtn.disabled =
        this.state.zoomPercent <= this.state.zoomMinPercent;
    }

    if (this.elements.zoomInBtn) {
      this.elements.zoomInBtn.disabled =
        this.state.zoomPercent >= this.state.zoomMaxPercent;
    }
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {}

    this.updateFullscreenIcon();
    this.fitBoardToViewport();
  }

  updateFullscreenIcon() {
    const btn = this.elements.fullscreenBtn;
    if (!btn) return;

    const icon = btn.querySelector("i");
    if (!icon) return;

    const isFs = !!document.fullscreenElement;

    icon.classList.toggle("fa-expand", !isFs);
    icon.classList.toggle("fa-compress", isFs);

    btn.setAttribute(
      "aria-label",
      isFs ? "Exit fullscreen" : "Enter fullscreen",
    );
  }

  startGame() {
    if (window.__ARQON_REACT_RUNTIME__?.isSetupManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.startGame?.();
    }

    if (this.state.selectedOperations.size === 0) {
      this.state.selectedOperations.add("+");
      const plusBtn = document.querySelector('.operation-btn[data-op="+"]');
      if (plusBtn) plusBtn.classList.add("active");
    }

    const leftName = (this.elements.teamLeftName?.value || "").trim();
    const rightName = (this.elements.teamRightName?.value || "").trim();

    this.state.leftTeamName = leftName || i18n.t("leftTeamDefault");
    this.state.rightTeamName = rightName || i18n.t("rightTeamDefault");

    if (this.elements.leftTeamHeader)
      this.elements.leftTeamHeader.textContent = this.state.leftTeamName;
    if (this.elements.rightTeamHeader)
      this.elements.rightTeamHeader.textContent = this.state.rightTeamName;
    if (this.elements.leftTeamName)
      this.elements.leftTeamName.textContent = this.state.leftTeamName;
    if (this.elements.rightTeamName)
      this.elements.rightTeamName.textContent = this.state.rightTeamName;

    window.__ARQON_REACT_RUNTIME__?.setTeamNames?.({
      leftHeader: this.state.leftTeamName,
      rightHeader: this.state.rightTeamName,
      leftArena: this.state.leftTeamName,
      rightArena: this.state.rightTeamName,
    });

    if (this.elements.startScreen)
      this.elements.startScreen.style.display = "none";
    if (this.elements.winnerDisplay)
      this.elements.winnerDisplay.style.display = "none";

    this.hideWinVideos();
    this.showRopeVideo();

    this.resetGame();
    this.startCountdown();
  }

  resetGame() {
    this.state.position = 0;
    this.state.isActive = false;

    this.state.scores = { left: 0, right: 0 };
    this.state.answers = { left: 0, right: 0 };
    this.state.locks = { left: false, right: false };

    this.state.startTime = null;
    this.state.elapsedTime = 0;

    this.setInputValue("left", "");
    this.setInputValue("right", "");

    this.updateScores();
    this.updateRopePosition();
    this.updateTimerDisplay(true);
    this.updateSideEnabledStates();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    document.querySelectorAll(".confetti").forEach((c) => c.remove());
  }

  startCountdown() {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.startCountdown?.();
    }

    let count = this.config.countdownStart;

    if (this.elements.countdown) {
      this.elements.countdown.style.display = "flex";
      this.elements.countdown.classList.remove("go");
    }

    if (this.elements.backgroundMusic) {
      this.elements.backgroundMusic.currentTime = 0;
      this.elements.backgroundMusic.play().catch(() => {});
    }

    const countdownInterval = setInterval(() => {
      if (!this.elements.countdown) return;

      if (count > 0) {
        this.elements.countdown.textContent = i18n.getCountdown(count);
        count--;
        return;
      }

      this.elements.countdown.textContent = i18n.getCountdown("go");
      this.elements.countdown.classList.add("go");
      clearInterval(countdownInterval);

      setTimeout(() => {
        if (this.elements.countdown)
          this.elements.countdown.style.display = "none";

        this.state.isActive = true;
        this.state.startTime = Date.now();
        this.updateSideEnabledStates();

        this.startTimer();
        this.generateProblem("left");
        this.generateProblem("right");
      }, 800);
    }, 1000);
  }

  startTimer() {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.startTimer?.();
    }

    this.timerInterval = setInterval(() => {
      if (this.state.isActive && this.state.startTime) {
        this.state.elapsedTime = Date.now() - this.state.startTime;
        this.updateTimerDisplay();
      }
    }, 100);
  }

  updateTimerDisplay(forceZero = false) {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.updateTimerDisplay?.(
        this.state.elapsedTime,
        forceZero,
      );
    }

    const elapsed = forceZero ? 0 : this.state.elapsedTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const timeStr = `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;

    if (this.elements.gameTimer) {
      this.elements.gameTimer.textContent = timeStr;
    }

    window.__ARQON_REACT_RUNTIME__?.setTimer?.(timeStr);
  }

  getDifficultyRange() {
    switch (this.state.difficulty) {
      case "easy":
        return { min: 1, max: 10 };
      case "medium":
        return { min: 10, max: 50 };
      case "hard":
        return { min: 30, max: 100 };
      default:
        return { min: 1, max: 10 };
    }
  }

  getRandomOperation() {
    const ops = Array.from(this.state.selectedOperations);
    if (!ops.length) return "+";
    return ops[Math.floor(Math.random() * ops.length)];
  }

  generateProblem(side) {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.generateProblem?.(side);
    }

    const { min: rangeMin, max: rangeMax } = this.getDifficultyRange();
    const operator = this.getRandomOperation();

    let a, b, answer, problemText;

    switch (operator) {
      case "+":
        a = this.randomInt(rangeMin, rangeMax);
        b = this.randomInt(rangeMin, rangeMax);
        answer = a + b;
        problemText = `${a} + ${b}`;
        break;

      case "-":
        a = this.randomInt(rangeMin, rangeMax);
        b = this.randomInt(rangeMin, rangeMax);
        if (b > a) [a, b] = [b, a];
        answer = a - b;
        problemText = `${a} - ${b}`;
        break;

      case "*":
        a = this.randomInt(rangeMin, rangeMax);
        b = this.randomInt(rangeMin, rangeMax);
        answer = a * b;
        problemText = `${a} × ${b}`;
        break;

      case "/": {
        b = this.randomInt(rangeMin, rangeMax);
        const maxQuotient = Math.max(1, Math.floor(rangeMax / b));
        answer = this.randomInt(1, maxQuotient);
        a = b * answer;
        problemText = `${a} ÷ ${b}`;
        break;
      }

      default:
        a = this.randomInt(rangeMin, rangeMax);
        b = this.randomInt(rangeMin, rangeMax);
        answer = a + b;
        problemText = `${a} + ${b}`;
    }

    this.state.answers[side] = answer;
    const fullProblemText = `${problemText} = ?`;
    const el = this.elements[`${side}ProblemText`];
    if (el) el.textContent = fullProblemText;
    window.__ARQON_REACT_RUNTIME__?.setProblemText?.(side, fullProblemText);
    this.autoFitProblemText(side);
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getInputValue(side) {
    const reactValue = window.__ARQON_REACT_RUNTIME__?.getInputValue?.(side);
    if (typeof reactValue === "string") {
      return reactValue;
    }

    const input = this.elements[`${side}Input`];
    return String(input?.value || "");
  }

  setInputValue(side, value) {
    const input = this.elements[`${side}Input`];
    if (input) {
      input.value = value;
    }

    window.__ARQON_REACT_RUNTIME__?.setInputValue?.(side, value);
  }

  pressKey(side, value) {
    const input = this.elements[`${side}Input`];
    if (!input) return;
    if (!this.state.isActive) return;
    if (this.state.locks[side]) return;

    const currentValue = this.getInputValue(side);
    if (currentValue.length < this.config.maxInputLength) {
      this.setInputValue(side, `${currentValue}${value}`);
    }
  }

  clearInput(side) {
    const input = this.elements[`${side}Input`];
    if (!input) return;
    if (!this.state.isActive) return;
    if (this.state.locks[side]) return;

    this.setInputValue(side, "");
  }

  checkAnswer(side) {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.checkAnswer?.(side);
    }

    if (!this.state.isActive) return;
    if (this.state.locks[side]) return;

    const input = this.elements[`${side}Input`];
    if (!input) return;

    const raw = this.getInputValue(side).trim();
    const userAnswer = raw === "" ? NaN : parseInt(raw, 10);
    const correctAnswer = this.state.answers[side];

    this.state.locks[side] = true;
    this.updateSideEnabledStates();

    if (!Number.isNaN(userAnswer) && userAnswer === correctAnswer) {
      this.handleCorrectAnswer(side, input);
    } else {
      this.handleIncorrectAnswer(side, input);
    }
  }

  handleCorrectAnswer(side, input) {
    input.classList.add("correct");

    this.state.scores[side] += 1;
    if (side === "left") {
      this.state.position -= this.config.step;
    } else {
      this.state.position += this.config.step;
    }

    this.updateScores();
    this.updateRopePosition();

    setTimeout(() => {
      input.classList.remove("correct");
      this.setInputValue(side, "");

      this.state.locks[side] = false;
      this.updateSideEnabledStates();

      this.checkWin();
      if (this.state.isActive) {
        this.generateProblem(side);
      }
    }, 400);
  }

  handleIncorrectAnswer(side, input) {
    input.classList.add("incorrect", "shake");

    const backStep = this.config.step * this.config.wrongStepFactor;

    if (side === "left") {
      this.state.position += backStep;
    } else {
      this.state.position -= backStep;
    }

    this.updateRopePosition();

    setTimeout(() => {
      input.classList.remove("incorrect", "shake");
      this.setInputValue(side, "");

      this.state.locks[side] = false;
      this.updateSideEnabledStates();

      this.checkWin();
    }, 500);
  }

  updateSideEnabledStates() {
    const sides = ["left", "right"];

    sides.forEach((side) => {
      const enabled = this.state.isActive && !this.state.locks[side];

      document
        .querySelectorAll(`.key-btn[data-side="${side}"]`)
        .forEach((btn) => {
          btn.disabled = !enabled;
        });

      const input = this.elements[`${side}Input`];
      if (input) {
        input.disabled = !this.state.isActive;
        input.placeholder = this.state.isActive ? "0" : "—";
      }
    });

    window.__ARQON_REACT_RUNTIME__?.setInteraction?.({
      isActive: this.state.isActive,
      locks: { ...this.state.locks },
    });
  }

  updateScores() {
    if (this.elements.leftScore)
      this.elements.leftScore.textContent = String(this.state.scores.left);
    if (this.elements.rightScore)
      this.elements.rightScore.textContent = String(this.state.scores.right);

    if (this.elements.leftCorrectCount)
      this.elements.leftCorrectCount.textContent = String(
        this.state.scores.left,
      );
    if (this.elements.rightCorrectCount)
      this.elements.rightCorrectCount.textContent = String(
        this.state.scores.right,
      );

    window.__ARQON_REACT_RUNTIME__?.setScores?.({
      left: this.state.scores.left,
      right: this.state.scores.right,
    });
  }

  updateRopePosition() {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.setPosition?.(this.state.position);
    }

    const maxOffset = 250;
    const clampedPosition = Math.max(
      -maxOffset,
      Math.min(maxOffset, this.state.position),
    );

    if (this.elements.ropeContainer) {
      this.elements.ropeContainer.style.transform = `translate(calc(-50% + ${clampedPosition}px), -50%)`;
    }
  }

  checkWin() {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.checkWin?.();
    }

    // G'alaba: arqon pozitsiyasi chegaraga yetdi
    if (Math.abs(this.state.position) >= this.config.winLimit) {
      this.endGame();
      return;
    }

    // G'alaba: birinchi bo'lib winByScore ta to'g'ri javob berdi
    if (
      this.state.scores.left >= this.config.winByScore ||
      this.state.scores.right >= this.config.winByScore
    ) {
      this.endGame();
      return;
    }
  }

  endGame() {
    if (window.__ARQON_REACT_RUNTIME__?.isRuntimeLogicManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.endGame?.();
    }

    this.state.isActive = false;
    this.updateSideEnabledStates();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // G'olibni aniqlash
    let winnerSide;

    // Agar kimdir winByScore ta to'g'ri javob bergan bo'lsa
    if (this.state.scores.left >= this.config.winByScore) {
      winnerSide = "left";
    } else if (this.state.scores.right >= this.config.winByScore) {
      winnerSide = "right";
    } else {
      // Aks holda arqon pozitsiyasi bo'yicha g'olib aniqlanadi
      winnerSide = this.state.position < 0 ? "left" : "right";
    }
    const winnerName =
      winnerSide === "left"
        ? this.state.leftTeamName
        : this.state.rightTeamName;
    const winnerScore = this.state.scores[winnerSide];

    const winnerTime = this.elements.gameTimer?.textContent || "00:00";
    const winnerMessage = i18n.t("winnerMessage");

    if (this.elements.winnerName)
      this.elements.winnerName.textContent = winnerName;
    if (this.elements.winnerCorrectAnswers)
      this.elements.winnerCorrectAnswers.textContent = String(winnerScore);
    if (this.elements.winnerTime)
      this.elements.winnerTime.textContent = winnerTime;
    if (this.elements.winnerMessage)
      this.elements.winnerMessage.textContent = winnerMessage;

    window.__ARQON_REACT_RUNTIME__?.setWinner?.({
      name: winnerName,
      message: winnerMessage,
      correctAnswers: String(winnerScore),
      time: winnerTime,
    });

    if (this.elements.ropeContainer) {
      this.elements.ropeContainer.style.transform = "translate(-50%, -50%)";
    }

    this.hideRopeVideo();
    this.showWinVideo(winnerSide);

    if (this.elements.winnerDisplay) {
      this.elements.winnerDisplay.style.display = "flex";
    }

    this.triggerConfetti();
  }

  hideRopeVideo() {
    if (this.elements.ropeVideo) {
      this.elements.ropeVideo.style.display = "none";
      try {
        this.elements.ropeVideo.pause();
      } catch (_) {}
    }
  }

  showRopeVideo() {
    if (this.elements.ropeVideo) {
      this.elements.ropeVideo.style.display = "block";
      try {
        this.elements.ropeVideo.currentTime = 0;
        this.elements.ropeVideo.play().catch(() => {});
      } catch (_) {}
    }
  }

  hideWinVideos() {
    if (this.elements.winVideoWrap)
      this.elements.winVideoWrap.style.display = "none";

    if (this.elements.blueWinVideo) {
      this.elements.blueWinVideo.style.display = "none";
      try {
        this.elements.blueWinVideo.pause();
      } catch (_) {}
    }

    if (this.elements.redWinVideo) {
      this.elements.redWinVideo.style.display = "none";
      try {
        this.elements.redWinVideo.pause();
      } catch (_) {}
    }
  }

  showWinVideo(winnerSide) {
    if (this.elements.winVideoWrap)
      this.elements.winVideoWrap.style.display = "block";

    const blue = this.elements.blueWinVideo;
    const red = this.elements.redWinVideo;

    if (winnerSide === "left") {
      if (blue) {
        blue.style.display = "block";
        try {
          blue.currentTime = 0;
          blue.play().catch(() => {});
        } catch (_) {}
      }
      if (red) red.style.display = "none";
    } else {
      if (red) {
        red.style.display = "block";
        try {
          red.currentTime = 0;
          red.play().catch(() => {});
        } catch (_) {}
      }
      if (blue) blue.style.display = "none";
    }
  }

  triggerConfetti() {
    const colors = ["#0088cc", "#e74c3c", "#f39c12", "#2ecc71", "#9b59b6"];
    const count = 50;
    const arena = document.querySelector(".arena");

    if (!arena) return;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;

        arena.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4200);
      }, i * 30);
    }
  }

  fitBoardToViewport() {
    const stage = this.elements.gameStage;
    const board = this.elements.gameBoard;
    const shell = this.elements.gameShell;

    if (!stage || !board || !shell) return;

    stage.style.setProperty("--game-scale", "1");

    const cs = window.getComputedStyle(shell);
    const padX =
      parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
    const padY =
      parseFloat(cs.paddingTop || "0") + parseFloat(cs.paddingBottom || "0");

    const availW = Math.max(0, shell.clientWidth - padX);
    const availH = Math.max(0, shell.clientHeight - padY);

    const baseW = board.offsetWidth || 1;
    const baseH = board.offsetHeight || 1;

    const fitScale = Math.min(availW / baseW, availH / baseH, 1);

    const maxFitScale = Math.min(availW / baseW, availH / baseH);

    const boardMaxPercent = Math.floor(
      (maxFitScale / Math.max(fitScale, 0.0001)) * 100 + 0.0001,
    );

    let modalMaxPercent = this.config.zoom.maxPercent;
    const modalOverlay = this.elements.startScreen;
    const modalContent = this.elements.startModalContent;
    const modalVisible = !!(
      modalOverlay && window.getComputedStyle(modalOverlay).display !== "none"
    );

    if (modalVisible && modalContent) {
      const mW = modalContent.offsetWidth || 1;
      const mH = modalContent.offsetHeight || 1;
      const availMW = Math.max(0, window.innerWidth * 0.96);
      const availMH = Math.max(0, window.innerHeight * 0.92);

      const maxModalScale = Math.min(availMW / mW, availMH / mH);
      modalMaxPercent = Math.max(
        this.config.zoom.minPercent,
        Math.floor(maxModalScale * 100),
      );
    }

    const combinedMax = Math.min(
      this.config.zoom.maxPercent,
      boardMaxPercent,
      modalMaxPercent,
    );

    this.state.zoomMaxPercent = this.clamp(
      combinedMax,
      this.config.zoom.minPercent,
      this.config.zoom.maxPercent,
    );

    this.state.zoomPercent = this.clamp(
      this.state.zoomPercent,
      this.state.zoomMinPercent,
      this.state.zoomMaxPercent,
    );
    localStorage.setItem(
      this.config.zoom.storageKey,
      String(this.state.zoomPercent),
    );

    const finalScale = fitScale * (this.state.zoomPercent / 100);

    stage.style.setProperty("--game-scale", finalScale.toFixed(4));

    if (this.elements.startModalContent) {
      this.elements.startModalContent.style.setProperty(
        "--modal-scale",
        (this.state.zoomPercent / 100).toFixed(4),
      );
    }

    this.updateZoomControls();
    this.autoFitAllProblemTexts();
  }

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  autoFitProblemText(side) {
    if (window.__ARQON_REACT_RUNTIME__?.isTextFitManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.autoFitProblemText?.(side);
    }

    const problemText = this.elements[`${side}ProblemText`];
    if (!problemText) return;

    const container = this.elements[`${side}ProblemBox`];
    if (!container) return;

    problemText.style.fontSize = "";

    let fontSize = 32;
    problemText.style.fontSize = fontSize + "px";

    while (problemText.scrollWidth > container.clientWidth && fontSize > 16) {
      fontSize -= 2;
      problemText.style.fontSize = fontSize + "px";
    }
  }

  autoFitAllProblemTexts() {
    if (window.__ARQON_REACT_RUNTIME__?.isTextFitManaged?.()) {
      return window.__ARQON_REACT_RUNTIME__?.autoFitAllProblemTexts?.();
    }

    this.autoFitProblemText("left");
    this.autoFitProblemText("right");
  }
}

window.initTugOfWarGame = () => {
  if (window.__ARQON_GAME__) return window.__ARQON_GAME__;
  window.__ARQON_GAME__ = new TugOfWarGame();
  return window.__ARQON_GAME__;
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.initTugOfWarGame();
  });
} else {
  window.initTugOfWarGame();
}
