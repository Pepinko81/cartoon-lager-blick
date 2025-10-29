import express from "express";
import db from "../database.js";
import upload from "../middleware/upload.js";
import { authenticateToken } from "../middleware/auth.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST /api/fach/:id/bild - Bild hochladen
router.post("/:id/bild", authenticateToken, upload.single("bild"), (req, res) => {
  try {
    const fachId = parseInt(req.params.id);

    if (!req.file) {
      return res.status(400).json({
        nachricht: "Keine Bilddatei hochgeladen",
        fehler: true,
      });
    }

    // Prüfen ob Fach existiert
    const fach = db.prepare("SELECT id FROM faecher WHERE id = ?").get(fachId);
    if (!fach) {
      // Datei löschen falls Fach nicht existiert
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        nachricht: "Fach nicht gefunden",
        fehler: true,
      });
    }

    // Bild in Datenbank speichern
    const dateipfad = req.file.filename;
    const stmt = db.prepare("INSERT INTO bilder (fach_id, dateipfad) VALUES (?, ?)");
    const result = stmt.run(fachId, dateipfad);

    res.status(201).json({
      nachricht: "Bild erfolgreich hochgeladen",
      daten: {
        id: result.lastInsertRowid.toString(),
        dateipfad: `/bilder/${dateipfad}`,
      },
    });
  } catch (error) {
    console.error("Fehler beim Hochladen des Bildes:", error);
    
    // Datei löschen bei Fehler
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      nachricht: "Fehler beim Hochladen des Bildes",
      fehler: true,
    });
  }
});

// DELETE /api/bild/:id - Bild löschen
router.delete("/:id", authenticateToken, (req, res) => {
  try {
    const bildId = parseInt(req.params.id);

    // Bild aus Datenbank laden
    const bild = db.prepare("SELECT id, dateipfad FROM bilder WHERE id = ?").get(bildId);

    if (!bild) {
      return res.status(404).json({
        nachricht: "Bild nicht gefunden",
        fehler: true,
      });
    }

    // Datei löschen
    const dateipfad = path.join(__dirname, "..", "bilder", bild.dateipfad);
    if (fs.existsSync(dateipfad)) {
      fs.unlinkSync(dateipfad);
    }

    // Eintrag aus Datenbank löschen
    db.prepare("DELETE FROM bilder WHERE id = ?").run(bildId);

    res.json({
      nachricht: "Bild erfolgreich gelöscht",
      daten: {
        id: bildId.toString(),
      },
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Bildes:", error);
    res.status(500).json({
      nachricht: "Fehler beim Löschen des Bildes",
      fehler: true,
    });
  }
});

export default router;

