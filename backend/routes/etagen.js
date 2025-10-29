import express from "express";
import db from "../database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/etage/:id - Einzelne Etage mit Fächern laden
router.get("/:id", authenticateToken, (req, res) => {
  try {
    const etageId = parseInt(req.params.id);

    // Etage laden
    const etage = db
      .prepare("SELECT id, regal_id, nummer, name FROM etagen WHERE id = ?")
      .get(etageId);

    if (!etage) {
      return res.status(404).json({
        nachricht: "Etage nicht gefunden",
        fehler: true,
      });
    }

    // Fächer für diese Etage laden
    const faecher = db
      .prepare(
        "SELECT id, bezeichnung, beschreibung FROM faecher WHERE etage_id = ? ORDER BY id"
      )
      .all(etageId);

    // Für jedes Fach die Bilder laden
    const faecherMitBildern = faecher.map((fach) => {
      const bilder = db
        .prepare("SELECT id, dateipfad FROM bilder WHERE fach_id = ? ORDER BY datum_erstellt")
        .all(fach.id);

      return {
        id: fach.id.toString(),
        bezeichnung: fach.bezeichnung,
        beschreibung: fach.beschreibung || undefined,
        bilder: bilder.map((bild) => ({
          id: bild.id.toString(),
          url: `http://lager.local:5000/bilder/${bild.dateipfad.split("/").pop()}`,
        })),
      };
    });

    res.json({
      id: etage.id.toString(),
      regal_id: etage.regal_id.toString(),
      nummer: etage.nummer,
      name: etage.name || undefined,
      faecher: faecherMitBildern,
    });
  } catch (error) {
    console.error("Fehler beim Laden der Etage:", error);
    res.status(500).json({
      nachricht: "Fehler beim Laden der Etage",
      fehler: true,
    });
  }
});

// POST /api/etage/:id/fach - Neues Fach in Etage erstellen
router.post("/:id/fach", authenticateToken, express.json(), (req, res) => {
  try {
    const etageId = parseInt(req.params.id);
    const { bezeichnung, beschreibung } = req.body;

    // Prüfen ob Etage existiert
    const etage = db.prepare("SELECT id FROM etagen WHERE id = ?").get(etageId);
    if (!etage) {
      return res.status(404).json({
        nachricht: "Etage nicht gefunden",
        fehler: true,
      });
    }

    if (!bezeichnung || !bezeichnung.trim()) {
      return res.status(400).json({
        nachricht: "Fachbezeichnung ist erforderlich",
        fehler: true,
      });
    }

    // Fach erstellen
    const stmt = db.prepare(
      "INSERT INTO faecher (etage_id, bezeichnung, beschreibung) VALUES (?, ?, ?)"
    );
    const result = stmt.run(
      etageId,
      bezeichnung.trim(),
      beschreibung?.trim() || null
    );

    res.status(201).json({
      nachricht: "Fach erfolgreich erstellt",
      daten: {
        id: result.lastInsertRowid.toString(),
        bezeichnung: bezeichnung.trim(),
        beschreibung: beschreibung?.trim() || null,
      },
    });
  } catch (error) {
    console.error("Fehler beim Erstellen des Fachs:", error);
    res.status(500).json({
      nachricht: "Fehler beim Erstellen des Fachs",
      fehler: true,
    });
  }
});

// PUT /api/etage/:id - Etage aktualisieren
router.put("/:id", authenticateToken, express.json(), (req, res) => {
  try {
    const etageId = parseInt(req.params.id);
    const { nummer, name } = req.body;

    // Prüfen ob Etage existiert
    const etage = db
      .prepare("SELECT id, regal_id, nummer FROM etagen WHERE id = ?")
      .get(etageId);
    if (!etage) {
      return res.status(404).json({
        nachricht: "Etage nicht gefunden",
        fehler: true,
      });
    }

    // Wenn Nummer geändert wird, prüfe Eindeutigkeit
    if (nummer !== undefined && nummer !== etage.nummer) {
      const nummerExists = db
        .prepare("SELECT id FROM etagen WHERE regal_id = ? AND nummer = ? AND id != ?")
        .get(etage.regal_id, nummer, etageId);
      if (nummerExists) {
        return res.status(400).json({
          nachricht: "Eine Etage mit dieser Nummer existiert bereits für dieses Regal",
          fehler: true,
        });
      }
    }

    // Update durchführen
    let stmt;
    let params;

    if (nummer !== undefined && name !== undefined) {
      stmt = db.prepare("UPDATE etagen SET nummer = ?, name = ? WHERE id = ?");
      params = [nummer, name?.trim() || null, etageId];
    } else if (nummer !== undefined) {
      stmt = db.prepare("UPDATE etagen SET nummer = ? WHERE id = ?");
      params = [nummer, etageId];
    } else if (name !== undefined) {
      stmt = db.prepare("UPDATE etagen SET name = ? WHERE id = ?");
      params = [name?.trim() || null, etageId];
    } else {
      return res.status(400).json({
        nachricht: "Keine Daten zum Aktualisieren bereitgestellt",
        fehler: true,
      });
    }

    stmt.run(...params);

    res.json({
      nachricht: "Etage erfolgreich aktualisiert",
      daten: {
        id: etageId.toString(),
        nummer: nummer !== undefined ? nummer : etage.nummer,
        name: name !== undefined ? (name?.trim() || null) : etage.name,
      },
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Etage:", error);
    res.status(500).json({
      nachricht: "Fehler beim Aktualisieren der Etage",
      fehler: true,
    });
  }
});

// DELETE /api/etage/:id - Etage löschen (cascade zu Fächern und Bildern)
router.delete("/:id", authenticateToken, (req, res) => {
  try {
    const etageId = parseInt(req.params.id);

    // Prüfen ob Etage existiert
    const etage = db.prepare("SELECT id FROM etagen WHERE id = ?").get(etageId);
    if (!etage) {
      return res.status(404).json({
        nachricht: "Etage nicht gefunden",
        fehler: true,
      });
    }

    // Alle Fächer für diese Etage laden
    const faecher = db.prepare("SELECT id FROM faecher WHERE etage_id = ?").all(etageId);
    const fachIds = faecher.map((f) => f.id);

    // Alle Bilder für diese Fächer löschen
    if (fachIds.length > 0) {
      const placeholders = fachIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM bilder WHERE fach_id IN (${placeholders})`).run(...fachIds);
    }

    // Alle Fächer löschen (wird durch CASCADE automatisch gemacht, aber explizit für Klarheit)
    db.prepare("DELETE FROM faecher WHERE etage_id = ?").run(etageId);

    // Etage löschen
    db.prepare("DELETE FROM etagen WHERE id = ?").run(etageId);

    res.json({
      nachricht: "Etage erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen der Etage:", error);
    res.status(500).json({
      nachricht: "Fehler beim Löschen der Etage",
      fehler: true,
    });
  }
});

export default router;

