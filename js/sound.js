/**
 * ============================================================================
 * MOTEUR AUDIO STYLE KAHOOT! (Web Audio API — 100% Hors-Ligne)
 * Musique de Lobby Kahoot, rythme de compte à rebours, Gong de révélation,
 * Sifflet d'arbitre, Jingle de série (Streak) et Fanfare de Podium !
 * ============================================================================
 */

window.MPHB_SOUND = (function () {
  var ctx = null;
  var enabled = true;
  var musicEnabled = true;
  var bgLoopInterval = null;
  var bgMode = null; // "lobby" | "question" | null
  var stepCounter = 0;

  try {
    var saved = localStorage.getItem("mphb_sound_enabled");
    if (saved !== null) enabled = saved === "true";
    var savedMus = localStorage.getItem("mphb_music_enabled");
    if (savedMus !== null) musicEnabled = savedMus === "true";
  } catch (e) {}

  function getContext() {
    if (!enabled) return null;
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freq, type, duration, startTimeOffset, gainValue) {
    var audio = getContext();
    if (!audio) return;
    var now = audio.currentTime + (startTimeOffset || 0);
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, now);

    var maxGain = gainValue || 0.12;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(maxGain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Basse + Mélodie funky inspirée de l'ambiance Kahoot!
  var LOBBY_NOTES = [
    261.63, 0, 329.63, 392.00, 440.00, 0, 392.00, 329.63,
    293.66, 0, 349.23, 440.00, 392.00, 0, 329.63, 261.63
  ];

  var QUESTION_NOTES = [
    220.00, 261.63, 329.63, 261.63, 246.94, 293.66, 369.99, 293.66,
    261.63, 329.63, 392.00, 329.63, 293.66, 369.99, 440.00, 392.00
  ];

  function startMusicLoop(mode) {
    stopMusicLoop();
    if (!enabled || !musicEnabled) return;
    bgMode = mode;
    stepCounter = 0;

    var tempoMs = mode === "lobby" ? 230 : 210;
    bgLoopInterval = setInterval(function () {
      if (!enabled || !musicEnabled) {
        stopMusicLoop();
        return;
      }
      var list = bgMode === "lobby" ? LOBBY_NOTES : QUESTION_NOTES;
      var note = list[stepCounter % list.length];
      if (note > 0) {
        playTone(note, bgMode === "lobby" ? "triangle" : "sine", 0.14, 0, 0.045);
        if (stepCounter % 4 === 0) {
          playTone(note * 0.5, "triangle", 0.18, 0, 0.055);
        }
      }
      stepCounter++;
    }, tempoMs);
  }

  function stopMusicLoop() {
    if (bgLoopInterval) {
      clearInterval(bgLoopInterval);
      bgLoopInterval = null;
    }
    bgMode = null;
  }

  return {
    isEnabled: function () {
      return enabled;
    },

    isMusicEnabled: function () {
      return musicEnabled;
    },

    setEnabled: function (val) {
      enabled = !!val;
      if (!enabled) stopMusicLoop();
      try {
        localStorage.setItem("mphb_sound_enabled", enabled ? "true" : "false");
      } catch (e) {}
      if (enabled) this.playClick();
    },

    toggle: function () {
      this.setEnabled(!enabled);
      return enabled;
    },

    toggleMusic: function () {
      musicEnabled = !musicEnabled;
      try {
        localStorage.setItem("mphb_music_enabled", musicEnabled ? "true" : "false");
      } catch (e) {}
      if (!musicEnabled) {
        stopMusicLoop();
      }
      return musicEnabled;
    },

    startLobbyMusic: function () {
      startMusicLoop("lobby");
    },

    startQuestionMusic: function () {
      startMusicLoop("question");
    },

    stopMusic: function () {
      stopMusicLoop();
    },

    playClick: function () {
      playTone(640, "sine", 0.05, 0, 0.08);
    },

    // Son quand un joueur rejoint le Lobby Kahoot
    playPlayerJoin: function () {
      playTone(523.25, "triangle", 0.09, 0.0, 0.12);
      playTone(783.99, "triangle", 0.14, 0.08, 0.14);
    },

    // Compte à rebours 3 - 2 - 1 - GO!
    playCountdownBeep: function (isGo) {
      if (isGo) {
        playTone(880, "triangle", 0.28, 0, 0.18);
        playTone(1174.66, "triangle", 0.32, 0.05, 0.15);
      } else {
        playTone(440, "triangle", 0.14, 0, 0.14);
      }
    },

    // Coup de sifflet d'arbitre handball
    playWhistle: function () {
      for (var i = 0; i < 6; i++) {
        var freq = i % 2 === 0 ? 2750 : 2920;
        playTone(freq, "triangle", 0.055, i * 0.045, 0.09);
      }
    },

    // Gong Kahoot quand tout le monde a répondu ou que le temps est fini
    playGongReveal: function () {
      stopMusicLoop();
      playTone(196.00, "triangle", 0.55, 0, 0.22);
      playTone(392.00, "sine", 0.45, 0.02, 0.15);
      playTone(587.33, "sine", 0.35, 0.05, 0.12);
    },

    // Bonne réponse Kahoot !
    playCorrect: function () {
      stopMusicLoop();
      playTone(523.25, "triangle", 0.11, 0.0, 0.16);
      playTone(659.25, "triangle", 0.11, 0.08, 0.16);
      playTone(783.99, "triangle", 0.13, 0.16, 0.17);
      playTone(1046.5, "triangle", 0.32, 0.24, 0.20);
    },

    // Mauvaise réponse bienveillante
    playWrong: function () {
      stopMusicLoop();
      playTone(349.23, "sine", 0.16, 0.0, 0.13);
      playTone(293.66, "sine", 0.28, 0.14, 0.13);
    },

    // Tic-tac de fin de chrono
    playTick: function (urgent) {
      playTone(urgent ? 920 : 560, "sine", 0.045, 0, urgent ? 0.12 : 0.05);
    },

    // Montée du classement Scoreboard
    playScoreboardClimb: function () {
      var freqs = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99];
      freqs.forEach(function (f, i) {
        playTone(f, "triangle", 0.09, i * 0.06, 0.11);
      });
    },

    // Fanfare festive du Podium Kahoot
    playVictory: function () {
      stopMusicLoop();
      var notes = [
        { f: 523.25, d: 0.14, t: 0.0 },
        { f: 659.25, d: 0.14, t: 0.14 },
        { f: 783.99, d: 0.14, t: 0.28 },
        { f: 1046.5, d: 0.28, t: 0.42 },
        { f: 783.99, d: 0.14, t: 0.72 },
        { f: 1046.5, d: 0.50, t: 0.88 }
      ];
      notes.forEach(function (n) {
        playTone(n.f, "triangle", n.d, n.t, 0.18);
      });
    }
  };
})();
