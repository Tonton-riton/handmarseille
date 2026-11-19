/**
 * ============================================================================
 * MOTEUR DE CONFETTIS & NEIGE DE NOËL (HTML5 Canvas — 100% Hors-Ligne)
 * ============================================================================
 */

window.MPHB_FX = (function () {
  var canvas = null;
  var ctx = null;
  var confettiParticles = [];
  var snowParticles = [];
  var animFrame = null;
  var snowEnabled = true;

  var MPHB_COLORS = [
    "#0055A4", // Bleu MPHB
    "#FFD100", // Jaune Provence
    "#FFFFFF", // Blanc
    "#E63946", // Rouge Noël / Important
    "#38BDF8", // Bleu ciel
    "#16A34A"  // Vert sapin / victoire
  ];

  try {
    var savedSnow = localStorage.getItem("mphb_snow_enabled");
    if (savedSnow !== null) {
      snowEnabled = savedSnow === "true";
    }
  } catch (e) {}

  function initCanvas() {
    if (canvas) return;
    canvas = document.getElementById("fx-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    initSnow();
    startLoop();
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initSnow() {
    snowParticles = [];
    var count = Math.min(42, Math.floor(window.innerWidth / 32));
    for (var i = 0; i < count; i++) {
      snowParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2.8 + 1.2,
        speedY: Math.random() * 0.75 + 0.35,
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.45 + 0.18
      });
    }
  }

  function startLoop() {
    if (animFrame) return;
    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Flocons de neige de Noël en arrière-plan
      if (snowEnabled) {
        for (var s = 0; s < snowParticles.length; s++) {
          var fl = snowParticles[s];
          fl.y += fl.speedY;
          fl.x += fl.speedX + Math.sin(fl.y * 0.015) * 0.25;
          if (fl.y > canvas.height + 10) {
            fl.y = -10;
            fl.x = Math.random() * canvas.width;
          }
          if (fl.x > canvas.width + 10) fl.x = -10;
          if (fl.x < -10) fl.x = canvas.width + 10;

          ctx.beginPath();
          ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, " + fl.opacity + ")";
          ctx.fill();
        }
      }

      // Confettis de victoire
      for (var i = confettiParticles.length - 1; i >= 0; i--) {
        var p = confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.fade;

        if (p.opacity <= 0 || p.y > canvas.height + 40) {
          confettiParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        }
        ctx.restore();
      }

      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  return {
    init: initCanvas,

    isSnowEnabled: function () {
      return snowEnabled;
    },

    setSnowEnabled: function (val) {
      snowEnabled = !!val;
      try {
        localStorage.setItem("mphb_snow_enabled", snowEnabled ? "true" : "false");
      } catch (e) {}
    },

    toggleSnow: function () {
      this.setSnowEnabled(!snowEnabled);
      return snowEnabled;
    },

    // Petit jet de confettis lors d'une bonne réponse
    burstMini: function () {
      initCanvas();
      if (!canvas) return;
      var cx = canvas.width * 0.5;
      var cy = canvas.height * 0.38;
      for (var i = 0; i < 48; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = Math.random() * 8 + 3;
        confettiParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3.5,
          gravity: 0.22,
          size: Math.random() * 8 + 6,
          color: MPHB_COLORS[Math.floor(Math.random() * MPHB_COLORS.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          fade: 0.011,
          shape: Math.random() > 0.35 ? "rect" : "circle"
        });
      }
    },

    // Grande explosion festive de confettis pour l'écran final
    burstVictory: function () {
      initCanvas();
      if (!canvas) return;
      var waves = [0, 350, 750];
      waves.forEach(function (delay) {
        setTimeout(function () {
          if (!canvas) return;
          var origins = [
            { x: canvas.width * 0.2, y: canvas.height * 0.55 },
            { x: canvas.width * 0.5, y: canvas.height * 0.35 },
            { x: canvas.width * 0.8, y: canvas.height * 0.55 }
          ];
          origins.forEach(function (origin) {
            for (var i = 0; i < 45; i++) {
              var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
              var speed = Math.random() * 11 + 4;
              confettiParticles.push({
                x: origin.x,
                y: origin.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.18,
                size: Math.random() * 10 + 6,
                color: MPHB_COLORS[Math.floor(Math.random() * MPHB_COLORS.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 14,
                opacity: 1,
                fade: 0.006,
                shape: Math.random() > 0.3 ? "rect" : "circle"
              });
            }
          });
        }, delay);
      });
    }
  };
})();
