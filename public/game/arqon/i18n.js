const translations = {
  en: {
    pageTitle: "Tug of War: Mathematics",
    gameTitle: "TUG OF WAR: MATHEMATICS",
    modalTitle: "PREPARE YOUR TEAMS",

 
    stepOperations: "Operations",
    stepDifficulty: "Difficulty",
    stepTeams: "Teams",
    operationLabel: "Operations",
    operationHint: "Select one or more operations",
    opAddText: "Addition",
    opSubText: "Subtraction",
    opMulText: "Multiplication",
    opDivText: "Division",
    backBtnText: "BACK",
    nextBtnText: "NEXT",

    difficultyLabel: "Difficulty Level",
    easyText: "Easy",
    mediumText: "Medium",
    hardText: "Hard",

    team1Label: "TEAM 1 (BLUE)",
    team2Label: "TEAM 2 (RED)",
    teamPlaceholder: "Team name",

    startBtnText: "START GAME",
    homeBtnText: "Home",

    leftTeamDefault: "Team 1",
    rightTeamDefault: "Team 2",

  
    roundOf: "Round {current} of {total}",

  
    winnerMessage: "Winner!",
    tieTitle: "DRAW",
    tieMessage: "It's a draw!",

    correctAnswersLabel: "correct answers",
    timeLabel: "time",
    playAgainText: "PLAY AGAIN",

    authorText: "Manufacturer:",

    mobileBlockerTitle: "Please use a computer",
    mobileBlockerText:
      "This game is designed only for computers and laptops. Mobile devices are not supported.",

    devToolsWarning: "Developer tools detected! Game paused.",

    countdown: {
      3: "3",
      2: "2",
      1: "1",
      go: "GO!",
    },
  },
  zh: {
    pageTitle: "拔河：数学",
    gameTitle: "拔河：数学",
    modalTitle: "准备你的队伍",

    stepOperations: "步骤",
    stepDifficulty: "难度",
    stepTeams: "队伍",
    operationLabel: "步骤",
    operationHint: "选择一个或多个运算",
    opAddText: "加法",
    opSubText: "减法",
    opMulText: "乘法",
    opDivText: "除法",
    backBtnText: "返回",
    nextBtnText: "下一步",

    difficultyLabel: "难度等级",
    easyText: "简单",
    mediumText: "中等",
    hardText: "困难",

    team1Label: "队伍1（蓝）",
    team2Label: "队伍2（红）",
    teamPlaceholder: "队伍名称",

    startBtnText: "开始游戏",
    homeBtnText: "主页",

    leftTeamDefault: "队伍1",
    rightTeamDefault: "队伍2",

    roundOf: "第 {current} 轮，共 {total} 轮",

    winnerMessage: "获得胜利！",
    tieTitle: "平局",
    tieMessage: "平局！",

    correctAnswersLabel: "正确答案",
    timeLabel: "时间",
    playAgainText: "再来一局",

    authorText: "开发者：",

    mobileBlockerTitle: "请用电脑进入",
    mobileBlockerText:
      "该游戏仅支持电脑和笔记本。移动设备无法使用。",

    devToolsWarning: "检测到开发者工具，游戏已暂停。",

    countdown: {
      3: "3",
      2: "2",
      1: "1",
      go: "开始！",
    },
  },
};

function normalizeLang(value) {
  const lang = String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');

  if (lang.startsWith('zh-')) return 'zh';
  return lang;
}

class I18n {
  constructor() {
    const savedLang = normalizeLang(localStorage.getItem('gameLang'));
    this.currentLang = translations[savedLang] ? savedLang : 'en';
    this.init();
  }

  init() {
    this.setupLanguageButtons();
    this.updateLanguage(this.currentLang);
  }

  setupLanguageButtons() {
    this.langButtons = Array.from(document.querySelectorAll('.lang-btn'));
    this.langSelector = document.getElementById('languageSelector');
    this.langToggle = document.getElementById('langToggle');
    this.langToggleFlag = document.getElementById('langToggleFlag');
    this.langToggleText = document.getElementById('langToggleText');
    this.langMenu = document.getElementById('langMenu');

    this.langButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.updateLanguage(lang);
        this.closeLangMenu();
      });
    });

    if (this.langToggle) {
      this.langToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleLangMenu();
      });
    }

    document.addEventListener('click', (event) => {
      if (!this.langSelector) return;
      if (!this.langSelector.contains(event.target)) {
        this.closeLangMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeLangMenu();
      }
    });

    this.updateToggleDisplay(this.currentLang);
    this.setupFlagFallbacks();
  }

  setupFlagFallbacks() {
    (this.langButtons || []).forEach((btn) => {
      const img = btn.querySelector('img');
      if (!img) return;
      img.dataset.lang = btn.getAttribute('data-lang') || img.alt || '';
      this.bindFlagFallback(img);
    });

    if (this.langToggleFlag) {
      this.langToggleFlag.dataset.lang = this.currentLang;
      this.bindFlagFallback(this.langToggleFlag);
    }
  }

  bindFlagFallback(img) {
    if (!img || img.dataset.flagFallbackBound === '1') return;
    img.dataset.flagFallbackBound = '1';
    const handler = () => this.applyFlagFallback(img);
    img.addEventListener('error', handler);
    if (img.complete && img.naturalWidth === 0) handler();
  }

  applyFlagFallback(img) {
    const data = this.getFlagFallbackData(img.dataset.lang || img.alt || '');
    img.src = this.buildFlagFallbackSvg(data);
    img.alt = data.label;
  }

  getFlagFallbackData(lang) {
    const code = String(lang || '').trim().toLowerCase();
    if (code === 'en') {
      return { label: 'EN', bg: '#012169', fg: '#ffffff', border: '#00123a' };
    }
    if (code === 'zh') {
      return { label: 'ZH', bg: '#de2910', fg: '#ffd100', border: '#8a1007' };
    }
    const label = (code || '??').toUpperCase().slice(0, 2);
    return { label, bg: '#64748b', fg: '#ffffff', border: '#475569' };
  }

  buildFlagFallbackSvg(data) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="28" viewBox="0 0 40 28">` +
      `<rect width="40" height="28" rx="4" fill="${data.bg}" stroke="${data.border}" stroke-width="1"/>` +
      `<text x="20" y="19" font-size="12" text-anchor="middle" font-family="Arial, sans-serif" fill="${data.fg}" font-weight="700">${data.label}</text>` +
      `</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  toggleLangMenu() {
    if (!this.langSelector || !this.langToggle) return;
    const isOpen = this.langSelector.classList.toggle('open');
    this.langToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  closeLangMenu() {
    if (!this.langSelector || !this.langToggle) return;
    this.langSelector.classList.remove('open');
    this.langToggle.setAttribute('aria-expanded', 'false');
  }

  updateToggleDisplay(lang) {
    if (!this.langToggleFlag || !this.langToggleText) return;

    const button =
      this.langButtons?.find((btn) => btn.getAttribute('data-lang') === lang) ||
      null;

    if (!button) {
      this.langToggleText.textContent = (lang || '').toUpperCase();
      return;
    }

    const shortText = button.getAttribute('data-short');
    const labelText =
      shortText ||
      button.querySelector('span')?.textContent ||
      (lang || '').toUpperCase();

    this.langToggleText.textContent = labelText.trim();

    const img = button.querySelector('img');
    if (img) {
      this.langToggleFlag.src = img.src;
      this.langToggleFlag.alt = img.alt || lang;
      this.langToggleFlag.dataset.lang = lang;
    }
  }

  updateLanguage(lang) {
    const normalized = normalizeLang(lang);
    if (!translations[normalized]) return;

    this.currentLang = normalized;
    localStorage.setItem('gameLang', normalized);
    document.documentElement.setAttribute('lang', normalized);

    (this.langButtons || document.querySelectorAll('.lang-btn')).forEach(
      (btn) => {
        const isActive = btn.getAttribute('data-lang') === normalized;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    );

    this.updateToggleDisplay(normalized);

    this.translatePage();
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: normalized } }));
  }

  translatePage() {
    const t = translations[this.currentLang];

    document.title = t.pageTitle;

    const setContent = (id, text, upper = false) => {
      const el = document.getElementById(id);
      if (!el || text == null) return;
      const value = upper ? String(text).toUpperCase() : String(text);
      el.textContent = value;
    };

    setContent('pageTitle', t.pageTitle);
    setContent('gameTitle', t.gameTitle, true);
    setContent('gameSubtitle', t.gameSubtitle);
    setContent('modalTitle', t.modalTitle);


    setContent('stepOperations', t.stepOperations);
    setContent('stepDifficulty', t.stepDifficulty);
    setContent('stepTeams', t.stepTeams);
    setContent('operationLabel', t.operationLabel);
    setContent('operationHint', t.operationHint);
    setContent('opAddText', t.opAddText);
    setContent('opSubText', t.opSubText);
    setContent('opMulText', t.opMulText);
    setContent('opDivText', t.opDivText);
    setContent('backBtnText', t.backBtnText, true);
    setContent('nextBtnText', t.nextBtnText, true);


    setContent('difficultyLabel', t.difficultyLabel);
    setContent('easyText', t.easyText);
    setContent('mediumText', t.mediumText);
    setContent('hardText', t.hardText);


    setContent('team1Label', t.team1Label);
    setContent('team2Label', t.team2Label);
    setContent('startBtnText', t.startBtnText, true);

 
    setContent('homeBtnText', t.homeBtnText, true);
    setContent('winnerMessage', t.winnerMessage);
    setContent('correctAnswersLabel', t.correctAnswersLabel);
    setContent('timeLabel', t.timeLabel);
    setContent('playAgainText', t.playAgainText, true);
    setContent('authorText', t.authorText);

    const setPlaceholder = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.placeholder = text;
    };

    setPlaceholder('teamLeftName', t.teamPlaceholder);
    setPlaceholder('teamRightName', t.teamPlaceholder);
  }

  t(key) {
    return translations[this.currentLang]?.[key] || key;
  }

  getCountdown(num) {
    return translations[this.currentLang]?.countdown?.[num] || String(num);
  }
}

const i18n = new I18n();
