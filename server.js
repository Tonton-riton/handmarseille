/**
 * ============================================================================
 * SERVEUR WEB (COMPATIBLE RENDER / NODE.JS) — MARSEILLE PROVENCE HANDBALL
 * Sert les fichiers statiques du site et synchronise les manettes en direct.
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

// Clients connectés en temps réel (Server-Sent Events pour les manettes joueurs)
const sseClients = new Set();

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Healthcheck pour Render
  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", club: "Marseille Provence Handball" }));
    return;
  }

  // 2. Flux temps réel (SSE) pour synchroniser le Lobby PIN et les Manettes Joueurs entre appareils
  if (pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    res.write("data: {\"type\":\"CONNECTED\"}\n\n");
    sseClients.add(res);
    req.on("close", () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. Diffusion d'un événement (join / vote / reveal) vers tous les appareils connectés
  if (pathname === "/api/broadcast" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      const msg = `data: ${body}\n\n`;
      for (const client of sseClients) {
        try {
          client.write(msg);
        } catch (e) {}
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // 4. Servir les fichiers statiques du site
  let safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT_DIR, safePath));

  // Sécurité : empêcher de sortir du répertoire racine
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Accès refusé");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback SPA vers index.html
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
