/**
 * ============================================================================
 * SERVEUR WEB & MULTIJOUEUR TEMPS RÉEL (COMPATIBLE RENDER / NODE.JS)
 * Marseille Provence Handball (MPHB) — Le Grand Quiz du Handball
 * Gère la Salle d'Attente (Lobby PIN), les Manettes Joueurs et les Votes Live.
 * Aucune dépendance externe requise (100% modules natifs Node.js).
 * ============================================================================
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

// État de la salle multijoueur en mémoire sur le serveur
let liveRoom = {
  pin: "482 915",
  phase: "lobby", // "lobby" | "countdown" | "question" | "reveal" | "scoreboard" | "podium"
  quizTitle: "🎄 Le Grand Quiz de Noël MPHB",
  qNum: 1,
  totalQuestions: 12,
  timerSeconds: 20,
  isDoublePoints: false,
  correctIndex: null,
  participants: [] // [{ id, name, avatar, score, streak, lastDelta, prevRank, rank, color }]
};

const sseClients = new Set();

function broadcastToAll(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch (e) {}
  }
}

function readJsonBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });
  req.on("end", () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (err) {
      callback(err, null);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Healthcheck pour Render
  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", club: "Marseille Provence Handball" }));
    return;
  }

  // 2. Récupérer l'état actuel de la salle d'attente / partie
  if (pathname === "/api/room" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify(liveRoom));
    return;
  }

  // 3. Flux temps réel (SSE) pour synchroniser l'écran Animateur et tous les Participants
  if (pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    res.write(`data: ${JSON.stringify({ type: "ROOM_SYNC", room: liveRoom })}\n\n`);
    sseClients.add(res);
    req.on("close", () => {
      sseClients.delete(res);
    });
    return;
  }

  // 4. Diffusion et mise à jour d'événements temps réel (Host <-> Participants)
  if (pathname === "/api/broadcast" && req.method === "POST") {
    readJsonBody(req, (err, payload) => {
      if (err || !payload) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false }));
        return;
      }

      // Synchroniser l'état serveur selon l'événement
      if (payload.type === "HOST_OPEN_LOBBY") {
        liveRoom.pin = payload.pin || liveRoom.pin;
        liveRoom.phase = "lobby";
        liveRoom.quizTitle = payload.quizTitle || liveRoom.quizTitle;
        if (Array.isArray(payload.participants)) {
          liveRoom.participants = payload.participants;
        }
      } else if (payload.type === "HOST_SYNC_PARTICIPANTS") {
        if (payload.pin) liveRoom.pin = payload.pin;
        if (Array.isArray(payload.participants)) {
          liveRoom.participants = payload.participants;
        }
      } else if (payload.type === "PLAYER_JOINED" && payload.team) {
        const exists = liveRoom.participants.find(
          (p) => p.id === payload.team.id || p.name.toLowerCase() === payload.team.name.toLowerCase()
        );
        if (!exists) {
          liveRoom.participants.push(payload.team);
        }
      } else if (payload.type === "HOST_COUNTDOWN") {
        liveRoom.phase = "countdown";
        liveRoom.qNum = payload.qNum || 1;
        liveRoom.totalQuestions = payload.total || 12;
        liveRoom.isDoublePoints = !!payload.isDoublePoints;
      } else if (payload.type === "HOST_NEW_QUESTION") {
        liveRoom.phase = "question";
        liveRoom.qNum = payload.qNum || 1;
        liveRoom.totalQuestions = payload.total || 12;
        liveRoom.timerSeconds = payload.timerSeconds || 20;
        liveRoom.isDoublePoints = !!payload.isDoublePoints;
        liveRoom.correctIndex = null;
      } else if (payload.type === "HOST_REVEAL") {
        liveRoom.phase = "reveal";
        liveRoom.correctIndex = payload.correctIndex;
        if (Array.isArray(payload.teams)) {
          liveRoom.participants = payload.teams;
        }
      } else if (payload.type === "HOST_SCOREBOARD") {
        liveRoom.phase = "scoreboard";
        if (Array.isArray(payload.teams)) {
          liveRoom.participants = payload.teams;
        }
      } else if (payload.type === "HOST_PODIUM") {
        liveRoom.phase = "podium";
        if (Array.isArray(payload.teams)) {
          liveRoom.participants = payload.teams;
        }
      }

      broadcastToAll(payload);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, room: liveRoom }));
    });
    return;
  }

  // 5. Servir les fichiers statiques du site
  let safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT_DIR, safePath));

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Accès refusé");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexFile = path.join(ROOT_DIR, "index.html");
      fs.readFile(indexFile, (indexErr, content) => {
        if (indexErr) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Fichier introuvable");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Erreur serveur");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur Marseille Provence Handball démarré sur le port ${PORT}`);
});
