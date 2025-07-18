// server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import session from "express-session";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import history from "connect-history-api-fallback";

import router from "./routes/index.js";
import alturaRoutes from "./routes/alturaRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Sesión, CORS, logs y parsers ─────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 86400000 },
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Rutas de API ────────────────────────────────────────────────────────────
app.use("/api", router);
app.use("/api/altura", alturaRoutes);

// ── History API Fallback (¡antes de los estáticos!) ─────────────────────────
app.use(
  history({
    verbose: true,
    rewrites: [
      // No reescribas nada de /api/
      { from: /^\/api\/.*$/, to: (context) => context.parsedUrl.path },
    ],
  })
);

// ── Sirve los archivos estáticos de tu build Vite ────────────────────────────
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// ── (Opcional) Fallback final: si algo escapa, devuelve index.html ─────────
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Middleware de errores ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 Error middleware:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Error interno del servidor",
  });
});

// ── Inicialización de la DB en producción (si no existe) ────────────────────
const dbPath = path.join(__dirname, "db.sqlite");
if (!fs.existsSync(dbPath) && process.env.NODE_ENV === "production") {
  const nodeCmd = `"${process.execPath}"`;
  const initCmd = `${nodeCmd} "${path.join(
    __dirname,
    "db/initDb.js"
  )}" && ${nodeCmd} "${path.join(__dirname, "db/seedDb.js")}"`;
  exec(initCmd, (err) => {
    if (err) console.error("❌ Error init DB:", err);
  });
}

// ── Carpeta de uploads ───────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Arranca el servidor ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
