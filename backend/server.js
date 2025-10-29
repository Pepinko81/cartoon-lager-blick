import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";
import regaleRoutes from "./routes/regale.js";
import faecherRoutes from "./routes/faecher.js";
import bilderRoutes from "./routes/bilder.js";
import authRoutes from "./routes/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// CORS nur für localhost erlauben
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

// Body-Parser für JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Route für Bilder
const bilderDir = path.join(__dirname, "bilder");
app.use("/bilder", express.static(bilderDir));

// Auth-Routen (unprotected)
app.use("/api", authRoutes);

// Geschützte API-Routen
app.use("/api/regale", regaleRoutes);
app.use("/api/regal", regaleRoutes); // POST /api/regal
app.use("/api/fach", faecherRoutes);
app.use("/api/bild", bilderRoutes);
app.use("/api/fach", bilderRoutes); // POST /api/fach/:id/bild

// Fehlerbehandlung für Multer-Upload-Fehler
app.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({
      nachricht: error.message || "Fehler beim Verarbeiten der Anfrage",
      fehler: true,
    });
  }
  
  next();
});

// Allgemeine Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error("Server-Fehler:", err);
  res.status(500).json({
    nachricht: "Interner Serverfehler",
    fehler: true,
  });
});

// Health-Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    nachricht: "Server läuft",
    status: "ok",
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
  console.log(`📦 Datenbank: ${path.join(__dirname, "lager.db")}`);
  console.log(`🖼️  Bilder-Verzeichnis: ${bilderDir}`);
});

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Server wird beendet...");
  db.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Server wird beendet...");
  db.close();
  process.exit(0);
});

