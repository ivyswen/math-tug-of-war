export function GameAudio() {
  return <audio id="backgroundMusic" src="/game/assets/audio/audio.mp3" loop />;
}

export function HomeButton() {
  return (
    <button className="home-btn" id="homeBtn" type="button" aria-label="Home">
      <i className="fa-solid fa-house"></i>
      <span id="homeBtnText">HOME</span>
    </button>
  );
}

export function LanguageSelector() {
  return (
    <div className="language-selector" id="languageSelector">
      <button
        className="lang-toggle"
        id="langToggle"
        type="button"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <span className="lang-flag">
          <img id="langToggleFlag" src="/game/assets/flags/en.svg" alt="en" />
        </span>
        <span className="lang-code" id="langToggleText">
          EN
        </span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div className="lang-menu" id="langMenu" role="listbox">
        <button
          className="lang-btn"
          data-lang="en"
          data-short="EN"
          type="button"
          role="option"
          aria-label="English"
        >
          <img src="/game/assets/flags/en.svg" alt="en" />
          <span>English</span>
        </button>
        <button
          className="lang-btn"
          data-lang="zh"
          data-short="ZH"
          type="button"
          role="option"
          aria-label="中文"
        >
          <img src="/game/assets/flags/zh.svg" alt="zh" />
          <span>中文</span>
        </button>
      </div>
    </div>
  );
}

export function GameHeader() {
  return (
    <header className="game-header">
      <h1 id="gameTitle">ARQON TORTISH: MATEMATIKA</h1>
    </header>
  );
}

export function GameFooter() {
  return (
    <footer className="game-footer">
      <div className="social-links">
        <a
          className="social-link"
          href="https://t.me/UZPRODEVS"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram"
        >
          <i className="fab fa-telegram"></i>
        </a>
        <a
          className="social-link"
          href="https://www.xiaohongshu.com/user/profile/603f8925000000000100bda5"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xiaohongshu"
        >
          <i className="fa-solid fa-link"></i>
        </a>
        <a
          className="social-link"
          href="https://instagram.com/norinjon_boltaboev"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <i className="fab fa-instagram"></i>
        </a>
      </div>
      <p>
        <i className="fab fa-telegram"></i>
        <span id="authorText">Developer:</span>{' '}
        <a href="https://t.me/UZPRODEVS" target="_blank" rel="noreferrer">
          @UZPRODEVS
        </a>
        {' | '}
        <a
          href="https://www.xiaohongshu.com/user/profile/603f8925000000000100bda5"
          target="_blank"
          rel="noreferrer"
        >
          小红书主页
        </a>
      </p>
    </footer>
  );
}

export function ViewControls({
  zoomLabel = '100%',
  canZoomOut = true,
  canZoomIn = true,
  muteLabel = 'Mute audio',
  muteIconClass = 'fa-solid fa-volume-high',
  fullscreenLabel = 'Enter fullscreen',
  fullscreenIconClass = 'fa-solid fa-expand',
  onZoomOut = () => {},
  onZoomIn = () => {},
  onZoomReset = () => {},
  onToggleMute = () => {},
  onToggleFullscreen = () => {},
}) {
  return (
    <div
      className="view-controls"
      id="viewControls"
      aria-label="Zoom and fullscreen controls"
    >
      <button className="view-btn" id="zoomOutBtn" type="button" aria-label="Zoom out" disabled={!canZoomOut} onClick={onZoomOut}>
        <i className="fa-solid fa-minus"></i>
      </button>
      <span className="view-label" id="zoomLabel" onDoubleClick={onZoomReset}>
        {zoomLabel}
      </span>
      <button className="view-btn" id="zoomInBtn" type="button" aria-label="Zoom in" disabled={!canZoomIn} onClick={onZoomIn}>
        <i className="fa-solid fa-plus"></i>
      </button>
      <button
        className="view-btn"
        id="muteBtn"
        type="button"
        aria-label={muteLabel}
        onClick={onToggleMute}
      >
        <i className={muteIconClass}></i>
      </button>
      <button
        className="view-btn"
        id="fullscreenBtn"
        type="button"
        aria-label={fullscreenLabel}
        onClick={onToggleFullscreen}
      >
        <i className={fullscreenIconClass}></i>
      </button>
    </div>
  );
}
