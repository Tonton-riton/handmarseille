/**
 * ============================================================================
 * APPLICATION PRINCIPALE — LE GRAND QUIZ DU HANDBALL (KAHOOT! EDITION) | MPHB
 * Marseille Provence Handball — Stage Multisport de Noël
 * ============================================================================
 */

(function () {
  "use strict";

  var STORAGE_KEYS = {
    QUESTIONS: "mphb_questions_bank_v1",
    QUIZZES: "mphb_quizzes_list_v1",
    TEAMS: "mphb_teams_list_v1",
    CONFIG: "mphb_game_config_v1",
    HISTORY: "mphb_session_history_v1",
    LOGO: "mphb_custom_logo_data_v1",
    LIVE_PIN: "mphb_kahoot_live_pin_v1",
    ADMIN_CODE: "mphb_admin_secret_code_v1"
  };

  // Les 4 formes iconiques de Kahoot!
  var KAHOOT_SHAPES = [
    { symbol: "▲", name: "Triangle Rouge", colorClass: "k-red", hex: "#E21B3C" },
    { symbol: "◆", name: "Losange Bleu", colorClass: "k-blue", hex: "#1368CE" },
    { symbol: "●", name: "Cercle Jaune", colorClass: "k-yellow", hex: "#D89E00" },
    { symbol: "■", name: "Carré Vert", colorClass: "k-green", hex: "#26890C" }
  ];

  var TEAM_COLORS = [
    "#0055A4", "#EAB308", "#E63946", "#16A34A",
    "#9333EA", "#EA580C", "#0284C7", "#DB2777"
  ];

  var PRAISE_MESSAGES = [
    { emoji: "🎉", title: "BUUUUT ! Excellente réponse !" },
    { emoji: "🤾", title: "Tir en pleine lucarne ! Bravo !" },
    { emoji: "⭐", title: "Superbe ! Tu connais les règles comme un pro du MPHB !" },
    { emoji: "🔥", title: "Quelle passe décisive ! C'est exactement ça !" },
    { emoji: "🏆", title: "Parfait ! Le coach du Marseille Provence Handball valide !" },
    { emoji: "🎄", title: "Magnifique ! Un vrai champion du stage de Noël !" }
  ];

  var ENCOURAGE_MESSAGES = [
    { emoji: "💪", title: "Presque ! On apprend en s'amusant, regarde l'astuce :" },
    { emoji: "🙂", title: "Bien tenté ! Même les grands champions apprennent à l'entraînement :" },
    { emoji: "🤾", title: "Dommage, le tir passe juste à côté du poteau ! Voici la règle :" },
    { emoji: "💡", title: "Ce n'était pas loin ! Retiens bien cette explication pour la suite :" },
    { emoji: "🌟", title: "Pas de souci, l'important est de découvrir ! Voici la bonne réponse :" }
  ];

  // Canal de synchronisation temps-réel entre onglets (Lobby Host <-> Manettes Joueurs)
  var liveChannel = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      liveChannel = new BroadcastChannel("mphb_kahoot_channel");
    }
  } catch (e) {}

  var state = {
    categories: window.MPHB_CATEGORIES ? JSON.parse(JSON.stringify(window.MPHB_CATEGORIES)) : [],
    questions: [],
    quizzes: [],
    teams: [],
    sessionHistory: [],
    customLogoDataUrl: null,
    autoFileLogoLoaded: false,
    gamePin: "482 915",
    adminCode: "1961",
    adminUnlocked: false,

    config: {
      sourceType: "preset",
      selectedQuizId: "quiz_noel_mphb",
      selectedCategories: ["regles", "terrain", "technique", "arbitrage"],
      questionCount: 12,
      levelFilter: "all",
      timerEnabled: true,
      timerSeconds: 20,
      shuffleQuestions: true,
      gameMode: "individual", // "individual" | "teams"
      teamVoteMode: "turn",   // "turn" (Tour par tour) | "all" (Toutes les équipes votent)
      playerName: ""
    },

    game: {
      active: false,
      title: "",
      questionsList: [],
      currentIndex: 0,
      answered: false,
      score: 0,           // Score Kahoot en points (ex: 8450)
      streak: 0,          // Série de bonnes réponses consécutives
      correctCount: 0,
      wrongCount: 0,
      activeTeamIndex: 0,
      selectedVoterTeamIdx: 0,
      teamVotes: {},      // { teamIndex: { choice: 0..3, timeMs: 1200 } }
      voteCounts: [0, 0, 0, 0],
      questionStartTime: 0,
      timerTotal: 20,
      timerRemaining: 20,
      timerInterval: null,
      timerPaused: false,
      showingScoreboard: false,
      historyLog: []
    },

    // État de la Manette Joueur (#screen-player)
    playerPad: {
      joined: false,
      pin: "",
      name: "",
      avatar: "🦁",
      teamId: null,
      score: 0,
      lockedChoice: null
    },

    quizEditorSelectedIds: []
  };

  // ==========================================================================
  // 1. INITIALISATION
  // ==========================================================================
  function initApp() {
    loadAllFromStorage();
    setupAutoFileLogoDetection();
    renderLogos();
    bindNavigationEvents();
    bindHomeEvents();
    bindLobbyEvents();
    bindQuizEvents();
    bindResultsEvents();
    bindAdminEvents();
    bindAdminLoginModalEvents();
    bindPlayerControllerEvents();
    bindModalTeamsEvents();
    bindKeyboardShortcuts();
    setupLiveSyncListeners();

    if (window.MPHB_FX) {
      window.MPHB_FX.init();
    }
    updateTopBarIcons();
    refreshAllUI();

    // Si l'URL contient ?player=1, ouvrir directement la Manette Joueur avec le PIN pré-rempli
    checkUrlParams();
  }

  function checkUrlParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("player") === "1") {
        var pinParam = params.get("pin") || state.gamePin;
        document.getElementById("player-pin-input").value = pinParam;
        showScreen("screen-player");
      }
    } catch (e) {}
  }

  function loadAllFromStorage() {
    // 1. Questions
    try {
      var savedQ = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (savedQ) {
        var parsedQ = JSON.parse(savedQ);
        if (Array.isArray(parsedQ) && parsedQ.length > 0) state.questions = parsedQ;
      }
    } catch (e) {}
    if (!state.questions || state.questions.length === 0) {
      state.questions = JSON.parse(JSON.stringify(window.INITIAL_QUESTIONS || []));
    }

    // 2. Quizzes
    try {
      var savedQz = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      if (savedQz) {
        var parsedQz = JSON.parse(savedQz);
        if (Array.isArray(parsedQz) && parsedQz.length > 0) state.quizzes = parsedQz;
      }
    } catch (e) {}
    if (!state.quizzes || state.quizzes.length === 0) {
      state.quizzes = JSON.parse(JSON.stringify(window.INITIAL_QUIZZES || []));
    }

    // 3. Équipes
    try {
      var savedT = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (savedT) {
        var parsedT = JSON.parse(savedT);
        if (Array.isArray(parsedT) && parsedT.length >= 2) state.teams = parsedT;
      }
    } catch (e) {}
    if (!state.teams || state.teams.length < 2) {
      state.teams = [
        { id: "t1", name: "Les Lions Bleus MPHB", avatar: "🦁", score: 0, correct: 0, streak: 0, lastDelta: 0, color: TEAM_COLORS[0] },
        { id: "t2", name: "Les Étoiles Jaunes", avatar: "⭐", score: 0, correct: 0, streak: 0, lastDelta: 0, color: TEAM_COLORS[1] },
        { id: "t3", name: "Les Lutins du Hand", avatar: "🎄", score: 0, correct: 0, streak: 0, lastDelta: 0, color: TEAM_COLORS[2] }
      ];
    }

    // 4. Configuration
    try {
      var savedCfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedCfg) {
        state.config = Object.assign({}, state.config, JSON.parse(savedCfg));
      }
    } catch (e) {}

    if (
      state.config.sourceType === "preset" &&
      !state.quizzes.some(function (q) { return q.id === state.config.selectedQuizId; })
    ) {
      state.config.selectedQuizId = state.quizzes[0] ? state.quizzes[0].id : "__custom__";
    }

    // 5. Historique
    try {
      var savedH = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedH) {
        var parsedH = JSON.parse(savedH);
        if (Array.isArray(parsedH)) state.sessionHistory = parsedH;
      }
    } catch (e) {}

    // 6. Logo
    try {
      var savedLogo = localStorage.getItem(STORAGE_KEYS.LOGO);
      if (savedLogo) state.customLogoDataUrl = savedLogo;
    } catch (e) {}

    // 7. Code PIN
    try {
      var savedPin = localStorage.getItem(STORAGE_KEYS.LIVE_PIN);
      if (savedPin) {
        state.gamePin = savedPin;
      } else {
        generateNewPin();
      }
    } catch (e) {}

    // 8. Code secret Panel Admin
    try {
      var savedAdminCode = localStorage.getItem(STORAGE_KEYS.ADMIN_CODE);
      if (savedAdminCode && savedAdminCode.trim()) {
        state.adminCode = savedAdminCode.trim();
      }
    } catch (e) {}
  }

  function generateNewPin() {
    var p1 = Math.floor(100 + Math.random() * 900);
    var p2 = Math.floor(100 + Math.random() * 900);
    state.gamePin = p1 + " " + p2;
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_PIN, state.gamePin);
    } catch (e) {}
    return state.gamePin;
  }

  function saveQuestions() {
    try { localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(state.questions)); } catch (e) {}
  }
  function saveQuizzes() {
    try { localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(state.quizzes)); } catch (e) {}
  }
  function saveTeams() {
    try { localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(state.teams)); } catch (e) {}
  }
  function saveConfig() {
    try { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(state.config)); } catch (e) {}
  }
  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.sessionHistory)); } catch (e) {}
  }

  // ==========================================================================
  // 2. LOGO OFFICIEL MPHB (JAMAIS DÉFORMÉ)
  // ==========================================================================
  function setupAutoFileLogoDetection() {
    var autoImg = document.getElementById("auto-file-logo");
    if (!autoImg) return;
    autoImg.addEventListener("load", function () {
      if (autoImg.naturalWidth > 0) {
        state.autoFileLogoLoaded = true;
        renderLogos();
      }
    });
    autoImg.addEventListener("error", function () {
      state.autoFileLogoLoaded = false;
    });
  }

  function getLogoHTML() {
    if (state.customLogoDataUrl) {
      return '<img src="' + state.customLogoDataUrl + '" alt="Logo Officiel Marseille Provence Handball" class="mphb-official-logo-img" />';
    }
    if (window.MPHB_OFFICIAL_LOGO_URI) {
      return '<img src="' + window.MPHB_OFFICIAL_LOGO_URI + '" alt="Logo Officiel Marseille Provence Handball 1961" class="mphb-official-logo-img" />';
    }
    if (state.autoFileLogoLoaded) {
      return '<img src="assets/logo-mphb.jpg" alt="Logo Officiel Marseille Provence Handball" class="mphb-official-logo-img" />';
    }
    return window.MPHB_ILLUSTRATIONS.getDefaultLogoSVG();
  }

  function renderLogos() {
    var html = getLogoHTML();
    ["nav-logo-container", "hero-logo-container", "results-logo-container", "admin-logo-preview"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }

  // ==========================================================================
  // 3. NAVIGATION & BARRE SUPÉRIEURE
  // ==========================================================================
  function showScreen(screenId) {
    if (screenId !== "screen-quiz") {
      stopQuestionTimer();
      document.getElementById("kahoot-countdown-overlay").classList.add("hidden");
      document.getElementById("kahoot-scoreboard-overlay").classList.add("hidden");
    }
    if (screenId !== "screen-lobby" && screenId !== "screen-quiz") {
      window.MPHB_SOUND.stopMusic();
    }
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
    }
    var target = document.getElementById(screenId);
    if (target) target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindNavigationEvents() {
    document.getElementById("nav-home-trigger").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      refreshAllUI();
      showScreen("screen-home");
    });

    document.getElementById("btn-nav-home").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      refreshAllUI();
      showScreen("screen-home");
    });

    document.getElementById("btn-nav-lobby").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      openKahootLobby();
    });

    document.getElementById("btn-nav-player").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      document.getElementById("player-pin-input").value = state.gamePin;
      showScreen("screen-player");
    });

    document.getElementById("btn-nav-admin").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      requestAdminAccess();
    });

    var bgBtn = document.getElementById("btn-cycle-bg");
    if (bgBtn) {
      var savedBg = null;
      try { savedBg = localStorage.getItem("mphb_bg_theme_v1"); } catch (e) {}
      if (savedBg) applyBgTheme(savedBg);

      bgBtn.addEventListener("click", function () {
        window.MPHB_SOUND.playClick();
        var current = document.body.getAttribute("data-bg-theme") || "stadium";
        var next = current === "stadium" ? "gameshow" : (current === "gameshow" ? "christmas" : "stadium");
        applyBgTheme(next);
        try { localStorage.setItem("mphb_bg_theme_v1", next); } catch (e) {}
      });
    }

    document.getElementById("btn-toggle-music").addEventListener("click", function () {
      var on = window.MPHB_SOUND.toggleMusic();
      updateTopBarIcons();
      showToast(on ? "🎵 Musique d'ambiance activée" : "🎵 Musique d'ambiance coupée");
    });

    document.getElementById("btn-toggle-sound").addEventListener("click", function () {
      window.MPHB_SOUND.toggle();
      updateTopBarIcons();
      showToast(window.MPHB_SOUND.isEnabled() ? "🔊 Effets sonores activés" : "🔇 Effets sonores désactivés");
    });

    document.getElementById("btn-toggle-snow").addEventListener("click", function () {
      var on = window.MPHB_FX.toggleSnow();
      updateTopBarIcons();
      showToast(on ? "❄️ Flocons de Noël activés" : "❄️ Flocons de Noël masqués");
    });

    document.getElementById("btn-toggle-fullscreen").addEventListener("click", function () {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(function () {});
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
    });
  }

  function applyBgTheme(theme) {
    document.body.setAttribute("data-bg-theme", theme);
    var lbl = document.getElementById("label-bg-theme");
    if (!lbl) return;
    if (theme === "gameshow") {
      lbl.textContent = "Fond : Quiz Show";
    } else if (theme === "christmas") {
      lbl.textContent = "Fond : Noël MPHB";
    } else {
      lbl.textContent = "Fond : Terrain";
    }
  }

  function updateTopBarIcons() {
    var soundIcon = document.getElementById("icon-sound");
    if (soundIcon) soundIcon.textContent = window.MPHB_SOUND.isEnabled() ? "🔊" : "🔇";

    var musicIcon = document.getElementById("icon-music");
    if (musicIcon) musicIcon.textContent = window.MPHB_SOUND.isMusicEnabled() ? "🎵" : "🔕";

    var snowIcon = document.getElementById("icon-snow");
    if (snowIcon) snowIcon.textContent = window.MPHB_FX.isSnowEnabled() ? "❄️" : "🚫";

    var qBadge = document.getElementById("nav-questions-count");
    if (qBadge) qBadge.textContent = state.questions.length + " Q";
  }

  // ==========================================================================
  // 4. RAFRAÎCHISSEMENT GLOBAL DE L'INTERFACE
  // ==========================================================================
  function refreshAllUI() {
    updateTopBarIcons();
    renderHomeScreen();
    renderLobbyScreen();
    renderAdminConfigTab();
    renderAdminQuizzesTab();
    renderAdminQuestionsTab();
    renderAdminAnswersTab();
    renderAdminScoresTab();
  }

  function getCategoryById(catId) {
    for (var i = 0; i < state.categories.length; i++) {
      if (state.categories[i].id === catId) return state.categories[i];
    }
    return { id: catId, name: catId, shortName: catId, icon: "🤾", color: "#0055A4", description: "" };
  }

  function formatQuizOptionTitle(qz) {
    if (!qz) return "";
    var validCount = countValidQuestionsInQuiz(qz);
    var cleanTitle = String(qz.title || "").replace(/\s*\([^)]*questions?[^)]*\)\s*$/i, "").trim();
    return cleanTitle + " (" + validCount + " questions)";
  }

  // ==========================================================================
  // 5. ÉCRAN D'ACCUEIL KAHOOT × MPHB
  // ==========================================================================
  function renderHomeScreen() {
    var btnIndiv = document.getElementById("home-mode-indiv");
    var btnTeams = document.getElementById("home-mode-teams");
    if (state.config.gameMode === "teams") {
      btnIndiv.classList.remove("active");
      btnTeams.classList.add("active");
    } else {
      btnIndiv.classList.add("active");
      btnTeams.classList.remove("active");
    }

    var select = document.getElementById("home-quiz-select");
    var html = "";
    state.quizzes.forEach(function (qz) {
      var sel = (state.config.sourceType === "preset" && state.config.selectedQuizId === qz.id) ? " selected" : "";
      html += '<option value="' + escapeHtml(qz.id) + '"' + sel + '>' + escapeHtml(formatQuizOptionTitle(qz)) + '</option>';
    });
    var customSel = state.config.sourceType === "custom" ? " selected" : "";
    html += '<option value="__custom__"' + customSel + '>🎲 Tirage personnalisé (' + state.config.questionCount + ' questions)</option>';
    select.innerHTML = html;

    renderHomeSummaryBadges();

    var catGrid = document.getElementById("home-categories-grid");
    var catHtml = "";
    state.categories.forEach(function (cat) {
      var count = state.questions.filter(function (q) { return q.category === cat.id; }).length;
      catHtml +=
        '<div class="category-home-card" data-cat-id="' + escapeHtml(cat.id) + '" role="button" tabindex="0">' +
          '<div>' +
            '<div class="cat-card-header">' +
              '<span class="cat-card-icon">' + cat.icon + '</span>' +
              '<span class="cat-card-count">' + count + ' questions</span>' +
            '</div>' +
            '<h3 class="cat-card-title">' + escapeHtml(cat.name) + '</h3>' +
            '<p class="cat-card-desc">' + escapeHtml(cat.description) + '</p>' +
          '</div>' +
          '<span class="cat-card-play">▶ Lancer ce Quiz ➔</span>' +
        '</div>';
    });
    catGrid.innerHTML = catHtml;

    var cards = catGrid.querySelectorAll(".category-home-card");
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("click", function () {
        launchCategoryQuickQuiz(this.getAttribute("data-cat-id"));
      });
    }
  }

  function countValidQuestionsInQuiz(quiz) {
    if (!quiz || !Array.isArray(quiz.questionIds)) return 0;
    var map = {};
    state.questions.forEach(function (q) { map[q.id] = true; });
    return quiz.questionIds.filter(function (id) { return !!map[id]; }).length;
  }

  function renderHomeSummaryBadges() {
    var box = document.getElementById("home-active-config-summary");
    if (!box) return;

    var qCountText = "";
    var timerText = state.config.timerEnabled ? ("⏱️ Chrono : " + state.config.timerSeconds + "s") : "⏱️ Sans limite de temps";
    var modeText = state.config.gameMode === "teams"
      ? ("👥 Mode Équipes (" + state.teams.length + " équipes)")
      : "🧒 Mode Individuel";

    if (state.config.sourceType === "preset") {
      var qz = state.quizzes.find(function (item) { return item.id === state.config.selectedQuizId; });
      if (qz) qCountText = "❓ " + countValidQuestionsInQuiz(qz) + " questions";
    } else {
      qCountText = "❓ " + (state.config.questionCount >= 999 ? "Toutes les" : state.config.questionCount) + " questions";
    }

    box.innerHTML =
      '<span class="summary-chip">📌 PIN : <strong>' + escapeHtml(state.gamePin) + '</strong></span>' +
      '<span class="summary-chip">' + escapeHtml(modeText) + '</span>' +
      '<span class="summary-chip">' + escapeHtml(qCountText) + '</span>' +
      '<span class="summary-chip">' + escapeHtml(timerText) + '</span>' +
      '<span class="summary-chip">⚡ 1000 pts + Bonus Série 🔥</span>';
  }

  function bindHomeEvents() {
    document.getElementById("home-mode-indiv").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      state.config.gameMode = "individual";
      saveConfig();
      refreshAllUI();
    });

    document.getElementById("home-mode-teams").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      state.config.gameMode = "teams";
      saveConfig();
      refreshAllUI();
    });

    document.getElementById("home-quiz-select").addEventListener("change", function () {
      var val = this.value;
      if (val === "__custom__") {
        state.config.sourceType = "custom";
      } else {
        state.config.sourceType = "preset";
        state.config.selectedQuizId = val;
        var qz = state.quizzes.find(function (item) { return item.id === val; });
        if (qz) {
          state.config.timerEnabled = qz.timerEnabled !== undefined ? !!qz.timerEnabled : true;
          state.config.timerSeconds = qz.timerSeconds || 20;
          state.config.shuffleQuestions = qz.shuffleQuestions !== false;
        }
      }
      saveConfig();
      refreshAllUI();
    });

    document.getElementById("btn-start-quiz").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      if (state.config.gameMode === "teams") {
        openTeamsKickoffModal();
      } else {
        startConfiguredQuiz();
      }
    });

    document.getElementById("btn-open-lobby").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      openKahootLobby();
    });

    document.getElementById("btn-open-animator").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      requestAdminAccess();
    });

    document.getElementById("btn-home-join-pin").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      document.getElementById("player-pin-input").value = state.gamePin;
      showScreen("screen-player");
    });
  }

  function launchCategoryQuickQuiz(catId) {
    var cat = getCategoryById(catId);
    state.config.sourceType = "custom";
    state.config.selectedCategories = [catId];
    state.config.questionCount = 12;
    state.config.levelFilter = "all";
    saveConfig();
    refreshAllUI();

    if (state.config.gameMode === "teams") {
      openTeamsKickoffModal();
    } else {
      startConfiguredQuiz("Quiz : " + cat.name);
    }
  }

  // ==========================================================================
  // 6. LOBBY KAHOOT AVEC CODE PIN & MUSIQUE
  // ==========================================================================
  function openKahootLobby() {
    state.config.gameMode = "teams";
    saveConfig();
    renderLobbyScreen();
    showScreen("screen-lobby");
    window.MPHB_SOUND.startLobbyMusic();
  }

  function renderLobbyScreen() {
    var built = buildQuestionsForSession();
    var cleanBuiltTitle = String(built.title || "").replace(/\s*\([^)]*questions?[^)]*\)\s*$/i, "").trim();
    document.getElementById("lobby-active-quiz-title").textContent =
      cleanBuiltTitle + " (" + built.list.length + " questions)";
    document.getElementById("lobby-pin-code").textContent = state.gamePin;

    var countLabel = state.teams.length + " Équipe" + (state.teams.length > 1 ? "s" : "") + " / Joueur" + (state.teams.length > 1 ? "s" : "") + " prêt" + (state.teams.length > 1 ? "s" : "");
    document.getElementById("lobby-players-count").textContent = countLabel;

    var grid = document.getElementById("lobby-players-grid");
    var html = "";
    state.teams.forEach(function (t, idx) {
      var av = t.avatar || "🤾";
      html +=
        '<div class="lobby-player-badge" data-remove-lobby-idx="' + idx + '" title="Cliquer pour retirer">' +
          '<span>' + av + '</span>' +
          '<span>' + escapeHtml(t.name) + '</span>' +
        '</div>';
    });
    grid.innerHTML = html;

    var badges = grid.querySelectorAll(".lobby-player-badge");
    for (var i = 0; i < badges.length; i++) {
      badges[i].addEventListener("click", function () {
        if (state.teams.length <= 2) {
          showToast("Gardez au moins 2 équipes pour jouer en mode Équipes !");
          return;
        }
        var idx = parseInt(this.getAttribute("data-remove-lobby-idx"), 10);
        var removed = state.teams.splice(idx, 1)[0];
        saveTeams();
        renderLobbyScreen();
        showToast("👋 " + (removed ? removed.name : "Équipe") + " retirée du Lobby.");
      });
    }
  }

  function bindLobbyEvents() {
    document.getElementById("form-lobby-add-player").addEventListener("submit", function (e) {
      e.preventDefault();
      var nameInput = document.getElementById("lobby-add-name");
      var avatarInput = document.getElementById("lobby-add-avatar");
      var name = nameInput.value.trim();
      if (!name) return;

      addTeamWithDetails(name, avatarInput.value || "🤾");
      nameInput.value = "";
      window.MPHB_SOUND.playPlayerJoin();
      renderLobbyScreen();
    });

    document.getElementById("btn-lobby-regenerate-pin").addEventListener("click", function () {
      generateNewPin();
      renderLobbyScreen();
      showToast("🔄 Nouveau Code PIN généré : " + state.gamePin);
    });

    document.getElementById("btn-lobby-open-controller").addEventListener("click", function () {
      var url = window.location.href.split("?")[0] + "?player=1&pin=" + encodeURIComponent(state.gamePin);
      window.open(url, "_blank");
    });

    document.getElementById("btn-lobby-start-game").addEventListener("click", function () {
      window.MPHB_SOUND.stopMusic();
      startConfiguredQuiz();
    });
  }

  function addTeamWithDetails(name, avatar) {
    if (state.teams.length >= 12) {
      showToast("Maximum 12 équipes / joueurs dans le Lobby !");
      return null;
    }
    var idx = state.teams.length + 1;
    var newTeam = {
      id: "team_" + Date.now() + "_" + idx,
      name: name,
      avatar: avatar || "🤾",
      score: 0,
      correct: 0,
      streak: 0,
      lastDelta: 0,
      color: TEAM_COLORS[(idx - 1) % TEAM_COLORS.length]
    };
    state.teams.push(newTeam);
    saveTeams();
    refreshAllUI();
    return newTeam;
  }

  // ==========================================================================
  // 7. MANETTE JOUEUR KAHOOT & SYNCHRONISATION MULTI-ONGLETS
  // ==========================================================================
  function bindPlayerControllerEvents() {
    document.getElementById("form-player-join").addEventListener("submit", function (e) {
      e.preventDefault();
      var enteredPin = document.getElementById("player-pin-input").value.replace(/\s+/g, "");
      var hostPin = state.gamePin.replace(/\s+/g, "");
      var nickname = document.getElementById("player-nickname-input").value.trim();
      var avatar = document.getElementById("player-avatar-input").value || "🦁";

      if (!nickname) {
        showToast("⚠️ Entre ton pseudo ou nom d'équipe !");
        return;
      }
      if (enteredPin && enteredPin !== hostPin) {
        showToast("⚠️ Code PIN différent du PIN actif (" + state.gamePin + "), connexion automatique au PIN actif !");
      }

      // Vérifier si l'équipe existe déjà ou l'ajouter
      var existing = state.teams.find(function (t) {
        return t.name.toLowerCase() === nickname.toLowerCase();
      });
      var teamObj = existing || addTeamWithDetails(nickname, avatar);
      if (!teamObj) teamObj = state.teams[0];

      state.playerPad.joined = true;
      state.playerPad.pin = state.gamePin;
      state.playerPad.name = teamObj.name;
      state.playerPad.avatar = avatar;
      state.playerPad.teamId = teamObj.id;
      state.playerPad.score = teamObj.score || 0;
      state.playerPad.lockedChoice = null;

      document.getElementById("player-step-join").classList.add("hidden");
      document.getElementById("player-step-pad").classList.remove("hidden");
      document.getElementById("player-pad-name").textContent = avatar + " " + teamObj.name;
      document.getElementById("player-pad-pin").textContent = "PIN : " + state.gamePin;
      document.getElementById("player-pad-score").textContent = state.playerPad.score + " pts";

      window.MPHB_SOUND.playPlayerJoin();
      broadcastLiveEvent({
        type: "PLAYER_JOINED",
        team: teamObj
      });
      showToast("🎉 Connecté au Quiz MPHB !");
    });

    var padBtns = document.querySelectorAll("#player-pad-buttons .player-pad-btn");
    for (var i = 0; i < padBtns.length; i++) {
      padBtns[i].addEventListener("click", function () {
        var choiceIdx = parseInt(this.getAttribute("data-pad-idx"), 10);
        handlePlayerPadTap(choiceIdx);
      });
    }
  }

  function handlePlayerPadTap(choiceIdx) {
    if (!state.playerPad.joined) return;
    window.MPHB_SOUND.playClick();
    var shape = KAHOOT_SHAPES[choiceIdx];
    state.playerPad.lockedChoice = choiceIdx;

    document.getElementById("player-pad-status").innerHTML =
      "✅ Réponse envoyée : <strong>" + shape.symbol + " " + shape.name + "</strong> ! Regarde l'écran principal...";

    // Si on est sur le même onglet ou en multi-onglets, transmettre le vote
    broadcastLiveEvent({
      type: "PLAYER_VOTE",
      teamId: state.playerPad.teamId,
      teamName: state.playerPad.name,
      choiceIndex: choiceIdx
    });
  }

  function broadcastLiveEvent(payload) {
    if (liveChannel) {
      try { liveChannel.postMessage(payload); } catch (e) {}
    }
    try {
      localStorage.setItem("mphb_live_event_bus", JSON.stringify(Object.assign({ ts: Date.now() }, payload)));
    } catch (e) {}
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      try {
        fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(function () {});
      } catch (e) {}
    }
  }

  function setupLiveSyncListeners() {
    function onMessage(data) {
      if (!data || !data.type) return;

      if (data.type === "PLAYER_JOINED" && data.team) {
        var exists = state.teams.some(function (t) { return t.id === data.team.id || t.name === data.team.name; });
        if (!exists) {
          state.teams.push(data.team);
          saveTeams();
        }
        window.MPHB_SOUND.playPlayerJoin();
        refreshAllUI();
        showToast("📱 " + data.team.name + " a rejoint le Lobby !");
      }

      if (data.type === "PLAYER_VOTE" && state.game.active && !state.game.answered) {
        var tIdx = state.teams.findIndex(function (t) {
          return t.id === data.teamId || t.name === data.teamName;
        });
        if (tIdx !== -1) {
          if (state.config.gameMode === "teams" && state.config.teamVoteMode === "all") {
            registerTeamVoteInAllMode(tIdx, data.choiceIndex);
          } else {
            // Si c'est le tour de cette équipe ou en mode direct, valider la réponse
            handleAnswerSelection(data.choiceIndex);
          }
        }
      }

      if (data.type === "HOST_NEW_QUESTION" && state.playerPad.joined) {
        state.playerPad.lockedChoice = null;
        document.getElementById("player-pad-status").textContent =
          "👀 Question " + data.qNum + " : Appuie sur la bonne forme (▲ ◆ ● ■) !";
      }

      if (data.type === "HOST_REVEAL" && state.playerPad.joined) {
        var myTeam = (data.teams || []).find(function (t) {
          return t.id === state.playerPad.teamId || t.name === state.playerPad.name;
        });
        if (myTeam) {
          document.getElementById("player-pad-score").textContent = myTeam.score + " pts";
        }
        var goodShape = KAHOOT_SHAPES[data.correctIndex];
        if (state.playerPad.lockedChoice === data.correctIndex) {
          document.getElementById("player-pad-status").innerHTML =
            "🎉 <strong>BRAVO ! Bonne réponse (" + goodShape.symbol + ") !</strong>";
        } else {
          document.getElementById("player-pad-status").innerHTML =
            "💡 La bonne réponse était <strong>" + goodShape.symbol + " " + goodShape.name + "</strong> !";
        }
      }
    }

    if (liveChannel) {
      liveChannel.onmessage = function (evt) {
        onMessage(evt.data);
      };
    }

    window.addEventListener("storage", function (evt) {
      if (evt.key === "mphb_live_event_bus" && evt.newValue) {
        try {
          onMessage(JSON.parse(evt.newValue));
        } catch (e) {}
      }
    });

    if ((window.location.protocol === "http:" || window.location.protocol === "https:") && typeof EventSource !== "undefined") {
      try {
        var es = new EventSource("/api/events");
        es.onmessage = function (evt) {
          try {
            onMessage(JSON.parse(evt.data));
          } catch (e) {}
        };
      } catch (e) {}
    }
  }

  // ==========================================================================
  // 8. MODALE DE PRÉPARATION DES ÉQUIPES
  // ==========================================================================
  function openTeamsKickoffModal() {
    renderTeamsListInside("modal-teams-list");
    document.getElementById("modal-teams-kickoff").classList.remove("hidden");
  }

  function closeTeamsKickoffModal() {
    document.getElementById("modal-teams-kickoff").classList.add("hidden");
  }

  function bindModalTeamsEvents() {
    document.getElementById("btn-close-teams-modal").addEventListener("click", closeTeamsKickoffModal);
    document.getElementById("btn-cancel-teams-modal").addEventListener("click", closeTeamsKickoffModal);

    document.getElementById("btn-modal-add-team").addEventListener("click", function () {
      addNewTeam();
      renderTeamsListInside("modal-teams-list");
      renderTeamsListInside("admin-teams-list");
    });

    document.getElementById("btn-modal-go-lobby").addEventListener("click", function () {
      closeTeamsKickoffModal();
      openKahootLobby();
    });

    document.getElementById("btn-confirm-teams-kickoff").addEventListener("click", function () {
      closeTeamsKickoffModal();
      startConfiguredQuiz();
    });
  }

  function addNewTeam() {
    var avatars = ["🦁", "⭐", "🎄", "🤾", "🔥", "🧤", "🏆", "🐬"];
    var idx = state.teams.length + 1;
    addTeamWithDetails("Équipe " + idx, avatars[(idx - 1) % avatars.length]);
  }

  function renderTeamsListInside(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var html = "";
    state.teams.forEach(function (team, index) {
      html +=
        '<div class="team-edit-row">' +
          '<span class="team-color-badge" style="background:' + team.color + '; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.9rem;">' + (team.avatar || "🤾") + '</span>' +
          '<input type="text" class="team-edit-input" data-team-idx="' + index + '" value="' + escapeHtml(team.name) + '" placeholder="Nom de l\'équipe" />' +
          '<span class="team-pts-badge">' + (team.score || 0) + ' pts</span>' +
          (state.teams.length > 2
            ? '<button type="button" class="btn-remove-team" data-remove-idx="' + index + '" title="Supprimer cette équipe">✖</button>'
            : '') +
        '</div>';
    });
    container.innerHTML = html;

    var inputs = container.querySelectorAll(".team-edit-input");
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("input", function () {
        var idx = parseInt(this.getAttribute("data-team-idx"), 10);
        if (state.teams[idx]) {
          state.teams[idx].name = this.value.trim() || ("Équipe " + (idx + 1));
          saveTeams();
          renderHomeSummaryBadges();
        }
      });
    }

    var delBtns = container.querySelectorAll(".btn-remove-team");
    for (var j = 0; j < delBtns.length; j++) {
      delBtns[j].addEventListener("click", function () {
        if (state.teams.length <= 2) {
          showToast("Il faut au moins 2 équipes pour le Mode Équipes !");
          return;
        }
        var idx = parseInt(this.getAttribute("data-remove-idx"), 10);
        state.teams.splice(idx, 1);
        saveTeams();
        renderTeamsListInside("modal-teams-list");
        renderTeamsListInside("admin-teams-list");
        refreshAllUI();
      });
    }
  }

  // ==========================================================================
  // 9. MOTEUR DU QUIZ STYLE KAHOOT! (▲ ◆ ● ■ + BARRES + SCOREBOARD)
  // ==========================================================================
  function buildQuestionsForSession() {
    var pool = [];
    var sessionTitle = "Le Grand Quiz du Handball";

    if (state.config.sourceType === "preset") {
      var quiz = state.quizzes.find(function (qz) { return qz.id === state.config.selectedQuizId; });
      if (quiz) {
        sessionTitle = quiz.title;
        var qMap = {};
        state.questions.forEach(function (q) { qMap[q.id] = q; });
        quiz.questionIds.forEach(function (id) {
          if (qMap[id]) pool.push(JSON.parse(JSON.stringify(qMap[id])));
        });
      }
    }

    if (state.config.sourceType === "custom" || pool.length === 0) {
      sessionTitle = "Quiz Personnalisé MPHB";
      var allowedCats = state.config.selectedCategories || [];
      pool = state.questions.filter(function (q) {
        var catMatch = allowedCats.length === 0 || allowedCats.indexOf(q.category) !== -1;
        var lvlMatch = state.config.levelFilter === "all" || q.level === state.config.levelFilter;
        return catMatch && lvlMatch;
      }).map(function (q) {
        return JSON.parse(JSON.stringify(q));
      });
    }

    if (pool.length === 0) return { title: sessionTitle, list: [] };

    if (state.config.shuffleQuestions) {
      shuffleArray(pool);
    }

    if (state.config.sourceType === "custom" && state.config.questionCount < pool.length) {
      pool = pool.slice(0, state.config.questionCount);
    }

    return { title: sessionTitle, list: pool };
  }

  function startConfiguredQuiz(customTitleOverride) {
    var built = buildQuestionsForSession();
    if (built.list.length === 0) {
      showToast("⚠️ Aucune question ne correspond aux filtres choisis !");
      return;
    }

    state.game.active = true;
    state.game.title = customTitleOverride || built.title;
    state.game.questionsList = built.list;
    state.game.currentIndex = 0;
    state.game.answered = false;
    state.game.score = 0;
    state.game.streak = 0;
    state.game.correctCount = 0;
    state.game.wrongCount = 0;
    state.game.activeTeamIndex = 0;
    state.game.showingScoreboard = false;
    state.game.historyLog = [];

    // Remettre les deltas de manche à 0
    state.teams.forEach(function (t) {
      t.lastDelta = 0;
      t.streak = t.streak || 0;
    });

    window.MPHB_SOUND.playWhistle();
    showScreen("screen-quiz");
    runKahootCountdownThenRender(true);
  }

  // Compte à rebours Kahoot 3... 2... 1... avant la question
  function runKahootCountdownThenRender(isFirstQuestion) {
    var g = state.game;
    var q = g.questionsList[g.currentIndex];
    if (!q) {
      finishQuizSession();
      return;
    }

    var total = g.questionsList.length;
    var num = g.currentIndex + 1;
    var cat = getCategoryById(q.category);
    var isDoublePoints = (total >= 5 && num >= total - 1);

    var overlay = document.getElementById("kahoot-countdown-overlay");
    document.getElementById("k-cd-category").textContent = cat.icon + " " + cat.name;
    document.getElementById("k-cd-qnum").textContent = "Question " + num + " sur " + total;
    document.getElementById("k-cd-points-tag").textContent = isDoublePoints
      ? "🔥 POINTS DOUBLES ×2 (JUSQU'À 2000 POINTS !)"
      : "⚡ JUSQU'À 1000 POINTS (BONUS DE VITESSE & SÉRIE)";

    var numBox = document.getElementById("k-cd-number");
    overlay.classList.remove("hidden");

    if (isFirstQuestion) {
      var steps = ["3", "2", "1", "GO!"];
      var sIdx = 0;
      numBox.textContent = steps[0];
      window.MPHB_SOUND.playCountdownBeep(false);

      var cdTimer = setInterval(function () {
        sIdx++;
        if (sIdx < steps.length) {
          numBox.textContent = steps[sIdx];
          window.MPHB_SOUND.playCountdownBeep(sIdx === steps.length - 1);
        } else {
          clearInterval(cdTimer);
          overlay.classList.add("hidden");
          renderCurrentQuestion();
        }
      }, 480);
    } else {
      // Transition rapide et fluide sur les questions suivantes
      numBox.textContent = "Q" + num;
      window.MPHB_SOUND.playCountdownBeep(true);
      setTimeout(function () {
        overlay.classList.add("hidden");
        renderCurrentQuestion();
      }, 650);
    }
  }

  function isCurrentQuestionDoublePoints() {
    var total = state.game.questionsList.length;
    var num = state.game.currentIndex + 1;
    return total >= 5 && num >= total - 1;
  }

  function renderCurrentQuestion() {
    stopQuestionTimer();
    document.getElementById("kahoot-scoreboard-overlay").classList.add("hidden");

    var g = state.game;
    g.showingScoreboard = false;
    var q = g.questionsList[g.currentIndex];
    if (!q) {
      finishQuizSession();
      return;
    }

    g.answered = false;
    g.teamVotes = {};
    g.voteCounts = [0, 0, 0, 0];
    g.selectedVoterTeamIdx = 0;
    g.questionStartTime = Date.now();

    var total = g.questionsList.length;
    var num = g.currentIndex + 1;
    var cat = getCategoryById(q.category);
    var isDouble = isCurrentQuestionDoublePoints();

    // Notifier les éventuelles manettes joueurs connectées
    broadcastLiveEvent({
      type: "HOST_NEW_QUESTION",
      qNum: num,
      total: total
    });

    // 1. Barre supérieure Kahoot
    document.getElementById("quiz-question-counter").textContent = num + " / " + total;
    var catBadge = document.getElementById("quiz-category-badge");
    catBadge.textContent = cat.icon + " " + cat.name;
    catBadge.style.backgroundColor = cat.color || "#0055A4";

    document.getElementById("quiz-level-badge").textContent =
      q.level === "moyen" ? "🔥 Confirmé" : "⭐ Découverte";

    var doubleBadge = document.getElementById("quiz-double-pts-badge");
    if (isDouble) {
      doubleBadge.classList.remove("hidden");
    } else {
      doubleBadge.classList.add("hidden");
    }

    var progressPct = Math.round(((num - 1) / total) * 100);
    document.getElementById("quiz-progress-fill").style.width = progressPct + "%";
    document.getElementById("quiz-quiz-title-small").textContent = "PIN : " + state.gamePin;
    document.getElementById("quiz-score-value").textContent = formatPoints(g.score) + " pts";

    var streakPill = document.getElementById("quiz-streak-pill");
    if (g.streak >= 2) {
      streakPill.classList.remove("hidden");
      streakPill.textContent = "🔥 Série " + g.streak;
    } else {
      streakPill.classList.add("hidden");
    }

    // 2. Gestion Mode Équipes (Tour par Tour OU Vote de toutes les équipes)
    var teamBanner = document.getElementById("team-turn-banner");
    var multiVoteBar = document.getElementById("multi-team-vote-bar");
    var leaderboardCard = document.getElementById("live-leaderboard-card");

    if (state.config.gameMode === "teams" && state.teams.length >= 2) {
      teamBanner.classList.remove("hidden");
      leaderboardCard.classList.remove("hidden");
      renderLiveTeamLeaderboard();

      var switchBtn = document.getElementById("btn-toggle-team-vote-mode");
      if (state.config.teamVoteMode === "all") {
        switchBtn.textContent = "🔄 Mode : Toutes les équipes votent";
        document.getElementById("team-mode-badge-label").textContent = "🗳️ VOTE DE TOUTES LES ÉQUIPES";
        document.getElementById("active-team-name").textContent = "Chaque équipe choisit sa forme (▲ ◆ ● ■)";
        document.getElementById("active-team-score-pill").textContent = state.teams.length + " équipes";
        multiVoteBar.classList.remove("hidden");
        renderMultiTeamVoteChips();
      } else {
        switchBtn.textContent = "🔄 Mode : Tour par tour";
        g.activeTeamIndex = g.currentIndex % state.teams.length;
        var currentTeam = state.teams[g.activeTeamIndex];
        document.getElementById("team-mode-badge-label").textContent = "📢 AU TOUR DE L'ÉQUIPE";
        document.getElementById("active-team-name").textContent = (currentTeam.avatar || "🤾") + " " + currentTeam.name;
        document.getElementById("active-team-score-pill").textContent = formatPoints(currentTeam.score) + " pts";
        multiVoteBar.classList.add("hidden");
      }
    } else {
      teamBanner.classList.add("hidden");
      multiVoteBar.classList.add("hidden");
      leaderboardCard.classList.add("hidden");
    }

    // 3. Bannière Question + Illustration centrale
    document.getElementById("question-text").textContent = q.question;
    document.getElementById("question-illustration-wrapper").classList.remove("hidden");
    document.getElementById("question-illustration-box").innerHTML =
      window.MPHB_ILLUSTRATIONS.getQuestionIllustration(q.illustration || "players");

    document.getElementById("feedback-panel").classList.add("hidden");
    document.getElementById("kahoot-answers-count").textContent = "0";
    document.getElementById("btn-next-question").classList.add("hidden");
    document.getElementById("btn-skip-reveal").classList.remove("hidden");

    // 4. Les 4 Briques Géantes Kahoot! (▲ Rouge, ◆ Bleu, ● Jaune, ■ Vert)
    var optionsGrid = document.getElementById("options-grid");
    var optsHtml = "";
    for (var i = 0; i < 4; i++) {
      var optText = q.options[i] !== undefined ? q.options[i] : "";
      var shape = KAHOOT_SHAPES[i];
      optsHtml +=
        '<button type="button" class="kahoot-tile-btn kahoot-tile-' + i + '" data-opt-index="' + i + '">' +
          '<span class="kahoot-shape-box">' + shape.symbol + '</span>' +
          '<span class="option-text">' + escapeHtml(optText) + '</span>' +
          '<span class="option-status-icon" id="opt-icon-' + i + '"></span>' +
        '</button>';
    }
    optionsGrid.innerHTML = optsHtml;

    var optBtns = optionsGrid.querySelectorAll(".kahoot-tile-btn");
    for (var b = 0; b < optBtns.length; b++) {
      optBtns[b].addEventListener("click", function () {
        var chosenIdx = parseInt(this.getAttribute("data-opt-index"), 10);
        if (state.config.gameMode === "teams" && state.config.teamVoteMode === "all") {
          registerTeamVoteInAllMode(state.game.selectedVoterTeamIdx, chosenIdx);
        } else {
          handleAnswerSelection(chosenIdx);
        }
      });
    }

    // 5. Chronomètre circulaire Kahoot + Musique de réflexion Kahoot
    var timerBox = document.getElementById("quiz-timer-box");
    var pauseBtn = document.getElementById("btn-pause-timer");
    if (state.config.timerEnabled) {
      timerBox.classList.remove("timer-urgent");
      pauseBtn.classList.remove("hidden");
      startQuestionTimer(state.config.timerSeconds || 20);
    } else {
      timerBox.classList.remove("timer-urgent");
      document.getElementById("quiz-timer-value").textContent = "∞";
      document.getElementById("quiz-timer-unit").textContent = "libre";
      document.getElementById("k-timer-ring-circle").style.strokeDashoffset = "0";
      pauseBtn.classList.add("hidden");
    }

    window.MPHB_SOUND.startQuestionMusic();
  }

  // Mode où toutes les équipes votent avant la révélation Kahoot
  function renderMultiTeamVoteChips() {
    var box = document.getElementById("multi-team-chips");
    if (!box) return;
    var g = state.game;
    var html = "";

    state.teams.forEach(function (team, idx) {
      var vote = g.teamVotes[idx];
      var isSelected = g.selectedVoterTeamIdx === idx;
      var voteBadge = "";
      if (vote !== undefined) {
        var sh = KAHOOT_SHAPES[vote.choice];
        voteBadge = '<span class="voter-choice-dot ' + sh.colorClass + '">' + sh.symbol + '</span>';
      } else {
        voteBadge = '<span style="color:#64748b; font-size:0.78rem;">(en attente)</span>';
      }

      html +=
        '<button type="button" class="multi-team-chip' + (isSelected ? " selected-voter" : "") + '" data-voter-idx="' + idx + '">' +
          '<span>' + (team.avatar || "🤾") + ' ' + escapeHtml(team.name) + '</span>' +
          voteBadge +
        '</button>';
    });
    box.innerHTML = html;

    var chips = box.querySelectorAll(".multi-team-chip");
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener("click", function () {
        state.game.selectedVoterTeamIdx = parseInt(this.getAttribute("data-voter-idx"), 10);
        renderMultiTeamVoteChips();
      });
    }
  }

  function registerTeamVoteInAllMode(teamIdx, choiceIdx) {
    var g = state.game;
    if (g.answered || !state.teams[teamIdx]) return;

    window.MPHB_SOUND.playClick();
    g.teamVotes[teamIdx] = {
      choice: choiceIdx,
      elapsedMs: Math.max(200, Date.now() - g.questionStartTime)
    };

    var totalVotes = Object.keys(g.teamVotes).length;
    document.getElementById("kahoot-answers-count").textContent = totalVotes + " / " + state.teams.length;

    // Passer automatiquement le curseur à la prochaine équipe qui n'a pas encore voté
    for (var i = 0; i < state.teams.length; i++) {
      var candidate = (teamIdx + 1 + i) % state.teams.length;
      if (g.teamVotes[candidate] === undefined) {
        g.selectedVoterTeamIdx = candidate;
        break;
      }
    }

    renderMultiTeamVoteChips();

    // Si toutes les équipes ont voté, révéler automatiquement après un court suspense !
    if (totalVotes >= state.teams.length) {
      setTimeout(function () {
        if (!g.answered) revealMultiTeamVotes();
      }, 380);
    }
  }

  // Calcul officiel des points façon Kahoot! (Vitesse + Série)
  function computeKahootPoints(elapsedMs, currentStreak) {
    var baseMax = isCurrentQuestionDoublePoints() ? 2000 : 1000;
    var speedPts = baseMax;

    if (state.config.timerEnabled) {
      var totalMs = (state.config.timerSeconds || 20) * 1000;
      var ratio = Math.min(1, Math.max(0, elapsedMs / totalMs));
      // Entre 55% et 100% du score maximum selon la rapidité
      speedPts = Math.round(baseMax * (1 - ratio * 0.45));
    }

    var streakBonus = Math.min(500, Math.max(0, currentStreak) * 100);
    return speedPts + streakBonus;
  }

  function startQuestionTimer(seconds) {
    stopQuestionTimer();
    var g = state.game;
    g.timerTotal = seconds;
    g.timerRemaining = seconds;
    g.timerPaused = false;
    document.getElementById("quiz-timer-unit").textContent = "sec";
    updateTimerDisplay();

    g.timerInterval = setInterval(function () {
      if (g.timerPaused || g.answered) return;
      g.timerRemaining--;
      updateTimerDisplay();

      if (g.timerRemaining <= 5 && g.timerRemaining > 0) {
        document.getElementById("quiz-timer-box").classList.add("timer-urgent");
        window.MPHB_SOUND.playTick(true);
      } else if (g.timerRemaining > 5) {
        window.MPHB_SOUND.playTick(false);
      }

      if (g.timerRemaining <= 0) {
        stopQuestionTimer();
        if (state.config.gameMode === "teams" && state.config.teamVoteMode === "all") {
          revealMultiTeamVotes();
        } else {
          handleAnswerSelection(-1);
        }
      }
    }, 1000);
  }

  function stopQuestionTimer() {
    if (state.game.timerInterval) {
      clearInterval(state.game.timerInterval);
      state.game.timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    var g = state.game;
    var valEl = document.getElementById("quiz-timer-value");
    if (valEl) valEl.textContent = String(Math.max(0, g.timerRemaining));

    var ring = document.getElementById("k-timer-ring-circle");
    if (ring && g.timerTotal > 0) {
      var circumference = 276.46;
      var frac = Math.max(0, g.timerRemaining / g.timerTotal);
      ring.style.strokeDashoffset = String(circumference * (1 - frac));
    }

    var pauseBtn = document.getElementById("btn-pause-timer");
    if (pauseBtn) {
      pauseBtn.textContent = g.timerPaused ? "▶️ Reprendre" : "⏸️ Pause";
    }
  }

  // Révélation en mode "Toutes les équipes votent"
  function revealMultiTeamVotes() {
    var g = state.game;
    if (g.answered) return;
    g.answered = true;
    stopQuestionTimer();
    window.MPHB_SOUND.playGongReveal();

    var q = g.questionsList[g.currentIndex];
    var correctIdx = q.correctIndex;
    g.voteCounts = [0, 0, 0, 0];

    var anyTeamCorrect = false;
    var winnersNames = [];

    state.teams.forEach(function (team, idx) {
      var vote = g.teamVotes[idx];
      if (vote && vote.choice >= 0 && vote.choice <= 3) {
        g.voteCounts[vote.choice]++;
        if (vote.choice === correctIdx) {
          anyTeamCorrect = true;
          team.streak = (team.streak || 0) + 1;
          var pts = computeKahootPoints(vote.elapsedMs, team.streak - 1);
          team.score += pts;
          team.lastDelta = pts;
          team.correct = (team.correct || 0) + 1;
          winnersNames.push(team.name + " (+" + pts + ")");
        } else {
          team.streak = 0;
          team.lastDelta = 0;
        }
      } else {
        team.streak = 0;
        team.lastDelta = 0;
      }
    });
    saveTeams();

    if (anyTeamCorrect) {
      g.correctCount++;
      g.score += 1000;
      setTimeout(function () {
        window.MPHB_SOUND.playCorrect();
        window.MPHB_FX.burstMini();
      }, 250);
    } else {
      g.wrongCount++;
      setTimeout(function () {
        window.MPHB_SOUND.playWrong();
      }, 250);
    }

    highlightKahootTiles(correctIdx, anyTeamCorrect ? correctIdx : -1);
    renderKahootBarChart(g.voteCounts, correctIdx);

    g.historyLog.push({
      question: q.question,
      options: q.options,
      chosenIndex: anyTeamCorrect ? correctIdx : -1,
      correctIndex: correctIdx,
      isCorrect: anyTeamCorrect,
      explanation: q.explanation,
      teamName: winnersNames.length > 0 ? ("Gagnants : " + winnersNames.join(", ")) : "Aucune équipe"
    });

    showKahootFeedbackPanel(
      anyTeamCorrect,
      correctIdx,
      q,
      winnersNames.length > 0 ? ("🎉 Bravo à : " + winnersNames.join(" • ")) : "💪 Aucune équipe n'a trouvé cette fois, regardons l'explication !",
      winnersNames.length > 0 ? ("+" + winnersNames.length + " équipe(s)") : "+0 pt"
    );

    renderLiveTeamLeaderboard();
    broadcastLiveEvent({
      type: "HOST_REVEAL",
      correctIndex: correctIdx,
      teams: state.teams
    });
  }

  // Validation immédiate (Mode Individuel ou Mode Équipes Tour par Tour)
  function handleAnswerSelection(chosenIndex) {
    var g = state.game;
    if (g.answered) return;
    g.answered = true;
    stopQuestionTimer();

    var elapsedMs = Math.max(200, Date.now() - g.questionStartTime);
    var q = g.questionsList[g.currentIndex];
    var correctIdx = q.correctIndex;
    var isCorrect = chosenIndex === correctIdx;

    g.voteCounts = [0, 0, 0, 0];
    if (chosenIndex >= 0 && chosenIndex <= 3) {
      g.voteCounts[chosenIndex] = 1;
    }
    document.getElementById("kahoot-answers-count").textContent = chosenIndex >= 0 ? "1" : "0";

    highlightKahootTiles(correctIdx, chosenIndex);
    renderKahootBarChart(g.voteCounts, correctIdx);

    var activeTeam = null;
    if (state.config.gameMode === "teams" && state.teams[g.activeTeamIndex]) {
      activeTeam = state.teams[g.activeTeamIndex];
    }

    // Remettre lastDelta à 0 pour les autres équipes
    state.teams.forEach(function (t) { t.lastDelta = 0; });

    var earnedPoints = 0;
    if (isCorrect) {
      g.streak += 1;
      earnedPoints = computeKahootPoints(elapsedMs, g.streak - 1);
      g.score += earnedPoints;
      g.correctCount += 1;

      if (activeTeam) {
        activeTeam.streak = (activeTeam.streak || 0) + 1;
        earnedPoints = computeKahootPoints(elapsedMs, activeTeam.streak - 1);
        activeTeam.score += earnedPoints;
        activeTeam.lastDelta = earnedPoints;
        activeTeam.correct = (activeTeam.correct || 0) + 1;
        saveTeams();
      }
      window.MPHB_SOUND.playCorrect();
      window.MPHB_FX.burstMini();
    } else {
      g.streak = 0;
      g.wrongCount += 1;
      if (activeTeam) {
        activeTeam.streak = 0;
        activeTeam.lastDelta = 0;
        saveTeams();
      }
      window.MPHB_SOUND.playWrong();
    }

    g.historyLog.push({
      question: q.question,
      options: q.options,
      chosenIndex: chosenIndex,
      correctIndex: correctIdx,
      isCorrect: isCorrect,
      explanation: q.explanation,
      teamName: activeTeam ? activeTeam.name : null,
      pointsEarned: earnedPoints
    });

    // Mise à jour Topbar
    var total = g.questionsList.length;
    var progressPct = Math.round(((g.currentIndex + 1) / total) * 100);
    document.getElementById("quiz-progress-fill").style.width = progressPct + "%";
    document.getElementById("quiz-score-value").textContent = formatPoints(g.score) + " pts";

    var streakPill = document.getElementById("quiz-streak-pill");
    if (g.streak >= 2) {
      streakPill.classList.remove("hidden");
      streakPill.textContent = "🔥 Série " + g.streak;
    } else {
      streakPill.classList.add("hidden");
    }

    if (activeTeam) {
      document.getElementById("active-team-score-pill").textContent = formatPoints(activeTeam.score) + " pts";
      renderLiveTeamLeaderboard();
    }

    var msgObj = isCorrect
      ? PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)]
      : ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)];

    var customTitle = isCorrect
      ? ((activeTeam ? activeTeam.name + " : " : "") + msgObj.title)
      : (chosenIndex === -1 ? "⏱️ Temps écoulé ! Regardons ensemble la bonne réponse :" : msgObj.title);

    var ptsLabel = isCorrect
      ? ("+" + formatPoints(earnedPoints) + " pts" + (g.streak >= 2 ? " (🔥 Série x" + g.streak + ")" : ""))
      : "+0 pt (On apprend !)";

    showKahootFeedbackPanel(isCorrect, correctIdx, q, customTitle, ptsLabel, msgObj.emoji);

    broadcastLiveEvent({
      type: "HOST_REVEAL",
      correctIndex: correctIdx,
      teams: state.teams
    });
  }

  function highlightKahootTiles(correctIdx, chosenIdx) {
    var optBtns = document.querySelectorAll("#options-grid .kahoot-tile-btn");
    for (var i = 0; i < optBtns.length; i++) {
      optBtns[i].disabled = true;
      var iconEl = document.getElementById("opt-icon-" + i);
      if (i === correctIdx) {
        optBtns[i].classList.add("correct");
        if (iconEl) iconEl.textContent = "✔";
      } else if (i === chosenIdx && chosenIdx !== correctIdx) {
        optBtns[i].classList.add("wrong");
        if (iconEl) iconEl.textContent = "✖";
      } else {
        optBtns[i].classList.add("dimmed");
      }
    }
  }

  function renderKahootBarChart(counts, correctIdx) {
    var maxCount = Math.max(1, counts[0], counts[1], counts[2], counts[3]);
    for (var i = 0; i < 4; i++) {
      var c = counts[i] || 0;
      var label = c + (i === correctIdx ? " ✔" : "");
      document.getElementById("k-bar-count-" + i).textContent = label;
      var pct = c > 0 ? Math.max(22, Math.round((c / maxCount) * 100)) : 12;
      document.getElementById("k-bar-fill-" + i).style.height = pct + "%";
    }
  }

  function showKahootFeedbackPanel(isCorrect, correctIdx, q, titleText, ptsText, emojiOverride) {
    // Masquer l'illustration pour afficher le graphique Kahoot + l'explication pédagogique au centre
    document.getElementById("question-illustration-wrapper").classList.add("hidden");

    var fbPanel = document.getElementById("feedback-panel");
    fbPanel.classList.remove("hidden", "feedback-correct", "feedback-wrong");
    fbPanel.classList.add(isCorrect ? "feedback-correct" : "feedback-wrong");

    var goodShape = KAHOOT_SHAPES[correctIdx];
    document.getElementById("feedback-emoji").textContent = emojiOverride || (isCorrect ? "🎉" : "💡");
    document.getElementById("feedback-title").textContent = titleText;
    document.getElementById("feedback-points-earned").textContent = ptsText;
    document.getElementById("feedback-correct-answer").textContent =
      "✅ Bonne réponse : " + goodShape.symbol + " — " + q.options[correctIdx];
    document.getElementById("feedback-explanation-text").textContent = q.explanation;

    document.getElementById("btn-skip-reveal").classList.add("hidden");
    var nextBtn = document.getElementById("btn-next-question");
    nextBtn.classList.remove("hidden");

    var isLast = state.game.currentIndex >= state.game.questionsList.length - 1;
    document.getElementById("btn-next-label").textContent = isLast
      ? "PODIUM FINAL 🏆"
      : (state.config.gameMode === "teams" ? "SCOREBOARD ➔" : "SUIVANT ➔");
  }

  // Affichage du Tableau des Scores Intermédiaire Kahoot entre deux questions
  function showIntermediateKahootScoreboard() {
    var g = state.game;
    g.showingScoreboard = true;
    window.MPHB_SOUND.playScoreboardClimb();

    var overlay = document.getElementById("kahoot-scoreboard-overlay");
    overlay.classList.remove("hidden");

    var sorted = state.teams.slice().sort(function (a, b) {
      return b.score - a.score;
    });

    // Trouver la meilleure série en cours
    var bestStreakTeam = null;
    sorted.forEach(function (t) {
      if ((t.streak || 0) >= 2 && (!bestStreakTeam || t.streak > bestStreakTeam.streak)) {
        bestStreakTeam = t;
      }
    });

    var streakBanner = document.getElementById("k-sb-streak-banner");
    if (bestStreakTeam) {
      streakBanner.textContent =
        "🔥 " + bestStreakTeam.name + " est en feu avec une série de " + bestStreakTeam.streak + " bonnes réponses d'affilée !";
    } else if (sorted[0]) {
      streakBanner.textContent =
        "🏆 " + sorted[0].name + " mène la course en tête avec " + formatPoints(sorted[0].score) + " points !";
    }

    var medals = ["🥇 1er", "🥈 2e", "🥉 3e"];
    var listEl = document.getElementById("k-scoreboard-list");
    var html = "";
    sorted.forEach(function (t, idx) {
      var rankLabel = medals[idx] || ((idx + 1) + "e");
      var deltaHtml = t.lastDelta > 0
        ? '<span class="k-sb-delta">🔼 +' + formatPoints(t.lastDelta) + ' pts</span>'
        : '';
      var streakHtml = (t.streak || 0) >= 2
        ? '<span class="k-streak-pill" style="font-size:0.78rem;">🔥 x' + t.streak + '</span>'
        : '';

      html +=
        '<div class="k-sb-row' + (idx === 0 ? " k-sb-rank-1" : "") + '">' +
          '<div class="k-sb-left">' +
            '<span class="k-sb-rank">' + rankLabel + '</span>' +
            '<span style="font-size:1.3rem;">' + (t.avatar || "🤾") + '</span>' +
            '<span class="k-sb-name">' + escapeHtml(t.name) + '</span>' +
            streakHtml +
          '</div>' +
          '<div class="k-sb-right">' +
            deltaHtml +
            '<span class="k-sb-total">' + formatPoints(t.score) + ' pts</span>' +
          '</div>' +
        '</div>';
    });
    listEl.innerHTML = html;
  }

  function renderLiveTeamLeaderboard() {
    var listEl = document.getElementById("live-leaderboard-list");
    if (!listEl) return;

    var activeTeamId = (state.config.teamVoteMode === "turn" && state.teams[state.game.activeTeamIndex])
      ? state.teams[state.game.activeTeamIndex].id
      : null;

    var sorted = state.teams.map(function (t, originalIdx) {
      return { team: t, originalIdx: originalIdx };
    }).sort(function (a, b) {
      return b.team.score - a.team.score;
    });

    var medals = ["🥇", "🥈", "🥉"];
    var html = "";
    sorted.forEach(function (entry, rankIdx) {
      var t = entry.team;
      var isTurn = t.id === activeTeamId;
      var medal = medals[rankIdx] || (rankIdx + 1) + "e";
      html +=
        '<div class="team-rank-row' + (isTurn ? " active-turn" : "") + '">' +
          '<div class="team-rank-left">' +
            '<span class="team-rank-medal">' + medal + '</span>' +
            '<span>' + (t.avatar || "🤾") + '</span>' +
            '<span class="team-rank-name" title="' + escapeHtml(t.name) + '">' + escapeHtml(t.name) + '</span>' +
          '</div>' +
          '<div class="team-rank-right">' +
            '<button type="button" class="btn-team-bonus" data-bonus-idx="' + entry.originalIdx + '" data-delta="-100" title="Retirer 100 pts">-100</button>' +
            '<span class="team-rank-pts">' + formatPoints(t.score) + '</span>' +
            '<button type="button" class="btn-team-bonus" data-bonus-idx="' + entry.originalIdx + '" data-delta="100" title="Bonus Fair-Play +100 pts">+100</button>' +
          '</div>' +
        '</div>';
    });

    listEl.innerHTML = html;

    var bonusBtns = listEl.querySelectorAll(".btn-team-bonus");
    for (var i = 0; i < bonusBtns.length; i++) {
      bonusBtns[i].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-bonus-idx"), 10);
        var delta = parseInt(this.getAttribute("data-delta"), 10);
        if (state.teams[idx]) {
          state.teams[idx].score = Math.max(0, state.teams[idx].score + delta);
          saveTeams();
          renderLiveTeamLeaderboard();
          var currentTeam = state.teams[state.game.activeTeamIndex];
          if (currentTeam && state.config.teamVoteMode === "turn") {
            document.getElementById("active-team-score-pill").textContent = formatPoints(currentTeam.score) + " pts";
          }
        }
      });
    }
  }

  function bindQuizEvents() {
    document.getElementById("btn-next-question").addEventListener("click", function () {
      advanceAfterFeedback();
    });

    document.getElementById("btn-sb-next-question").addEventListener("click", function () {
      proceedToNextQuestionFromScoreboard();
    });

    document.getElementById("btn-skip-reveal").addEventListener("click", function () {
      if (state.config.gameMode === "teams" && state.config.teamVoteMode === "all") {
        revealMultiTeamVotes();
      } else {
        handleAnswerSelection(-1);
      }
    });

    document.getElementById("btn-reveal-multi-votes").addEventListener("click", function () {
      revealMultiTeamVotes();
    });

    document.getElementById("btn-toggle-team-vote-mode").addEventListener("click", function () {
      state.config.teamVoteMode = state.config.teamVoteMode === "turn" ? "all" : "turn";
      saveConfig();
      renderCurrentQuestion();
      showToast(
        state.config.teamVoteMode === "all"
          ? "🗳️ Mode : Toutes les équipes votent à chaque question !"
          : "📢 Mode : Chaque équipe répond à son tour !"
      );
    });

    document.getElementById("btn-pause-timer").addEventListener("click", function () {
      state.game.timerPaused = !state.game.timerPaused;
      updateTimerDisplay();
    });

    document.getElementById("btn-quiz-abort").addEventListener("click", function () {
      stopQuestionTimer();
      window.MPHB_SOUND.stopMusic();
      state.game.active = false;
      refreshAllUI();
      showScreen("screen-home");
    });

    document.getElementById("btn-quiz-open-admin").addEventListener("click", function () {
      stopQuestionTimer();
      window.MPHB_SOUND.stopMusic();
      requestAdminAccess();
    });
  }

  function advanceAfterFeedback() {
    var g = state.game;
    if (!g.answered) return;
    window.MPHB_SOUND.playClick();

    var isLast = g.currentIndex >= g.questionsList.length - 1;
    if (isLast) {
      finishQuizSession();
      return;
    }

    // En Mode Équipes, afficher le Scoreboard Kahoot intermédiaire entre deux questions
    if (state.config.gameMode === "teams" && !g.showingScoreboard) {
      showIntermediateKahootScoreboard();
      return;
    }

    proceedToNextQuestionFromScoreboard();
  }

  function proceedToNextQuestionFromScoreboard() {
    var g = state.game;
    document.getElementById("kahoot-scoreboard-overlay").classList.add("hidden");
    g.showingScoreboard = false;

    if (g.currentIndex < g.questionsList.length - 1) {
      g.currentIndex++;
      runKahootCountdownThenRender(false);
    } else {
      finishQuizSession();
    }
  }

  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", function (e) {
      var quizScreen = document.getElementById("screen-quiz");
      if (!quizScreen || !quizScreen.classList.contains("active")) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) {
        return;
      }

      var cdOverlay = document.getElementById("kahoot-countdown-overlay");
      if (cdOverlay && !cdOverlay.classList.contains("hidden")) return;

      if (!state.game.answered) {
        var choice = -1;
        if (e.key === "1" || e.key === "a" || e.key === "A") choice = 0;
        if (e.key === "2" || e.key === "b" || e.key === "B") choice = 1;
        if (e.key === "3" || e.key === "c" || e.key === "C") choice = 2;
        if (e.key === "4" || e.key === "d" || e.key === "D") choice = 3;

        if (choice !== -1) {
          if (state.config.gameMode === "teams" && state.config.teamVoteMode === "all") {
            registerTeamVoteInAllMode(state.game.selectedVoterTeamIdx, choice);
          } else {
            handleAnswerSelection(choice);
          }
        }
      } else {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (state.game.showingScoreboard) {
            proceedToNextQuestionFromScoreboard();
          } else {
            advanceAfterFeedback();
          }
        }
      }
    });
  }

  // ==========================================================================
  // 10. GRAND PODIUM KAHOOT & ÉCRAN FINAL
  // ==========================================================================
  function finishQuizSession() {
    stopQuestionTimer();
    window.MPHB_SOUND.stopMusic();
    var g = state.game;
    g.active = false;

    var total = g.questionsList.length;
    var pct = total > 0 ? Math.round((g.correctCount / total) * 100) : 0;

    window.MPHB_SOUND.playVictory();
    window.MPHB_FX.burstVictory();

    document.getElementById("res-final-score").textContent =
      formatPoints(g.score) + " pts (" + g.correctCount + "/" + total + ")";
    document.getElementById("res-correct-count").textContent = String(g.correctCount);
    document.getElementById("res-wrong-count").textContent = String(g.wrongCount);
    document.getElementById("res-percentage").textContent = pct + "%";

    var trophyEl = document.getElementById("results-trophy-icon");
    var titleEl = document.getElementById("results-title");
    var msgEl = document.getElementById("results-encouragement");

    if (pct >= 85) {
      trophyEl.textContent = "🏆";
      titleEl.textContent = "CHAMPIONS DU MARSEILLE PROVENCE HANDBALL !";
      msgEl.textContent = "Incroyable ! Vous connaissez les règles, le terrain, la technique et l'arbitrage comme de véritables joueurs professionnels du MPHB !";
    } else if (pct >= 60) {
      trophyEl.textContent = "🥇";
      titleEl.textContent = "SUPERBE PODIUM ! BRAVO À TOUS !";
      msgEl.textContent = "Très belle performance pendant ce stage de Noël ! Vous maîtrisez déjà l'essentiel du handball et vous êtes prêts à briller sur le terrain !";
    } else if (pct >= 35) {
      trophyEl.textContent = "🤾";
      titleEl.textContent = "BEL EFFORT & BELLE PROGRESSION !";
      msgEl.textContent = "Bravo d'avoir participé ! Chaque question vous a permis de découvrir de nouvelles règles du handball. Continuez à vous amuser sur le terrain !";
    } else {
      trophyEl.textContent = "🌟";
      titleEl.textContent = "BIENVENUE DANS L'UNIVERS DU HANDBALL !";
      msgEl.textContent = "C'est en jouant qu'on devient champion ! Vous avez découvert plein de règles aujourd'hui avec le Marseille Provence Handball. Rejouez quand vous voulez !";
    }

    var teamsSection = document.getElementById("results-teams-section");
    if (state.config.gameMode === "teams" && state.teams.length >= 2) {
      teamsSection.classList.remove("hidden");
      renderResultsTeamsPodium();
    } else {
      teamsSection.classList.add("hidden");
    }

    renderResultsReviewList();
    recordSessionHistory(total, pct);
    showScreen("screen-results");
  }

  function renderResultsTeamsPodium() {
    var sorted = state.teams.slice().sort(function (a, b) {
      return b.score - a.score;
    });

    var podiumEl = document.getElementById("results-podium");
    var podiumHtml = "";

    var order = [];
    if (sorted[1]) order.push({ team: sorted[1], rank: 2, medal: "🥈", cls: "podium-2" });
    if (sorted[0]) order.push({ team: sorted[0], rank: 1, medal: "🥇", cls: "podium-1" });
    if (sorted[2]) order.push({ team: sorted[2], rank: 3, medal: "🥉", cls: "podium-3" });

    order.forEach(function (item) {
      podiumHtml +=
        '<div class="podium-step ' + item.cls + '">' +
          '<div class="podium-medal">' + item.medal + '</div>' +
          '<div class="podium-team-name">' + (item.team.avatar || "🤾") + ' ' + escapeHtml(item.team.name) + '</div>' +
          '<div class="podium-team-pts">' + formatPoints(item.team.score) + ' pts</div>' +
        '</div>';
    });
    podiumEl.innerHTML = podiumHtml;

    var tableWrap = document.getElementById("results-teams-table");
    var rowsHtml = "";
    var medals = ["🥇 1er", "🥈 2e", "🥉 3e"];
    sorted.forEach(function (t, idx) {
      var rankLabel = medals[idx] || (idx + 1) + "e";
      rowsHtml +=
        '<div class="team-rank-row" style="margin-bottom:8px;">' +
          '<div class="team-rank-left">' +
            '<span style="font-weight:900; min-width:52px; color:#002b5c;">' + rankLabel + '</span>' +
            '<span>' + (t.avatar || "🤾") + '</span>' +
            '<span class="team-rank-name">' + escapeHtml(t.name) + '</span>' +
          '</div>' +
          '<div class="team-rank-right">' +
            '<span class="team-rank-pts">' + formatPoints(t.score) + ' points</span>' +
          '</div>' +
        '</div>';
    });
    tableWrap.innerHTML = rowsHtml;
  }

  function renderResultsReviewList() {
    var listEl = document.getElementById("results-review-list");
    listEl.classList.add("hidden");
    document.getElementById("review-chevron").textContent = "▼";

    var html = "";
    state.game.historyLog.forEach(function (item, idx) {
      var chosenShape = item.chosenIndex >= 0 ? KAHOOT_SHAPES[item.chosenIndex] : null;
      var goodShape = KAHOOT_SHAPES[item.correctIndex];
      var chosenText = chosenShape && item.options[item.chosenIndex]
        ? (chosenShape.symbol + " — " + item.options[item.chosenIndex])
        : "Temps écoulé / Non trouvé";
      var goodText = goodShape.symbol + " — " + item.options[item.correctIndex];

      html +=
        '<div class="review-item ' + (item.isCorrect ? "review-ok" : "review-ko") + '">' +
          '<div style="font-weight:900; color:#002b5c; margin-bottom:4px;">' +
            (idx + 1) + '. ' + escapeHtml(item.question) +
            (item.teamName ? ' <span style="color:#0055a4;">(' + escapeHtml(item.teamName) + ')</span>' : '') +
          '</div>' +
          '<div style="font-size:0.9rem; font-weight:700; margin-bottom:4px;">' +
            (item.isCorrect
              ? '<span style="color:#15803d;">✅ Bonne réponse : ' + escapeHtml(goodText) + '</span>'
              : '<span style="color:#b91c1c;">❌ Choix : ' + escapeHtml(chosenText) + '</span> &nbsp;|&nbsp; <span style="color:#15803d;">✅ Bonne réponse : ' + escapeHtml(goodText) + '</span>') +
          '</div>' +
          '<div style="font-size:0.86rem; color:#475569;">💡 ' + escapeHtml(item.explanation) + '</div>' +
        '</div>';
    });
    listEl.innerHTML = html;
  }

  function recordSessionHistory(totalQuestions, pct) {
    var now = new Date();
    var timeStr =
      String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0");

    var summaryLabel = "";
    if (state.config.gameMode === "teams") {
      var sorted = state.teams.slice().sort(function (a, b) { return b.score - a.score; });
      var winner = sorted[0] ? (sorted[0].name + " (" + formatPoints(sorted[0].score) + " pts)") : "Équipes";
      summaryLabel = "👥 Mode Équipes • 1er : " + winner;
    } else {
      var pName = state.config.playerName ? state.config.playerName : "Individuel / Groupe";
      summaryLabel = "🧒 " + pName;
    }

    state.sessionHistory.unshift({
      id: "hist_" + Date.now(),
      time: timeStr,
      quizTitle: state.game.title,
      participant: summaryLabel,
      score: formatPoints(state.game.score) + " pts (" + state.game.correctCount + "/" + totalQuestions + ")",
      percentage: pct + "%"
    });

    if (state.sessionHistory.length > 30) state.sessionHistory.pop();
    saveHistory();
  }

  function bindResultsEvents() {
    document.getElementById("btn-restart-same-quiz").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      startConfiguredQuiz();
    });

    document.getElementById("btn-results-home").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      refreshAllUI();
      showScreen("screen-home");
    });

    document.getElementById("btn-results-confetti").addEventListener("click", function () {
      window.MPHB_SOUND.playVictory();
      window.MPHB_FX.burstVictory();
    });

    document.getElementById("btn-toggle-review").addEventListener("click", function () {
      var listEl = document.getElementById("results-review-list");
      var chev = document.getElementById("review-chevron");
      if (listEl.classList.contains("hidden")) {
        listEl.classList.remove("hidden");
        chev.textContent = "▲";
      } else {
        listEl.classList.add("hidden");
        chev.textContent = "▼";
      }
    });
  }

  // ==========================================================================
  // 11. PANEL ADMIN & STUDIO CRÉATEUR DE QUIZ (CONNEXION PAR CODE + 6 ONGLETS)
  // ==========================================================================
  function requestAdminAccess() {
    if (state.adminUnlocked) {
      refreshAllUI();
      showScreen("screen-admin");
      return;
    }
    var modal = document.getElementById("modal-admin-login");
    var input = document.getElementById("admin-code-input");
    var err = document.getElementById("admin-login-error");
    modal.classList.remove("hidden");
    err.classList.add("hidden");
    input.value = "";
    input.type = "password";
    setTimeout(function () {
      input.focus();
    }, 60);
  }

  function closeAdminLoginModal() {
    document.getElementById("modal-admin-login").classList.add("hidden");
  }

  function bindAdminLoginModalEvents() {
    document.getElementById("btn-close-admin-login").addEventListener("click", closeAdminLoginModal);
    document.getElementById("btn-cancel-admin-login").addEventListener("click", closeAdminLoginModal);

    document.getElementById("btn-toggle-code-eye").addEventListener("click", function () {
      var input = document.getElementById("admin-code-input");
      input.type = input.type === "password" ? "text" : "password";
      input.focus();
    });

    document.getElementById("form-admin-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("admin-code-input");
      var entered = (input.value || "").trim().toLowerCase();
      var expected = (state.adminCode || "1961").trim().toLowerCase();

      // Accepte le code personnalisé (par défaut "1961") ou "mphb"
      var isValid = entered === expected || (expected === "1961" && entered === "mphb");

      if (isValid) {
        state.adminUnlocked = true;
        closeAdminLoginModal();
        window.MPHB_SOUND.playCorrect();
        refreshAllUI();
        showScreen("screen-admin");
        showToast("🔓 Accès Panel Admin déverrouillé !");
      } else {
        window.MPHB_SOUND.playWrong();
        var err = document.getElementById("admin-login-error");
        var card = document.getElementById("admin-login-card");
        err.classList.remove("hidden");
        card.classList.remove("shake-error");
        void card.offsetWidth;
        card.classList.add("shake-error");
        input.select();
      }
    });
  }

  function bindAdminEvents() {
    var tabs = document.querySelectorAll(".admin-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () {
        window.MPHB_SOUND.playClick();
        switchAdminTab(this.getAttribute("data-tab"));
      });
    }

    document.getElementById("btn-admin-back-home").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      refreshAllUI();
      showScreen("screen-home");
    });

    document.getElementById("btn-admin-lock").addEventListener("click", function () {
      state.adminUnlocked = false;
      window.MPHB_SOUND.playClick();
      refreshAllUI();
      showScreen("screen-home");
      showToast("🔒 Panel Admin verrouillé ! Le code secret sera demandé.");
    });

    document.getElementById("form-change-admin-code").addEventListener("submit", function (e) {
      e.preventDefault();
      var newCodeInput = document.getElementById("input-new-admin-code");
      var newCode = (newCodeInput.value || "").trim();
      if (!newCode) return;
      state.adminCode = newCode;
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_CODE, state.adminCode);
      } catch (err) {}
      newCodeInput.value = "";
      showToast("🔐 Nouveau code secret Admin enregistré : " + state.adminCode);
    });

    document.getElementById("btn-admin-quick-start").addEventListener("click", function () {
      window.MPHB_SOUND.playClick();
      startConfiguredQuiz();
    });

    // Onglet 1 : Configurer & Lancer
    var sourceRadios = document.querySelectorAll('input[name="configSourceType"]');
    for (var r = 0; r < sourceRadios.length; r++) {
      sourceRadios[r].addEventListener("change", function () {
        state.config.sourceType = this.value;
        saveConfig();
        renderAdminConfigTab();
      });
    }

    document.getElementById("admin-preset-select").addEventListener("change", function () {
      state.config.selectedQuizId = this.value;
      var qz = state.quizzes.find(function (item) { return item.id === state.config.selectedQuizId; });
      if (qz) {
        state.config.timerEnabled = qz.timerEnabled !== undefined ? !!qz.timerEnabled : true;
        state.config.timerSeconds = qz.timerSeconds || 20;
        state.config.shuffleQuestions = qz.shuffleQuestions !== false;
      }
      saveConfig();
      renderAdminConfigTab();
    });

    document.getElementById("admin-question-count").addEventListener("change", function () {
      state.config.questionCount = parseInt(this.value, 10) || 12;
      saveConfig();
    });

    document.getElementById("admin-level-filter").addEventListener("change", function () {
      state.config.levelFilter = this.value;
      saveConfig();
    });

    document.getElementById("admin-timer-toggle").addEventListener("change", function () {
      state.config.timerEnabled = this.checked;
      saveConfig();
      renderAdminConfigTab();
    });

    document.getElementById("admin-timer-seconds").addEventListener("change", function () {
      state.config.timerSeconds = parseInt(this.value, 10) || 20;
      saveConfig();
    });

    document.getElementById("admin-shuffle-toggle").addEventListener("change", function () {
      state.config.shuffleQuestions = this.checked;
      saveConfig();
    });

    var modeRadios = document.querySelectorAll('input[name="adminGameMode"]');
    for (var m = 0; m < modeRadios.length; m++) {
      modeRadios[m].addEventListener("change", function () {
        state.config.gameMode = this.value;
        saveConfig();
        renderAdminConfigTab();
      });
    }

    document.getElementById("admin-player-name").addEventListener("input", function () {
      state.config.playerName = this.value.trim();
      saveConfig();
    });

    document.getElementById("btn-add-team").addEventListener("click", addNewTeam);

    document.getElementById("btn-reset-teams-scores").addEventListener("click", function () {
      resetAllTeamScores();
      showToast("🔄 Points des équipes remis à 0 !");
    });

    document.getElementById("btn-admin-start-game").addEventListener("click", function () {
      startConfiguredQuiz();
    });

    document.getElementById("btn-admin-open-lobby").addEventListener("click", function () {
      openKahootLobby();
    });

    document.getElementById("btn-admin-reset-quiz").addEventListener("click", function () {
      stopQuestionTimer();
      state.game.active = false;
      resetAllTeamScores();
      showToast("🔄 Le Quiz et les scores d'équipes ont été réinitialisés !");
    });

    // Onglet 2 : Créateur de Kahoots / Quiz
    document.getElementById("btn-open-quiz-creator").addEventListener("click", function () {
      openQuizCreator(null);
    });
    document.getElementById("btn-close-quiz-creator").addEventListener("click", closeQuizCreator);
    document.getElementById("btn-cancel-quiz-creator").addEventListener("click", closeQuizCreator);

    document.getElementById("picker-search-input").addEventListener("input", renderQuizPickerQuestions);
    document.getElementById("picker-category-filter").addEventListener("change", renderQuizPickerQuestions);

    document.getElementById("btn-picker-select-all").addEventListener("click", function () {
      var visibleIds = getFilteredPickerQuestionIds();
      visibleIds.forEach(function (id) {
        if (state.quizEditorSelectedIds.indexOf(id) === -1) state.quizEditorSelectedIds.push(id);
      });
      renderQuizPickerQuestions();
    });

    document.getElementById("btn-picker-clear-all").addEventListener("click", function () {
      state.quizEditorSelectedIds = [];
      renderQuizPickerQuestions();
    });

    document.getElementById("btn-picker-random-10").addEventListener("click", function () {
      var pool = getFilteredPickerQuestionIds();
      shuffleArray(pool);
      state.quizEditorSelectedIds = pool.slice(0, Math.min(10, pool.length));
      renderQuizPickerQuestions();
      showToast("🎲 10 questions tirées au sort !");
    });

    document.getElementById("btn-picker-new-question").addEventListener("click", function () {
      switchAdminTab("tab-questions");
      openQuestionEditor(null);
    });

    document.getElementById("form-quiz-creator").addEventListener("submit", function (e) {
      e.preventDefault();
      saveQuizFromCreatorForm();
    });

    // Onglet 3 : Banque de Questions
    document.getElementById("btn-open-question-editor").addEventListener("click", function () {
      openQuestionEditor(null);
    });
    document.getElementById("btn-close-question-editor").addEventListener("click", closeQuestionEditor);
    document.getElementById("btn-cancel-question-editor").addEventListener("click", closeQuestionEditor);

    document.getElementById("bank-search-input").addEventListener("input", renderAdminQuestionsTab);
    document.getElementById("bank-category-filter").addEventListener("change", renderAdminQuestionsTab);
    document.getElementById("bank-level-filter").addEventListener("change", renderAdminQuestionsTab);

    document.getElementById("form-question-editor").addEventListener("submit", function (e) {
      e.preventDefault();
      saveQuestionFromEditorForm();
    });

    // Onglet 4 : Fiche Réponses & Explications
    document.getElementById("answers-filter-quiz").addEventListener("change", renderAdminAnswersTab);
    document.getElementById("btn-print-answers").addEventListener("click", function () {
      window.print();
    });

    // Onglet 5 : Scores & Historique
    document.getElementById("btn-scores-reset-teams").addEventListener("click", function () {
      resetAllTeamScores();
      showToast("🔄 Scores des équipes remis à 0 !");
    });

    document.getElementById("btn-clear-session-history").addEventListener("click", function () {
      state.sessionHistory = [];
      saveHistory();
      renderAdminScoresTab();
      showToast("🗑️ Historique de la session effacé.");
    });

    // Onglet 6 : Logo MPHB & Import/Export
    document.getElementById("input-upload-logo").addEventListener("change", handleLogoFileUpload);
    document.getElementById("btn-reset-default-logo").addEventListener("click", function () {
      state.customLogoDataUrl = null;
      try { localStorage.removeItem(STORAGE_KEYS.LOGO); } catch (e) {}
      renderLogos();
      showToast("🛡️ Logo officiel MPHB 1961 rétabli.");
    });

    document.getElementById("btn-export-js-file").addEventListener("click", exportQuestionsAsJSFile);
    document.getElementById("btn-export-json-file").addEventListener("click", exportQuestionsAsJSONFile);
    document.getElementById("input-import-json").addEventListener("change", importQuestionsFromJSONFile);

    document.getElementById("btn-restore-factory-data").addEventListener("click", function () {
      if (confirm("Voulez-vous vraiment restaurer les 48 questions et les 5 Quiz d'origine du Marseille Provence Handball ?")) {
        state.questions = JSON.parse(JSON.stringify(window.INITIAL_QUESTIONS || []));
        state.quizzes = JSON.parse(JSON.stringify(window.INITIAL_QUIZZES || []));
        saveQuestions();
        saveQuizzes();
        refreshAllUI();
        showToast("✅ Banque officielle de 48 questions et 5 Quiz restaurée !");
      }
    });
  }

  function switchAdminTab(tabId) {
    var tabs = document.querySelectorAll(".admin-tab");
    for (var i = 0; i < tabs.length; i++) {
      var isMatch = tabs[i].getAttribute("data-tab") === tabId;
      tabs[i].classList.toggle("active", isMatch);
      tabs[i].setAttribute("aria-selected", isMatch ? "true" : "false");
    }
    var contents = document.querySelectorAll(".admin-tab-content");
    for (var j = 0; j < contents.length; j++) {
      contents[j].classList.toggle("active", contents[j].id === tabId);
    }
  }

  function renderAdminConfigTab() {
    var radios = document.querySelectorAll('input[name="configSourceType"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = radios[i].value === state.config.sourceType;
    }

    var presetBlock = document.getElementById("config-preset-block");
    var customBlock = document.getElementById("config-custom-block");
    if (state.config.sourceType === "preset") {
      presetBlock.classList.remove("hidden");
      customBlock.classList.add("hidden");
    } else {
      presetBlock.classList.add("hidden");
      customBlock.classList.remove("hidden");
    }

    var presetSelect = document.getElementById("admin-preset-select");
    var presetHtml = "";
    state.quizzes.forEach(function (qz) {
      var sel = qz.id === state.config.selectedQuizId ? " selected" : "";
      presetHtml += '<option value="' + escapeHtml(qz.id) + '"' + sel + '>' + escapeHtml(formatQuizOptionTitle(qz)) + '</option>';
    });
    presetSelect.innerHTML = presetHtml;

    var activeQz = state.quizzes.find(function (qz) { return qz.id === state.config.selectedQuizId; });
    document.getElementById("admin-preset-desc").textContent = activeQz ? activeQz.description : "";

    var catCheckContainer = document.getElementById("admin-categories-checkboxes");
    var catHtml = "";
    state.categories.forEach(function (cat) {
      var count = state.questions.filter(function (q) { return q.category === cat.id; }).length;
      var checked = state.config.selectedCategories.indexOf(cat.id) !== -1 ? " checked" : "";
      catHtml +=
        '<label class="cat-check-item">' +
          '<input type="checkbox" class="admin-cat-checkbox" value="' + escapeHtml(cat.id) + '"' + checked + ' />' +
          '<span>' + cat.icon + ' ' + escapeHtml(cat.shortName) + ' (' + count + ')</span>' +
        '</label>';
    });
    catCheckContainer.innerHTML = catHtml;

    var catBoxes = catCheckContainer.querySelectorAll(".admin-cat-checkbox");
    for (var c = 0; c < catBoxes.length; c++) {
      catBoxes[c].addEventListener("change", function () {
        var selected = [];
        var allBoxes = catCheckContainer.querySelectorAll(".admin-cat-checkbox");
        for (var k = 0; k < allBoxes.length; k++) {
          if (allBoxes[k].checked) selected.push(allBoxes[k].value);
        }
        state.config.selectedCategories = selected;
        saveConfig();
        renderHomeSummaryBadges();
      });
    }

    document.getElementById("admin-question-count").value = String(state.config.questionCount);
    document.getElementById("admin-level-filter").value = state.config.levelFilter;

    var timerToggle = document.getElementById("admin-timer-toggle");
    timerToggle.checked = !!state.config.timerEnabled;
    var timerWrap = document.getElementById("admin-timer-seconds-wrap");
    if (state.config.timerEnabled) {
      timerWrap.classList.remove("hidden");
    } else {
      timerWrap.classList.add("hidden");
    }
    document.getElementById("admin-timer-seconds").value = String(state.config.timerSeconds || 20);
    document.getElementById("admin-shuffle-toggle").checked = state.config.shuffleQuestions !== false;

    var modeRadios = document.querySelectorAll('input[name="adminGameMode"]');
    for (var m = 0; m < modeRadios.length; m++) {
      modeRadios[m].checked = modeRadios[m].value === state.config.gameMode;
    }

    var indivBox = document.getElementById("admin-indiv-config");
    var teamsBox = document.getElementById("admin-teams-config");
    if (state.config.gameMode === "teams") {
      indivBox.classList.add("hidden");
      teamsBox.classList.remove("hidden");
      renderTeamsListInside("admin-teams-list");
    } else {
      indivBox.classList.remove("hidden");
      teamsBox.classList.add("hidden");
      document.getElementById("admin-player-name").value = state.config.playerName || "";
    }
  }

  function resetAllTeamScores() {
    state.teams.forEach(function (t) {
      t.score = 0;
      t.correct = 0;
      t.streak = 0;
      t.lastDelta = 0;
    });
    saveTeams();
    refreshAllUI();
  }

  function renderAdminQuizzesTab() {
    document.getElementById("admin-tab-quizzes-count").textContent = String(state.quizzes.length);
    var grid = document.getElementById("admin-quizzes-list");
    var html = "";

    state.quizzes.forEach(function (qz) {
      var validCount = countValidQuestionsInQuiz(qz);
      var timerBadge = qz.timerEnabled ? ("⏱️ " + (qz.timerSeconds || 20) + "s") : "⏱️ Libre";
      var shuffleBadge = qz.shuffleQuestions !== false ? "🔀 Aléatoire" : "📋 Ordre fixe";

      html +=
        '<div class="quiz-admin-card">' +
          '<div>' +
            '<h3 class="quiz-admin-card-title">' + escapeHtml(qz.title) + '</h3>' +
            '<p class="quiz-admin-card-desc">' + escapeHtml(qz.description || "Quiz personnalisé MPHB") + '</p>' +
            '<div class="quiz-admin-meta">' +
              '<span class="summary-chip">❓ ' + validCount + ' questions</span>' +
              '<span class="summary-chip">' + timerBadge + '</span>' +
              '<span class="summary-chip">' + shuffleBadge + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="quiz-admin-actions">' +
            '<button type="button" class="btn-small-accent btn-play-quiz" data-quiz-id="' + escapeHtml(qz.id) + '">▶ Jouer ce Quiz</button>' +
            '<button type="button" class="btn-small-outline btn-lobby-quiz" data-quiz-id="' + escapeHtml(qz.id) + '">📡 Lobby PIN</button>' +
            '<button type="button" class="btn-small-outline btn-edit-quiz" data-quiz-id="' + escapeHtml(qz.id) + '">✏️ Modifier</button>' +
            '<button type="button" class="btn-small-outline btn-dup-quiz" data-quiz-id="' + escapeHtml(qz.id) + '">📋 Dupliquer</button>' +
            (state.quizzes.length > 1
              ? '<button type="button" class="btn-small-outline btn-del-quiz" data-quiz-id="' + escapeHtml(qz.id) + '" style="color:#b91c1c; border-color:#fca5a5;">🗑️ Supprimer</button>'
              : '') +
          '</div>' +
        '</div>';
    });
    grid.innerHTML = html;

    var playBtns = grid.querySelectorAll(".btn-play-quiz");
    for (var i = 0; i < playBtns.length; i++) {
      playBtns[i].addEventListener("click", function () {
        var qzId = this.getAttribute("data-quiz-id");
        var qz = state.quizzes.find(function (item) { return item.id === qzId; });
        if (!qz) return;
        state.config.sourceType = "preset";
        state.config.selectedQuizId = qz.id;
        state.config.timerEnabled = qz.timerEnabled !== undefined ? !!qz.timerEnabled : true;
        state.config.timerSeconds = qz.timerSeconds || 20;
        state.config.shuffleQuestions = qz.shuffleQuestions !== false;
        saveConfig();
        startConfiguredQuiz();
      });
    }

    var lobbyBtns = grid.querySelectorAll(".btn-lobby-quiz");
    for (var l = 0; l < lobbyBtns.length; l++) {
      lobbyBtns[l].addEventListener("click", function () {
        var qzId = this.getAttribute("data-quiz-id");
        var qz = state.quizzes.find(function (item) { return item.id === qzId; });
        if (!qz) return;
        state.config.sourceType = "preset";
        state.config.selectedQuizId = qz.id;
        saveConfig();
        openKahootLobby();
      });
    }

    var editBtns = grid.querySelectorAll(".btn-edit-quiz");
    for (var j = 0; j < editBtns.length; j++) {
      editBtns[j].addEventListener("click", function () {
        openQuizCreator(this.getAttribute("data-quiz-id"));
      });
    }

    var dupBtns = grid.querySelectorAll(".btn-dup-quiz");
    for (var d = 0; d < dupBtns.length; d++) {
      dupBtns[d].addEventListener("click", function () {
        var qzId = this.getAttribute("data-quiz-id");
        var orig = state.quizzes.find(function (item) { return item.id === qzId; });
        if (!orig) return;
        var copy = JSON.parse(JSON.stringify(orig));
        copy.id = "quiz_" + Date.now();
        copy.title = orig.title + " (Copie)";
        state.quizzes.unshift(copy);
        saveQuizzes();
        refreshAllUI();
        showToast("📋 Quiz dupliqué !");
      });
    }

    var delBtns = grid.querySelectorAll(".btn-del-quiz");
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener("click", function () {
        var qzId = this.getAttribute("data-quiz-id");
        var target = state.quizzes.find(function (item) { return item.id === qzId; });
        if (!target) return;
        if (confirm("Supprimer le Quiz « " + target.title + " » ?")) {
          state.quizzes = state.quizzes.filter(function (item) { return item.id !== qzId; });
          if (state.config.selectedQuizId === qzId && state.quizzes[0]) {
            state.config.selectedQuizId = state.quizzes[0].id;
            saveConfig();
          }
          saveQuizzes();
          refreshAllUI();
          showToast("🗑️ Quiz supprimé.");
        }
      });
    }
  }

  function openQuizCreator(quizId) {
    var modal = document.getElementById("quiz-creator-modal");
    modal.classList.remove("hidden");

    var catSelect = document.getElementById("picker-category-filter");
    var catHtml = '<option value="all">Toutes les catégories</option>';
    state.categories.forEach(function (c) {
      catHtml += '<option value="' + escapeHtml(c.id) + '">' + c.icon + ' ' + escapeHtml(c.name) + '</option>';
    });
    catSelect.innerHTML = catHtml;
    document.getElementById("picker-search-input").value = "";

    if (quizId) {
      var qz = state.quizzes.find(function (item) { return item.id === quizId; });
      if (!qz) return;
      document.getElementById("quiz-creator-title").textContent = "✏️ Modifier le Quiz : " + qz.title;
      document.getElementById("edit-quiz-id").value = qz.id;
      document.getElementById("quiz-title-input").value = qz.title;
      document.getElementById("quiz-desc-input").value = qz.description || "";
      document.getElementById("quiz-timer-enabled-input").value = qz.timerEnabled ? "true" : "false";
      document.getElementById("quiz-timer-sec-input").value = String(qz.timerSeconds || 20);
      document.getElementById("quiz-shuffle-input").value = qz.shuffleQuestions !== false ? "true" : "false";
      state.quizEditorSelectedIds = Array.isArray(qz.questionIds) ? qz.questionIds.slice() : [];
    } else {
      document.getElementById("quiz-creator-title").textContent = "✨ Créer un nouveau Quiz sur-mesure";
      document.getElementById("edit-quiz-id").value = "";
      document.getElementById("quiz-title-input").value = "";
      document.getElementById("quiz-desc-input").value = "";
      document.getElementById("quiz-timer-enabled-input").value = "true";
      document.getElementById("quiz-timer-sec-input").value = "20";
      document.getElementById("quiz-shuffle-input").value = "true";
      state.quizEditorSelectedIds = [];
    }

    renderQuizPickerQuestions();
    modal.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeQuizCreator() {
    document.getElementById("quiz-creator-modal").classList.add("hidden");
  }

  function getFilteredPickerQuestionIds() {
    var search = (document.getElementById("picker-search-input").value || "").toLowerCase().trim();
    var catFilter = document.getElementById("picker-category-filter").value;

    return state.questions.filter(function (q) {
      var catOk = catFilter === "all" || q.category === catFilter;
      var searchOk = !search || q.question.toLowerCase().indexOf(search) !== -1;
      return catOk && searchOk;
    }).map(function (q) { return q.id; });
  }

  function renderQuizPickerQuestions() {
    var countEl = document.getElementById("quiz-picker-count");
    var n = state.quizEditorSelectedIds.length;
    countEl.textContent = n + " question" + (n > 1 ? "s" : "") + " sélectionnée" + (n > 1 ? "s" : "");

    var search = (document.getElementById("picker-search-input").value || "").toLowerCase().trim();
    var catFilter = document.getElementById("picker-category-filter").value;

    var listEl = document.getElementById("quiz-picker-questions-list");
    var html = "";

    state.questions.forEach(function (q) {
      var catOk = catFilter === "all" || q.category === catFilter;
      var searchOk = !search || q.question.toLowerCase().indexOf(search) !== -1;
      if (!catOk || !searchOk) return;

      var cat = getCategoryById(q.category);
      var checked = state.quizEditorSelectedIds.indexOf(q.id) !== -1 ? " checked" : "";
      html +=
        '<label class="picker-q-item">' +
          '<input type="checkbox" class="picker-q-checkbox" value="' + escapeHtml(q.id) + '"' + checked + ' />' +
          '<span style="color:' + cat.color + '; font-weight:900;">[' + cat.icon + ' ' + escapeHtml(cat.shortName) + ']</span>' +
          '<span>' + escapeHtml(q.question) + '</span>' +
        '</label>';
    });

    if (!html) html = '<p class="form-help-text" style="padding:12px;">Aucune question trouvée.</p>';
    listEl.innerHTML = html;

    var boxes = listEl.querySelectorAll(".picker-q-checkbox");
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].addEventListener("change", function () {
        var qId = this.value;
        var idx = state.quizEditorSelectedIds.indexOf(qId);
        if (this.checked && idx === -1) state.quizEditorSelectedIds.push(qId);
        else if (!this.checked && idx !== -1) state.quizEditorSelectedIds.splice(idx, 1);
        var c = state.quizEditorSelectedIds.length;
        document.getElementById("quiz-picker-count").textContent =
          c + " question" + (c > 1 ? "s" : "") + " sélectionnée" + (c > 1 ? "s" : "");
      });
    }
  }

  function saveQuizFromCreatorForm() {
    var editId = document.getElementById("edit-quiz-id").value;
    var title = document.getElementById("quiz-title-input").value.trim();
    var desc = document.getElementById("quiz-desc-input").value.trim();
    var timerEnabled = document.getElementById("quiz-timer-enabled-input").value === "true";
    var timerSeconds = parseInt(document.getElementById("quiz-timer-sec-input").value, 10) || 20;
    var shuffleQuestions = document.getElementById("quiz-shuffle-input").value === "true";

    if (!title) {
      showToast("⚠️ Veuillez donner un titre à votre Quiz.");
      return;
    }
    if (state.quizEditorSelectedIds.length === 0) {
      showToast("⚠️ Veuillez cocher au moins 1 question !");
      return;
    }

    if (editId) {
      var existing = state.quizzes.find(function (item) { return item.id === editId; });
      if (existing) {
        existing.title = title;
        existing.description = desc;
        existing.timerEnabled = timerEnabled;
        existing.timerSeconds = timerSeconds;
        existing.shuffleQuestions = shuffleQuestions;
        existing.questionIds = state.quizEditorSelectedIds.slice();
      }
      showToast("✅ Quiz « " + title + " » mis à jour !");
    } else {
      var newQuiz = {
        id: "quiz_" + Date.now(),
        title: title,
        description: desc || (state.quizEditorSelectedIds.length + " questions sélectionnées"),
        timerEnabled: timerEnabled,
        timerSeconds: timerSeconds,
        shuffleQuestions: shuffleQuestions,
        questionIds: state.quizEditorSelectedIds.slice()
      };
      state.quizzes.unshift(newQuiz);
      state.config.sourceType = "preset";
      state.config.selectedQuizId = newQuiz.id;
      saveConfig();
      showToast("🎉 Nouveau Quiz « " + title + " » créé !");
    }

    saveQuizzes();
    closeQuizCreator();
    refreshAllUI();
  }

  function updateEditorCorrectPills() {
    var radios = document.querySelectorAll('input[name="qCorrectOption"]');
    for (var i = 0; i < radios.length; i++) {
      var pillText = radios[i].parentElement.querySelector(".correct-pill-text");
      if (pillText) {
        pillText.textContent = radios[i].checked ? "✅ Bonne réponse" : "⭕ Choisir";
      }
    }
  }

  function renderAdminQuestionsTab() {
    document.getElementById("admin-tab-questions-count").textContent = String(state.questions.length);

    var catFilterEl = document.getElementById("bank-category-filter");
    if (catFilterEl.options.length <= 1) {
      var cHtml = '<option value="all">Toutes les catégories</option>';
      state.categories.forEach(function (c) {
        cHtml += '<option value="' + escapeHtml(c.id) + '">' + c.icon + ' ' + escapeHtml(c.name) + '</option>';
      });
      catFilterEl.innerHTML = cHtml;
    }

    var search = (document.getElementById("bank-search-input").value || "").toLowerCase().trim();
    var catVal = catFilterEl.value;
    var lvlVal = document.getElementById("bank-level-filter").value;

    var filtered = state.questions.filter(function (q) {
      var catOk = catVal === "all" || q.category === catVal;
      var lvlOk = lvlVal === "all" || q.level === lvlVal;
      var searchOk = !search ||
        q.question.toLowerCase().indexOf(search) !== -1 ||
        q.explanation.toLowerCase().indexOf(search) !== -1 ||
        q.options.some(function (o) { return o.toLowerCase().indexOf(search) !== -1; });
      return catOk && lvlOk && searchOk;
    });

    var listEl = document.getElementById("admin-questions-list");
    var html = "";

    filtered.forEach(function (q) {
      var cat = getCategoryById(q.category);
      var optsHtml = "";
      for (var i = 0; i < 4; i++) {
        var isGood = i === q.correctIndex;
        var sh = KAHOOT_SHAPES[i];
        optsHtml +=
          '<div class="q-bank-opt' + (isGood ? " is-correct" : "") + '">' +
            '<span class="option-letter-badge ' + sh.colorClass + '" style="width:28px;height:28px;font-size:0.85rem;flex-shrink:0;">' + sh.symbol + '</span>' +
            '<input type="text" class="inline-opt-input" data-q-id="' + escapeHtml(q.id) + '" data-opt-idx="' + i + '" value="' + escapeHtml(q.options[i] || "") + '" title="Modifier directement le texte de cette réponse" />' +
            '<button type="button" class="btn-set-correct' + (isGood ? " active-correct" : "") + '" data-q-id="' + escapeHtml(q.id) + '" data-opt-idx="' + i + '" title="Définir cette réponse comme la bonne réponse">' +
              (isGood ? "✅ Bonne réponse" : "⭕ Choisir") +
            '</button>' +
          '</div>';
      }

      html +=
        '<div class="q-bank-card">' +
          '<div class="q-bank-top">' +
            '<div class="q-bank-badges">' +
              '<span class="category-badge" style="background:' + cat.color + '; font-size:0.78rem; padding:4px 10px;">' +
                cat.icon + ' ' + escapeHtml(cat.name) +
              '</span>' +
              '<span class="level-badge">' + (q.level === "moyen" ? "🔥 Confirmé" : "⭐ Découverte") + '</span>' +
            '</div>' +
            '<div class="q-bank-actions">' +
              '<button type="button" class="btn-small-outline btn-edit-q" data-q-id="' + escapeHtml(q.id) + '">✏️ Éditeur complet</button>' +
              '<button type="button" class="btn-small-outline btn-dup-q" data-q-id="' + escapeHtml(q.id) + '">📋 Dupliquer</button>' +
              '<button type="button" class="btn-small-outline btn-del-q" data-q-id="' + escapeHtml(q.id) + '" style="color:#b91c1c; border-color:#fca5a5;">🗑️ Supprimer</button>' +
            '</div>' +
          '</div>' +
          '<h4 class="q-bank-title">' + escapeHtml(q.question) + '</h4>' +
          '<p class="form-help-text" style="margin-bottom:8px;">💡 Modifiez le texte d\'une réponse ci-dessous ou cliquez sur <strong>« ⭕ Choisir »</strong> pour changer la bonne réponse :</p>' +
          '<div class="q-bank-options">' + optsHtml + '</div>' +
          '<div class="q-bank-exp"><strong>💡 Explication :</strong> ' + escapeHtml(q.explanation) + '</div>' +
        '</div>';
    });

    if (!html) html = '<p class="form-help-text" style="padding:16px;">Aucune question ne correspond à votre recherche.</p>';
    listEl.innerHTML = html;

    // Écouteur : Modifier directement le texte d'une des 4 réponses sur la carte
    var inlineInputs = listEl.querySelectorAll(".inline-opt-input");
    for (var inp = 0; inp < inlineInputs.length; inp++) {
      inlineInputs[inp].addEventListener("change", function () {
        var qId = this.getAttribute("data-q-id");
        var optIdx = parseInt(this.getAttribute("data-opt-idx"), 10);
        var targetQ = state.questions.find(function (item) { return item.id === qId; });
        if (targetQ && this.value.trim()) {
          targetQ.options[optIdx] = this.value.trim();
          saveQuestions();
          renderAdminAnswersTab();
          showToast("💾 Texte de la réponse " + KAHOOT_SHAPES[optIdx].symbol + " enregistré !");
        }
      });
    }

    // Écouteur : Changer quelle est la BONNE réponse en 1 clic
    var setCorrectBtns = listEl.querySelectorAll(".btn-set-correct");
    for (var sc = 0; sc < setCorrectBtns.length; sc++) {
      setCorrectBtns[sc].addEventListener("click", function () {
        var qId = this.getAttribute("data-q-id");
        var optIdx = parseInt(this.getAttribute("data-opt-idx"), 10);
        var targetQ = state.questions.find(function (item) { return item.id === qId; });
        if (targetQ) {
          targetQ.correctIndex = optIdx;
          saveQuestions();
          window.MPHB_SOUND.playClick();
          refreshAllUI();
          showToast("✅ Bonne réponse changée : " + KAHOOT_SHAPES[optIdx].symbol + " « " + targetQ.options[optIdx] + " »");
        }
      });
    }

    var editBtns = listEl.querySelectorAll(".btn-edit-q");
    for (var e = 0; e < editBtns.length; e++) {
      editBtns[e].addEventListener("click", function () {
        openQuestionEditor(this.getAttribute("data-q-id"));
      });
    }

    var dupBtns = listEl.querySelectorAll(".btn-dup-q");
    for (var d = 0; d < dupBtns.length; d++) {
      dupBtns[d].addEventListener("click", function () {
        var qId = this.getAttribute("data-q-id");
        var orig = state.questions.find(function (item) { return item.id === qId; });
        if (!orig) return;
        var copy = JSON.parse(JSON.stringify(orig));
        copy.id = "q_" + Date.now();
        copy.question = orig.question + " (Copie)";
        state.questions.unshift(copy);
        saveQuestions();
        refreshAllUI();
        showToast("📋 Question dupliquée !");
      });
    }

    var delBtns = listEl.querySelectorAll(".btn-del-q");
    for (var k = 0; k < delBtns.length; k++) {
      delBtns[k].addEventListener("click", function () {
        var qId = this.getAttribute("data-q-id");
        var target = state.questions.find(function (item) { return item.id === qId; });
        if (!target) return;
        if (confirm("Supprimer cette question de la banque ?\n« " + target.question + " »")) {
          state.questions = state.questions.filter(function (item) { return item.id !== qId; });
          saveQuestions();
          refreshAllUI();
          showToast("🗑️ Question supprimée.");
        }
      });
    }
  }

  function openQuestionEditor(questionId) {
    var modal = document.getElementById("question-editor-modal");
    modal.classList.remove("hidden");

    var catSelect = document.getElementById("q-category-input");
    var cHtml = "";
    state.categories.forEach(function (c) {
      cHtml += '<option value="' + escapeHtml(c.id) + '">' + c.icon + ' ' + escapeHtml(c.name) + '</option>';
    });
    catSelect.innerHTML = cHtml;

    var attachSelect = document.getElementById("q-attach-quiz-select");
    var aHtml = '<option value="">-- Ne pas ajouter à un Quiz spécifique (ajouter seulement à la banque) --</option>';
    state.quizzes.forEach(function (qz) {
      aHtml += '<option value="' + escapeHtml(qz.id) + '">📚 Ajouter aussi au Quiz : ' + escapeHtml(qz.title) + '</option>';
    });
    attachSelect.innerHTML = aHtml;

    if (questionId) {
      var q = state.questions.find(function (item) { return item.id === questionId; });
      if (!q) return;
      document.getElementById("question-editor-title").textContent = "✏️ Modifier la question";
      document.getElementById("edit-question-id").value = q.id;
      catSelect.value = q.category;
      document.getElementById("q-level-input").value = q.level || "facile";
      document.getElementById("q-illo-input").value = q.illustration || "players";
      document.getElementById("q-text-input").value = q.question;
      for (var i = 0; i < 4; i++) {
        document.getElementById("q-opt-" + i).value = q.options[i] || "";
      }
      var radios = document.querySelectorAll('input[name="qCorrectOption"]');
      for (var r = 0; r < radios.length; r++) {
        radios[r].checked = parseInt(radios[r].value, 10) === q.correctIndex;
      }
      document.getElementById("q-explanation-input").value = q.explanation || "";
    } else {
      document.getElementById("question-editor-title").textContent = "➕ Ajouter une nouvelle question";
      document.getElementById("edit-question-id").value = "";
      catSelect.value = "regles";
      document.getElementById("q-level-input").value = "facile";
      document.getElementById("q-illo-input").value = "players";
      document.getElementById("q-text-input").value = "";
      for (var j = 0; j < 4; j++) {
        document.getElementById("q-opt-" + j).value = "";
      }
      var radiosNew = document.querySelectorAll('input[name="qCorrectOption"]');
      for (var rn = 0; rn < radiosNew.length; rn++) {
        radiosNew[rn].checked = rn === 0;
      }
      document.getElementById("q-explanation-input").value = "";
    }

    updateEditorCorrectPills();
    var allRadios = document.querySelectorAll('input[name="qCorrectOption"]');
    for (var rc = 0; rc < allRadios.length; rc++) {
      allRadios[rc].onchange = updateEditorCorrectPills;
    }

    modal.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeQuestionEditor() {
    document.getElementById("question-editor-modal").classList.add("hidden");
  }

  function saveQuestionFromEditorForm() {
    var editId = document.getElementById("edit-question-id").value;
    var category = document.getElementById("q-category-input").value;
    var level = document.getElementById("q-level-input").value;
    var illustration = document.getElementById("q-illo-input").value;
    var questionText = document.getElementById("q-text-input").value.trim();
    var options = [
      document.getElementById("q-opt-0").value.trim(),
      document.getElementById("q-opt-1").value.trim(),
      document.getElementById("q-opt-2").value.trim(),
      document.getElementById("q-opt-3").value.trim()
    ];
    var explanation = document.getElementById("q-explanation-input").value.trim();
    var attachQuizId = document.getElementById("q-attach-quiz-select").value;

    var correctIndex = 0;
    var radios = document.querySelectorAll('input[name="qCorrectOption"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) correctIndex = parseInt(radios[i].value, 10);
    }

    if (!questionText || options.some(function (o) { return !o; }) || !explanation) {
      showToast("⚠️ Veuillez remplir l'énoncé, les 4 réponses et l'explication.");
      return;
    }

    var savedId = editId;
    if (editId) {
      var existing = state.questions.find(function (item) { return item.id === editId; });
      if (existing) {
        existing.category = category;
        existing.level = level;
        existing.illustration = illustration;
        existing.question = questionText;
        existing.options = options;
        existing.correctIndex = correctIndex;
        existing.explanation = explanation;
      }
      showToast("✅ Question modifiée avec succès !");
    } else {
      savedId = "q_" + Date.now();
      state.questions.unshift({
        id: savedId,
        category: category,
        level: level,
        illustration: illustration,
        question: questionText,
        options: options,
        correctIndex: correctIndex,
        explanation: explanation
      });
      showToast("🎉 Nouvelle question ajoutée à la banque !");
    }

    if (attachQuizId && savedId) {
      var targetQuiz = state.quizzes.find(function (qz) { return qz.id === attachQuizId; });
      if (targetQuiz && targetQuiz.questionIds.indexOf(savedId) === -1) {
        targetQuiz.questionIds.push(savedId);
        saveQuizzes();
      }
    }

    if (!document.getElementById("quiz-creator-modal").classList.contains("hidden") && savedId) {
      if (state.quizEditorSelectedIds.indexOf(savedId) === -1) {
        state.quizEditorSelectedIds.push(savedId);
      }
    }

    saveQuestions();
    closeQuestionEditor();
    refreshAllUI();
  }

  function renderAdminAnswersTab() {
    var filterSelect = document.getElementById("answers-filter-quiz");
    var currentVal = filterSelect.value || "all";

    var fHtml = '<option value="all">Toutes les questions de la banque (' + state.questions.length + ')</option>';
    state.quizzes.forEach(function (qz) {
      var sel = currentVal === qz.id ? " selected" : "";
      fHtml += '<option value="' + escapeHtml(qz.id) + '"' + sel + '>📚 ' + escapeHtml(qz.title) + '</option>';
    });
    state.categories.forEach(function (cat) {
      var val = "cat_" + cat.id;
      var sel = currentVal === val ? " selected" : "";
      fHtml += '<option value="' + escapeHtml(val) + '"' + sel + '>' + cat.icon + ' Catégorie : ' + escapeHtml(cat.name) + '</option>';
    });
    filterSelect.innerHTML = fHtml;

    var listToDisplay = state.questions;
    if (currentVal.indexOf("cat_") === 0) {
      var catId = currentVal.replace("cat_", "");
      listToDisplay = state.questions.filter(function (q) { return q.category === catId; });
    } else if (currentVal !== "all") {
      var qzObj = state.quizzes.find(function (qz) { return qz.id === currentVal; });
      if (qzObj) {
        var map = {};
        state.questions.forEach(function (q) { map[q.id] = q; });
        listToDisplay = qzObj.questionIds.map(function (id) { return map[id]; }).filter(Boolean);
      }
    }

    var sheetEl = document.getElementById("admin-answers-sheet");
    var html = "";

    listToDisplay.forEach(function (q, idx) {
      var cat = getCategoryById(q.category);
      var optsMiniHtml = "";
      for (var i = 0; i < 4; i++) {
        var isGood = i === q.correctIndex;
        var sh = KAHOOT_SHAPES[i];
        optsMiniHtml +=
          '<button type="button" class="sheet-opt-btn' + (isGood ? " is-correct" : "") + '" data-q-id="' + escapeHtml(q.id) + '" data-opt-idx="' + i + '" title="Cliquer pour définir cette réponse comme la bonne réponse">' +
            '<span class="option-letter-badge ' + sh.colorClass + '" style="width:24px;height:24px;font-size:0.75rem;flex-shrink:0;">' + sh.symbol + '</span>' +
            '<span style="flex:1;text-align:left;">' + escapeHtml(q.options[i] || "") + '</span>' +
            '<span>' + (isGood ? "✅ Bonne" : "⭕") + '</span>' +
          '</button>';
      }

      html +=
        '<div class="answer-sheet-card">' +
          '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">' +
            '<span style="font-size:0.78rem; font-weight:800; color:' + cat.color + ';">' +
              '#' + (idx + 1) + ' • ' + cat.icon + ' ' + escapeHtml(cat.name) +
            '</span>' +
            '<button type="button" class="btn-small-outline btn-sheet-edit-q" data-q-id="' + escapeHtml(q.id) + '">✏️ Modifier réponses</button>' +
          '</div>' +
          '<div class="answer-sheet-q">' + escapeHtml(q.question) + '</div>' +
          '<div class="sheet-opts-grid">' + optsMiniHtml + '</div>' +
          '<div class="answer-sheet-exp"><strong>💡 Explication :</strong> ' + escapeHtml(q.explanation) + '</div>' +
        '</div>';
    });

    sheetEl.innerHTML = html;

    // Clic sur l'une des 4 réponses dans l'onglet 4 pour changer la bonne réponse en 1 clic
    var sheetOptBtns = sheetEl.querySelectorAll(".sheet-opt-btn");
    for (var s = 0; s < sheetOptBtns.length; s++) {
      sheetOptBtns[s].addEventListener("click", function () {
        var qId = this.getAttribute("data-q-id");
        var optIdx = parseInt(this.getAttribute("data-opt-idx"), 10);
        var targetQ = state.questions.find(function (item) { return item.id === qId; });
        if (targetQ) {
          targetQ.correctIndex = optIdx;
          saveQuestions();
          window.MPHB_SOUND.playClick();
          refreshAllUI();
          showToast("✅ Bonne réponse mise à jour : " + KAHOOT_SHAPES[optIdx].symbol + " « " + targetQ.options[optIdx] + " »");
        }
      });
    }

    // Bouton "✏️ Modifier réponses" dans l'onglet 4 -> bascule sur l'éditeur de la question
    var sheetEditBtns = sheetEl.querySelectorAll(".btn-sheet-edit-q");
    for (var e = 0; e < sheetEditBtns.length; e++) {
      sheetEditBtns[e].addEventListener("click", function () {
        var qId = this.getAttribute("data-q-id");
        switchAdminTab("tab-questions");
        openQuestionEditor(qId);
      });
    }
  }

  function renderAdminScoresTab() {
    var teamsBox = document.getElementById("admin-live-teams-scoreboard");
    var tHtml = "";
    var sorted = state.teams.map(function (t, idx) {
      return { team: t, idx: idx };
    }).sort(function (a, b) {
      return b.team.score - a.team.score;
    });

    var medals = ["🥇", "🥈", "🥉"];
    sorted.forEach(function (entry, rankIdx) {
      var t = entry.team;
      var medal = medals[rankIdx] || (rankIdx + 1) + "e";
      tHtml +=
        '<div class="team-rank-row" style="margin-bottom:10px;">' +
          '<div class="team-rank-left">' +
            '<span class="team-rank-medal">' + medal + '</span>' +
            '<span>' + (t.avatar || "🤾") + '</span>' +
            '<span class="team-rank-name">' + escapeHtml(t.name) + '</span>' +
          '</div>' +
          '<div class="team-rank-right">' +
            '<button type="button" class="btn-team-bonus admin-score-adj" data-idx="' + entry.idx + '" data-delta="-100">-100</button>' +
            '<span class="team-rank-pts">' + formatPoints(t.score) + ' pts</span>' +
            '<button type="button" class="btn-team-bonus admin-score-adj" data-idx="' + entry.idx + '" data-delta="100">+100</button>' +
          '</div>' +
        '</div>';
    });
    teamsBox.innerHTML = tHtml;

    var adjBtns = teamsBox.querySelectorAll(".admin-score-adj");
    for (var i = 0; i < adjBtns.length; i++) {
      adjBtns[i].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var delta = parseInt(this.getAttribute("data-delta"), 10);
        if (state.teams[idx]) {
          state.teams[idx].score = Math.max(0, state.teams[idx].score + delta);
          saveTeams();
          refreshAllUI();
        }
      });
    }

    var histBox = document.getElementById("admin-session-history-list");
    if (state.sessionHistory.length === 0) {
      histBox.innerHTML = '<p class="form-help-text">Aucune partie terminée pour le moment pendant cette session.</p>';
      return;
    }

    var hHtml = "";
    state.sessionHistory.forEach(function (item) {
      hHtml +=
        '<div class="history-card">' +
          '<div>' +
            '<div style="font-weight:900; color:#002b5c;">' + escapeHtml(item.quizTitle) + '</div>' +
            '<div style="font-size:0.84rem; color:#475569;">' + escapeHtml(item.participant) + ' • 🕒 ' + escapeHtml(item.time) + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-weight:900; color:#15803d; font-size:0.98rem;">' + escapeHtml(item.score) + '</div>' +
            '<div style="font-size:0.8rem; font-weight:800; color:#0055a4;">' + escapeHtml(item.percentage) + '</div>' +
          '</div>' +
        '</div>';
    });
    histBox.innerHTML = hHtml;
  }

  function handleLogoFileUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      state.customLogoDataUrl = evt.target.result;
      try {
        localStorage.setItem(STORAGE_KEYS.LOGO, state.customLogoDataUrl);
      } catch (err) {}
      renderLogos();
      showToast("🛡️ Logo officiel du Marseille Provence Handball intégré avec succès !");
    };
    reader.readAsDataURL(file);
  }

  function exportQuestionsAsJSONFile() {
    var payload = {
      club: "Marseille Provence Handball (MPHB)",
      event: "Stage Multisport de Noël — MPHB",
      exportedAt: new Date().toISOString(),
      categories: state.categories,
      questions: state.questions,
      quizzes: state.quizzes
    };
    downloadTextFile("mphb-quiz-handball.json", JSON.stringify(payload, null, 2), "application/json");
    showToast("📥 Fichier JSON exporté !");
  }

  function exportQuestionsAsJSFile() {
    var content =
      "/**\n" +
      " * BANQUE DE QUESTIONS & QUIZ — MARSEILLE PROVENCE HANDBALL (MPHB)\n" +
      " * Fichier généré depuis le Panel Admin du site\n" +
      " */\n\n" +
      "window.MPHB_CATEGORIES = " + JSON.stringify(state.categories, null, 2) + ";\n\n" +
      "window.INITIAL_QUESTIONS = " + JSON.stringify(state.questions, null, 2) + ";\n\n" +
      "window.INITIAL_QUIZZES = " + JSON.stringify(state.quizzes, null, 2) + ";\n";

    downloadTextFile("questions.js", content, "application/javascript");
    showToast("📥 Fichier questions.js téléchargé !");
  }

  function importQuestionsFromJSONFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      try {
        var data = JSON.parse(evt.target.result);
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          state.questions = data.questions;
          saveQuestions();
        }
        if (Array.isArray(data.quizzes) && data.quizzes.length > 0) {
          state.quizzes = data.quizzes;
          saveQuizzes();
        }
        refreshAllUI();
        showToast("✅ Importation réussie (" + state.questions.length + " questions, " + state.quizzes.length + " Quiz) !");
      } catch (err) {
        showToast("❌ Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // 12. UTILITAIRES
  // ==========================================================================
  function formatPoints(num) {
    var n = Math.round(Number(num) || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function downloadTextFile(filename, text, mimeType) {
    var blob = new Blob([text], { type: (mimeType || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  var toastTimeout = null;
  function showToast(message) {
    var toast = document.getElementById("toast-notification");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.classList.add("hidden");
    }, 3400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
