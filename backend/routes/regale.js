import express from "express";
import db from "../database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/regale - Alle Regale mit Fächern und Bildern laden
router.get("/", authenticateToken, (req, res) => {
  try {
    // Alle Regale laden
    const regale = db
      .prepare("SELECT id, name, beschreibung FROM regale ORDER BY id")
      .all();

    // Für jedes Regal die Fächer laden
    const regaleMitFaechern = regale.map((regal) => {
      // Fächer für dieses Regal laden
      const faecher = db
        .prepare(
          "SELECT id, bezeichnung, beschreibung FROM faecher WHERE regal_id = ? ORDER BY id"
        )
        .all(regal.id);

      // Für jedes Fach die Bilder laden
      const faecherMitBildern = faecher.map((fach) => {
        const bilder = db
          .prepare("SELECT id, dateipfad FROM bilder WHERE fach_id = ? ORDER BY datum_erstellt")
          .all(fach.id);

        return {
          id: fach.id.toString(),
          name: fach.bezeichnung,
          description: fach.beschreibung || undefined,
          rackId: regal.id.toString(),
          images: bilder.map((bild) => ({
            id: bild.id.toString(),
            url: `http://localhost:5000/bilder/${bild.dateipfad.split("/").pop()}`,
          })),
        };
      });

      return {
        id: regal.id.toString(),
        name: regal.name,
        description: regal.beschreibung || undefined,
        slots: faecherMitBildern,
      };
    });

    res.json(regaleMitFaechern);
  } catch (error) {
    console.error("Fehler beim Laden der Regale:", error);
    res.status(500).json({
      nachricht: "Fehler beim Laden der Regale",
      fehler: true,
    });
  }
});

// POST /api/regal - Neues Regal hinzufügen
router.post("/", authenticateToken, express.json(), (req, res) => {
  try {
    const { name, beschreibung, description, slotCount } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        nachricht: "Regalname ist erforderlich",
        fehler: true,
      });
    }

    const beschreibungText = beschreibung || description || null;
    const anzahlFaecher = slotCount && slotCount > 0 ? parseInt(slotCount) : 10;

    // Transaction starten
    const insertRegal = db.prepare("INSERT INTO regale (name, beschreibung) VALUES (?, ?)");
    const insertFach = db.prepare(
      "INSERT INTO faecher (regal_id, bezeichnung) VALUES (?, ?)"
    );

    const insertMany = db.transaction((regalData) => {
      // Regal einfügen
      const result = insertRegal.run(regalData.name, regalData.beschreibung || null);
      const regalId = result.lastInsertRowid;

      // Fächer automatisch erstellen
      for (let i = 1; i <= anzahlFaecher; i++) {
        insertFach.run(regalId, `F${i}`);
      }

      return regalId;
    });

    const regalId = insertMany({ name: name.trim(), beschreibung: beschreibungText?.trim() || null });

    res.status(201).json({
      nachricht: `Neues Regal erfolgreich erstellt mit ${anzahlFaecher} Fächern.`,
      daten: {
        id: regalId.toString(),
        name: name.trim(),
        beschreibung: beschreibungText?.trim() || null,
      },
    });
  } catch (error) {
    console.error("Fehler beim Erstellen des Regals:", error);
    res.status(500).json({
      nachricht: "Fehler beim Erstellen des Regals",
      fehler: true,
    });
  }
});

// PUT /api/regal/:id - Regal aktualisieren
router.put("/:id", authenticateToken, express.json(), (req, res) => {
  try {
    const regalId = parseInt(req.params.id);
    const { name, beschreibung, description } = req.body;

    // Prüfen ob Regal existiert
    const regal = db.prepare("SELECT id FROM regale WHERE id = ?").get(regalId);
    if (!regal) {
      return res.status(404).json({
        nachricht: "Regal nicht gefunden",
        fehler: true,
      });
    }

    const beschreibungText = beschreibung || description || null;
    let stmt;
    let params;

    if (name && beschreibungText !== undefined) {
      stmt = db.prepare("UPDATE regale SET name = ?, beschreibung = ? WHERE id = ?");
      params = [name.trim(), beschreibungText?.trim() || null, regalId];
    } else if (name) {
      stmt = db.prepare("UPDATE regale SET name = ? WHERE id = ?");
      params = [name.trim(), regalId];
    } else if (beschreibungText !== undefined) {
      stmt = db.prepare("UPDATE regale SET beschreibung = ? WHERE id = ?");
      params = [beschreibungText?.trim() || null, regalId];
    } else {
      return res.status(400).json({
        nachricht: "Keine Daten zum Aktualisieren bereitgestellt",
        fehler: true,
      });
    }

    stmt.run(...params);

    res.json({
      nachricht: "Regal erfolgreich aktualisiert",
      daten: {
        id: regalId.toString(),
        name: name || regal.name,
        beschreibung: beschreibungText,
      },
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Regals:", error);
    res.status(500).json({
      nachricht: "Fehler beim Aktualisieren des Regals",
      fehler: true,
    });
  }
});

// DELETE /api/regal/:id - Regal löschen (inkl. alle Fächer und Bilder)
router.delete("/:id", authenticateToken, (req, res) => {
  try {
    const regalId = parseInt(req.params.id);

    // Prüfen ob Regal existiert
    const regal = db.prepare("SELECT id FROM regale WHERE id = ?").get(regalId);
    if (!regal) {
      return res.status(404).json({
        nachricht: "Regal nicht gefunden",
        fehler: true,
      });
    }

    // Alle Fächer für dieses Regal laden
    const faecher = db.prepare("SELECT id FROM faecher WHERE regal_id = ?").all(regalId);
    const fachIds = faecher.map((f) => f.id);

    // Alle Bilder für diese Fächer löschen (Dateien werden später bereinigt)
    if (fachIds.length > 0) {
      const placeholders = fachIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM bilder WHERE fach_id IN (${placeholders})`).run(...fachIds);
    }

    // Alle Fächer löschen
    db.prepare("DELETE FROM faecher WHERE regal_id = ?").run(regalId);

    // Regal löschen
    db.prepare("DELETE FROM regale WHERE id = ?").run(regalId);

    res.json({
      nachricht: "Regal erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Regals:", error);
    res.status(500).json({
      nachricht: "Fehler beim Löschen des Regals",
      fehler: true,
    });
  }
});

export default router;

