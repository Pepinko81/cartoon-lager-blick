import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";
import regaleRoutes from "./routes/regale.js";
import etagenRoutes from "./routes/etagen.js";
import faecherRoutes from "./routes/faecher.js";
import bilderRoutes from "./routes/bilder.js";
import authRoutes from "./routes/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

        // CORS für lager.local und IP-Adressen erlauben (für mobile Geräte)
        app.use(
          cors({
            origin: [
              "http://lager.local:3000", 
              "http://lager.local:5173", 
              "http://lager.local:8080",
              "http://192.168.178.57:3000",
              "http://192.168.178.57:5173", 
              "http://192.168.178.57:8080",
              "http://localhost:3000",
              "http://localhost:5173",
              "http://localhost:8080"
            ],
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
app.use("/api/regale", regaleRoutes); // GET /api/regale
app.use("/api/regal", regaleRoutes); // POST /api/regal, PUT /api/regal/:id, DELETE /api/regal/:id
app.use("/api/etage", etagenRoutes); // GET /api/etage/:id, POST /api/etage/:id/fach, PUT /api/etage/:id, DELETE /api/etage/:id
app.use("/api/fach", faecherRoutes); // PUT /api/fach/:id, DELETE /api/fach/:id
app.use("/api/fach", bilderRoutes); // POST /api/fach/:id/bild
app.use("/api/bild", bilderRoutes); // DELETE /api/bild/:id

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
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`🚀 Server läuft auf http://0.0.0.0:${PORT}`);
          console.log(`🌐 Erreichbar über:`);
          console.log(`   - http://localhost:${PORT}`);
          console.log(`   - http://lager.local:${PORT}`);
          console.log(`   - http://192.168.178.57:${PORT}`);
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

