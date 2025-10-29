import express from "express";
import db from "../database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// PUT /api/fach/:id - Fachname oder Beschreibung aktualisieren
router.put("/:id", authenticateToken, express.json(), (req, res) => {
  try {
    const fachId = parseInt(req.params.id);
    const { bezeichnung, beschreibung, name } = req.body;

    // Prüfen ob Fach existiert
    const fach = db.prepare("SELECT id FROM faecher WHERE id = ?").get(fachId);
    if (!fach) {
      return res.status(404).json({
        nachricht: "Fach nicht gefunden",
        fehler: true,
      });
    }

    // Aktualisieren (bezeichnung kann auch als "name" kommen vom Frontend)
    const neueBezeichnung = bezeichnung || name;
    let stmt;
    let params;

    if (neueBezeichnung && beschreibung !== undefined) {
      stmt = db.prepare("UPDATE faecher SET bezeichnung = ?, beschreibung = ? WHERE id = ?");
      params = [neueBezeichnung.trim(), beschreibung?.trim() || null, fachId];
    } else if (neueBezeichnung) {
      stmt = db.prepare("UPDATE faecher SET bezeichnung = ? WHERE id = ?");
      params = [neueBezeichnung.trim(), fachId];
    } else if (beschreibung !== undefined) {
      stmt = db.prepare("UPDATE faecher SET beschreibung = ? WHERE id = ?");
      params = [beschreibung?.trim() || null, fachId];
    } else {
      return res.status(400).json({
        nachricht: "Keine Daten zum Aktualisieren bereitgestellt",
        fehler: true,
      });
    }

    stmt.run(...params);

    res.json({
      nachricht: "Fach erfolgreich aktualisiert",
      daten: {
        id: fachId.toString(),
      },
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fachs:", error);
    res.status(500).json({
      nachricht: "Fehler beim Aktualisieren des Fachs",
      fehler: true,
    });
  }
});

// DELETE /api/fach/:id - Fach löschen (inkl. alle Bilder)
router.delete("/:id", authenticateToken, (req, res) => {
  try {
    const fachId = parseInt(req.params.id);

    // Prüfen ob Fach existiert
    const fach = db.prepare("SELECT id FROM faecher WHERE id = ?").get(fachId);
    if (!fach) {
      return res.status(404).json({
        nachricht: "Fach nicht gefunden",
        fehler: true,
      });
    }

    // Alle Bilder für dieses Fach löschen (Dateien werden später bereinigt)
    db.prepare("DELETE FROM bilder WHERE fach_id = ?").run(fachId);

    // Fach löschen
    db.prepare("DELETE FROM faecher WHERE id = ?").run(fachId);

    res.json({
      nachricht: "Fach erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Fachs:", error);
    res.status(500).json({
      nachricht: "Fehler beim Löschen des Fachs",
      fehler: true,
    });
  }
});

export default router;

