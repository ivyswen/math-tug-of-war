(function () {
  "use strict";

  var rawConfig = window.__TUG_AUDIO_PANEL__ || null;
  if (!rawConfig || !Array.isArray(rawConfig.audios) || !rawConfig.audios.length) {
    return;
  }

  var TEXT = {
    en: {
      trigger: "Music",
      triggerMetaFallback: "Choose audio",
      title: "Music Settings",
      subtitle: "Pick a track. Your choice stays saved for the next games.",
      current: "Current track",
      preview: "Preview",
      pause: "Pause",
      selected: "Selected",
      playing: "Now playing",
      close: "Close",
    },
    zh: {
      trigger: "音乐",
      triggerMetaFallback: "选择音频",
      title: "音乐设置",
      subtitle: "选择一个音轨，您的选择将用于后续游戏。",
      current: "当前音轨",
      preview: "试听",
      pause: "暂停",
      selected: "已选",
      playing: "正在播放",
      close: "关闭",
    },
  };

  var config = {
    storageKey: String(rawConfig.storageKey || "edugames.tugofwar.settings.v1"),
    selectedField: String(rawConfig.selectedField || "selectedAudioId"),
    defaultAudioId: String(rawConfig.defaultAudioId || ""),
    audioElementId: String(rawConfig.audioElementId || ""),
    autoPlayOnSelect: rawConfig.autoPlayOnSelect !== false,
  };

  var audios = rawConfig.audios
    .map(function (item, index) {
      if (!item || typeof item !== "object") return null;

      var id = String(item.id || item.file || "track-" + (index + 1)).trim();
      var src = String(item.src || "").trim();
      if (!id || !src) return null;

      return {
        id: id,
        src: src,
        label: String(item.label || id),
        description: String(item.description || ""),
        file: String(item.file || ""),
        accent: String(item.accent || "#2563eb"),
      };
    })
    .filter(Boolean);

  if (!audios.length) return;

  var state = {
    selectedId: resolveSelectedId(readSettings()[config.selectedField]),
    playingId: "",
    open: false,
    lang: detectLang(),
  };

  var els = buildUi();
  mountTrigger(els.trigger);
  document.body.appendChild(els.drawer);

  var outputAudio = resolveOutputAudio();
  bindAudioState(outputAudio);
  bindEvents();
  applySelectedAudio({
    autoplay: false,
    resetTime: false,
    persist: false,
    keepPlaying: false,
  });
  renderAll();

  function getText() {
    return TEXT[state.lang] || TEXT.en;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function detectLang() {
    var settings = readSettings();
    var saved = normalizeLang(settings.lang);
    if (TEXT[saved]) return saved;

    var docLang = normalizeLang(document.documentElement.getAttribute("lang"));
    if (TEXT[docLang]) return docLang;

    return "en";
  }

  function normalizeLang(value) {
    var lang = String(value || "")
      .trim()
      .toLowerCase()
      .replace("_", "-");

    if (lang === "zh-cn" || lang === "zh-tw" || lang === "zh-hk" || lang === "zh-mo") {
      return "zh";
    }

    return lang;
  }

  function getStore() {
    return window.__TUG_GAME_SETTINGS__ || null;
  }

  function readSettings() {
    var store = getStore();
    if (store && typeof store.read === "function") {
      var storeData = store.read();
      return storeData && typeof storeData === "object" ? storeData : {};
    }

    try {
      var raw = localStorage.getItem(config.storageKey) || "";
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeSettingsPatch(patch) {
    var store = getStore();
    if (store && typeof store.update === "function") {
      return store.update(patch || {});
    }

    var current = readSettings();
    var next = Object.assign({}, current, patch || {});

    try {
      localStorage.setItem(config.storageKey, JSON.stringify(next));
    } catch (_) {
      // ignore
    }

    return next;
  }

  function hasAudio(id) {
    return audios.some(function (item) {
      return item.id === id;
    });
  }

  function resolveSelectedId(value) {
    var requested = String(value || "").trim();
    if (hasAudio(requested)) return requested;

    var defaultId = String(config.defaultAudioId || "").trim();
    if (hasAudio(defaultId)) return defaultId;

    return audios[0].id;
  }

  function getAudioById(id) {
    var found = audios.find(function (item) {
      return item.id === id;
    });
    return found || audios[0];
  }

  function getSelectedAudio() {
    return getAudioById(state.selectedId);
  }

  function readVolumeSettings() {
    var settings = readSettings();
    var volume = Number(settings.volumePercent);
    if (!Number.isFinite(volume)) {
      volume = 80;
    }

    return {
      volumePercent: Math.max(0, Math.min(100, Math.round(volume))),
      isMuted: !!settings.isMuted,
    };
  }

  function resolveOutputAudio() {
    var el = null;

    if (config.audioElementId) {
      el = document.getElementById(config.audioElementId);
    }

    if (!el) {
      el = document.getElementById("backgroundMusic");
    }

    if (!el) {
      el = document.getElementById("tugAudioPreview");
    }

    if (!el) {
      el = document.createElement("audio");
      el.id = "tugAudioPreview";
      el.hidden = true;
      el.loop = true;
      el.preload = "metadata";
      document.body.appendChild(el);
    }

    if (!el.hasAttribute("loop")) {
      el.loop = true;
    }

    return el;
  }

  function bindAudioState(audio) {
    ["play", "pause", "ended"].forEach(function (eventName) {
      audio.addEventListener(eventName, syncPlaybackStateFromElement);
    });
  }

  function syncAudioOutputSettings() {
    if (!outputAudio) return;

    var audioSettings = readVolumeSettings();
    outputAudio.volume = audioSettings.volumePercent / 100;
    outputAudio.muted = audioSettings.isMuted;
  }

  function applySelectedAudio(options) {
    var opts = options || {};
    var selected = getSelectedAudio();
    if (!selected || !outputAudio) return;

    syncAudioOutputSettings();

    var currentSrc = String(
      outputAudio.getAttribute("src") || outputAudio.currentSrc || "",
    );
    var sameTrack =
      outputAudio.dataset.tugAudioId === selected.id ||
      (currentSrc && currentSrc.indexOf(selected.src) !== -1);
    var wasPlaying = !outputAudio.paused && !outputAudio.ended;
    var shouldAutoplay = !!opts.autoplay || (!!opts.keepPlaying && wasPlaying);

    outputAudio.dataset.tugAudioId = selected.id;

    if (!sameTrack) {
      try {
        outputAudio.pause();
      } catch (_) {
        // ignore
      }

      outputAudio.src = selected.src;
      outputAudio.load();
    }

    if (opts.resetTime) {
      try {
        outputAudio.currentTime = 0;
      } catch (_) {
        // ignore
      }
    }

    if (opts.persist !== false) {
      writeSettingsPatch(
        (function () {
          var patch = {};
          patch[config.selectedField] = selected.id;
          return patch;
        })(),
      );
    }

    if (shouldAutoplay) {
      try {
        var playback = outputAudio.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(function () {});
        }
      } catch (_) {
        // ignore
      }
    }

    syncPlaybackStateFromElement();
    dispatchSelectionChange(selected);
  }

  function dispatchSelectionChange(selected) {
    document.dispatchEvent(
      new CustomEvent("tugAudioSelectionChange", {
        detail: {
          audio: selected,
          selectedId: selected.id,
          storageKey: config.storageKey,
          field: config.selectedField,
        },
      }),
    );
  }

  function syncPlaybackStateFromElement() {
    if (!outputAudio) return;

    var isPlaying = !outputAudio.paused && !outputAudio.ended;
    state.playingId = isPlaying
      ? String(outputAudio.dataset.tugAudioId || state.selectedId)
      : "";

    renderCurrent();
    renderCards();
  }

  function playAudio(id) {
    state.selectedId = resolveSelectedId(id);
    applySelectedAudio({
      autoplay: true,
      resetTime: true,
      persist: true,
      keepPlaying: true,
    });
    renderAll();
  }

  function pauseAudio() {
    if (!outputAudio) return;

    try {
      outputAudio.pause();
    } catch (_) {
      // ignore
    }

    syncPlaybackStateFromElement();
    renderAll();
  }

  function selectAudio(id) {
    state.selectedId = resolveSelectedId(id);
    applySelectedAudio({
      autoplay: !!config.autoPlayOnSelect,
      resetTime: !!config.autoPlayOnSelect,
      persist: true,
      keepPlaying: true,
    });
    renderAll();
  }

  function toggleDrawer(open) {
    state.open = !!open;
    els.drawer.hidden = !state.open;
    els.drawer.classList.toggle("is-open", state.open);
    els.trigger.setAttribute("aria-expanded", state.open ? "true" : "false");
    document.body.classList.toggle("tug-audio-drawer-open", state.open);
  }

  function buildUi() {
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "tug-audio-trigger";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML =
      '<span class="tug-audio-trigger__icon"><i class="fa-solid fa-sliders"></i></span>' +
      '<span class="tug-audio-trigger__text">' +
      '  <strong data-audio-trigger-label></strong>' +
      '  <small data-audio-trigger-meta></small>' +
      "</span>" +
      '<span class="tug-audio-trigger__count" data-audio-trigger-count></span>';

    var drawer = document.createElement("div");
    drawer.className = "tug-audio-drawer";
    drawer.hidden = true;
    drawer.innerHTML =
      '<button class="tug-audio-drawer__overlay" type="button" data-audio-close tabindex="-1" aria-hidden="true"></button>' +
      '<aside class="tug-audio-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="tugAudioDrawerTitle">' +
      '  <div class="tug-audio-drawer__inner">' +
      '    <header class="tug-audio-drawer__header">' +
      '      <div class="tug-audio-drawer__header-copy">' +
      '        <h2 id="tugAudioDrawerTitle" class="tug-audio-drawer__title" data-audio-title></h2>' +
      '        <p class="tug-audio-drawer__subtitle" data-audio-subtitle></p>' +
      "      </div>" +
      '      <button class="tug-audio-drawer__close" type="button" data-audio-close>' +
      '        <i class="fa-solid fa-xmark"></i>' +
      "      </button>" +
      "    </header>" +
      '    <section class="tug-audio-drawer__current">' +
      '      <span class="tug-audio-drawer__current-label" data-audio-current-label></span>' +
      '      <div class="tug-audio-drawer__current-body">' +
      '        <strong class="tug-audio-drawer__current-name" data-audio-current-name></strong>' +
      '        <span class="tug-audio-drawer__current-status" data-audio-current-status></span>' +
      "      </div>" +
      "    </section>" +
      '    <div class="tug-audio-list" data-audio-list></div>' +
      "  </div>" +
      "</aside>";

    return {
      trigger: trigger,
      drawer: drawer,
      triggerLabel: trigger.querySelector("[data-audio-trigger-label]"),
      triggerMeta: trigger.querySelector("[data-audio-trigger-meta]"),
      triggerCount: trigger.querySelector("[data-audio-trigger-count]"),
      title: drawer.querySelector("[data-audio-title]"),
      subtitle: drawer.querySelector("[data-audio-subtitle]"),
      currentLabel: drawer.querySelector("[data-audio-current-label]"),
      currentName: drawer.querySelector("[data-audio-current-name]"),
      currentStatus: drawer.querySelector("[data-audio-current-status]"),
      list: drawer.querySelector("[data-audio-list]"),
    };
  }

  function mountTrigger(trigger) {
    var viewControls = document.getElementById("viewControls");
    if (viewControls) {
      var musicGroup = document.getElementById("musicControlsGroup");
      if (!musicGroup) {
        musicGroup = document.createElement("div");
        musicGroup.className = "view-group view-group--music";
        musicGroup.id = "musicControlsGroup";
        viewControls.appendChild(musicGroup);
      }

      trigger.classList.add("view-btn", "tug-audio-trigger--control");
      musicGroup.appendChild(trigger);
      els.musicGroup = musicGroup;
      return;
    }

    var tugHeader = document.querySelector(".tug-header");
    if (tugHeader) {
      trigger.classList.add("tug-audio-trigger--inline");
      tugHeader.appendChild(trigger);
      return;
    }

    trigger.classList.add("tug-audio-trigger--floating");
    if (document.getElementById("languageSelector")) {
      trigger.classList.add("tug-audio-trigger--game");
    }
    document.body.appendChild(trigger);
  }

  function bindEvents() {
    els.trigger.addEventListener("click", function () {
      toggleDrawer(!state.open);
    });

    els.drawer.addEventListener("click", function (event) {
      var closeTarget = event.target.closest("[data-audio-close]");
      if (closeTarget) {
        toggleDrawer(false);
        return;
      }

      var previewBtn = event.target.closest("[data-audio-preview]");
      if (previewBtn) {
        var previewId = previewBtn.getAttribute("data-audio-preview");
        if (
          previewId &&
          state.playingId === previewId &&
          outputAudio &&
          !outputAudio.paused
        ) {
          pauseAudio();
        } else if (previewId) {
          playAudio(previewId);
        }
        return;
      }

      var selectBtn = event.target.closest("[data-audio-select]");
      if (selectBtn) {
        var selectId = selectBtn.getAttribute("data-audio-select");
        if (selectId) {
          selectAudio(selectId);
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && state.open) {
        toggleDrawer(false);
      }
    });

    document.addEventListener("languageChanged", function () {
      state.lang = detectLang();
      renderAll();
    });

    window.addEventListener("storage", function (event) {
      if (event.key && event.key !== config.storageKey) {
        return;
      }

      state.lang = detectLang();
      state.selectedId = resolveSelectedId(readSettings()[config.selectedField]);
      applySelectedAudio({
        autoplay: false,
        resetTime: false,
        persist: false,
        keepPlaying: false,
      });
      renderAll();
    });
  }

  function renderAll() {
    renderStaticText();
    renderTrigger();
    renderCurrent();
    renderCards();
  }

  function renderStaticText() {
    var text = getText();

    if (els.title) els.title.textContent = text.title;
    if (els.subtitle) els.subtitle.textContent = text.subtitle;
    if (els.currentLabel) els.currentLabel.textContent = text.current;

    if (els.musicGroup) {
      els.musicGroup.setAttribute("aria-label", text.title);
    }

    var closeButtons = els.drawer.querySelectorAll("[data-audio-close]");
    closeButtons.forEach(function (button) {
      if (button.classList.contains("tug-audio-drawer__close")) {
        button.setAttribute("aria-label", text.close);
        button.setAttribute("title", text.close);
      }
    });
  }

  function renderTrigger() {
    var text = getText();
    var selected = getSelectedAudio();
    var triggerLabel = text.title;
    if (selected && selected.label) {
      triggerLabel += ": " + selected.label;
    }

    if (els.triggerLabel) {
      els.triggerLabel.textContent = text.trigger;
    }

    if (els.triggerMeta) {
      els.triggerMeta.textContent = selected
        ? selected.label
        : text.triggerMetaFallback;
    }

    if (els.triggerCount) {
      els.triggerCount.textContent = String(audios.length);
      els.triggerCount.setAttribute("title", String(audios.length));
    }

    els.trigger.setAttribute("aria-label", triggerLabel);
    els.trigger.setAttribute("title", triggerLabel);
  }

  function renderCurrent() {
    var text = getText();
    var selected = getSelectedAudio();
    if (!selected) return;

    if (els.currentName) els.currentName.textContent = selected.label;
    if (els.currentStatus) {
      els.currentStatus.innerHTML =
        '<i class="fa-solid ' +
        (state.playingId === selected.id ? "fa-volume-high" : "fa-check") +
        '"></i> ' +
        escapeHtml(
          state.playingId === selected.id ? text.playing : text.selected,
        );
    }
  }

  function renderCards() {
    if (!els.list) return;

    var text = getText();
    els.list.innerHTML = audios
      .map(function (audio, index) {
        var isSelected = audio.id === state.selectedId;
        var isPlaying = audio.id === state.playingId;
        var previewText = isPlaying ? text.pause : text.preview;
        var previewIcon = isPlaying ? "fa-pause" : "fa-play";
        var statusText = isPlaying ? text.playing : isSelected ? text.selected : "";
        var previewLabel = previewText + ": " + audio.label;

        return (
          '<article class="tug-audio-card' +
          (isSelected ? " is-selected" : "") +
          (isPlaying ? " is-playing" : "") +
          '" style="--tug-audio-accent:' +
          escapeHtml(audio.accent) +
          ';">' +
          '  <button class="tug-audio-card__select" type="button" data-audio-select="' +
          escapeHtml(audio.id) +
          '">' +
          '    <span class="tug-audio-card__index">' +
          escapeHtml(("0" + (index + 1)).slice(-2)) +
          "</span>" +
          '    <span class="tug-audio-card__content">' +
          '      <span class="tug-audio-card__title">' +
          escapeHtml(audio.label) +
          "</span>" +
          '      <span class="tug-audio-card__description">' +
          escapeHtml(audio.description || text.triggerMetaFallback) +
          "</span>" +
          "    </span>" +
          (statusText
            ? '    <span class="tug-audio-card__state">' +
              '<i class="fa-solid ' +
              (isPlaying ? "fa-volume-high" : "fa-check") +
              '"></i> ' +
              escapeHtml(statusText) +
              "</span>"
            : "") +
          "  </button>" +
          '  <button class="tug-audio-card__preview' +
          (isPlaying ? " is-active" : "") +
          '" type="button" data-audio-preview="' +
          escapeHtml(audio.id) +
          '" aria-label="' +
          escapeHtml(previewLabel) +
          '" title="' +
          escapeHtml(previewText) +
          '">' +
          '    <i class="fa-solid ' +
          previewIcon +
          '"></i>' +
          "  </button>" +
          "</article>"
        );
      })
      .join("");
  }
})();
