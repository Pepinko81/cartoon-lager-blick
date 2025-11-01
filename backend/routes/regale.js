import express from "express";
import db from "../database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/regale - Alle Regale mit Etagen, Fächern und Bildern laden
router.get("/", authenticateToken, (req, res) => {
  try {
    // Alle Regale laden
    const regale = db
      .prepare("SELECT id, name, beschreibung, position_x, position_y, rotation FROM regale ORDER BY id")
      .all();

    // Für jedes Regal die Etagen laden
    const regaleMitEtagen = regale.map((regal) => {
      // Etagen für dieses Regal laden
      const etagen = db
        .prepare(
          "SELECT id, nummer, name FROM etagen WHERE regal_id = ? ORDER BY nummer"
        )
        .all(regal.id);

      // Für jede Etage die Fächer laden
      const etagenMitFaechern = etagen.map((etage) => {
        // Fächer für diese Etage laden
        const faecher = db
          .prepare(
            "SELECT id, bezeichnung, beschreibung FROM faecher WHERE etage_id = ? ORDER BY id"
          )
          .all(etage.id);

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

        return {
          id: etage.id.toString(),
          nummer: etage.nummer,
          name: etage.name || undefined,
          faecher: faecherMitBildern,
        };
      });

        return {
          id: regal.id.toString(),
          name: regal.name,
          description: regal.beschreibung || undefined,
          position_x: regal.position_x ?? undefined,
          position_y: regal.position_y ?? undefined,
          rotation: regal.rotation ?? 0,
          etagen: etagenMitFaechern,
        };
    });

    res.json(regaleMitEtagen);
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
    const { name, beschreibung, description, anzahl_etagen, slotCount } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        nachricht: "Regalname ist erforderlich",
        fehler: true,
      });
    }

    const beschreibungText = beschreibung || description || null;
    const anzahlEtagen = anzahl_etagen && anzahl_etagen > 0 ? parseInt(anzahl_etagen) : 1;
    const anzahlFaecherProEtage = slotCount && slotCount > 0 ? parseInt(slotCount) : 3;

    // Transaction starten
    const insertRegal = db.prepare("INSERT INTO regale (name, beschreibung) VALUES (?, ?)");
    const insertEtage = db.prepare(
      "INSERT INTO etagen (regal_id, nummer, name) VALUES (?, ?, ?)"
    );
    const insertFach = db.prepare(
      "INSERT INTO faecher (etage_id, bezeichnung) VALUES (?, ?)"
    );

    const insertMany = db.transaction((regalData) => {
      // Regal einfügen
      const result = insertRegal.run(regalData.name, regalData.beschreibung || null);
      const regalId = result.lastInsertRowid;

      // Etagen erstellen
      for (let e = 1; e <= anzahlEtagen; e++) {
        const etageResult = insertEtage.run(regalId, e, `Etage ${e}`);
        const etageId = etageResult.lastInsertRowid;

        // Fächer pro Etage erstellen
        for (let f = 1; f <= anzahlFaecherProEtage; f++) {
          insertFach.run(etageId, `E${e}-F${f}`);
        }
      }

      return { regalId, anzahlEtagen, anzahlFaecherProEtage };
    });

    const { regalId, anzahlEtagen: createdEtagen, anzahlFaecherProEtage: createdFaecher } = insertMany({
      name: name.trim(),
      beschreibung: beschreibungText?.trim() || null,
    });

    const gesamtFaecher = createdEtagen * createdFaecher;

    res.status(201).json({
      nachricht: `Neues Regal erfolgreich erstellt mit ${createdEtagen} Etagen und ${gesamtFaecher} Fächern.`,
      daten: {
        id: regalId.toString(),
        name: name.trim(),
        beschreibung: beschreibungText?.trim() || null,
        anzahl_etagen: createdEtagen,
        anzahl_faecher_pro_etage: createdFaecher,
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
    const { name, beschreibung, description, position_x, position_y, rotation } = req.body;

    // Prüfen ob Regal existiert
    const regal = db.prepare("SELECT id, name, beschreibung FROM regale WHERE id = ?").get(regalId);
    if (!regal) {
      return res.status(404).json({
        nachricht: "Regal nicht gefunden",
        fehler: true,
      });
    }

    const beschreibungText = beschreibung || description;
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (beschreibungText !== undefined) {
      updates.push("beschreibung = ?");
      params.push(beschreibungText?.trim() || null);
    }
    if (position_x !== undefined) {
      updates.push("position_x = ?");
      params.push(position_x === null ? null : parseFloat(position_x));
    }
    if (position_y !== undefined) {
      updates.push("position_y = ?");
      params.push(position_y === null ? null : parseFloat(position_y));
    }
    if (rotation !== undefined) {
      updates.push("rotation = ?");
      params.push(rotation === null ? null : parseFloat(rotation));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        nachricht: "Keine Daten zum Aktualisieren bereitgestellt",
        fehler: true,
      });
    }

    params.push(regalId);
    const stmt = db.prepare(`UPDATE regale SET ${updates.join(", ")} WHERE id = ?`);
    stmt.run(...params);

    // Updated regal data for response
    const updatedRegal = db.prepare("SELECT id, name, beschreibung, position_x, position_y, rotation FROM regale WHERE id = ?").get(regalId);

    res.json({
      nachricht: "Regal erfolgreich aktualisiert",
      daten: {
        id: regalId.toString(),
        name: updatedRegal.name,
        beschreibung: updatedRegal.beschreibung || undefined,
        position_x: updatedRegal.position_x ?? undefined,
        position_y: updatedRegal.position_y ?? undefined,
        rotation: updatedRegal.rotation ?? 0,
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

    // Alle Etagen für dieses Regal laden
    const etagen = db.prepare("SELECT id FROM etagen WHERE regal_id = ?").all(regalId);
    const etageIds = etagen.map((e) => e.id);

    // Für jede Etage: Alle Fächer laden
    let fachIds = [];
    if (etageIds.length > 0) {
      const placeholders = etageIds.map(() => "?").join(",");
      const faecher = db
        .prepare(`SELECT id FROM faecher WHERE etage_id IN (${placeholders})`)
        .all(...etageIds);
      fachIds = faecher.map((f) => f.id);
    }

    // Alle Bilder für diese Fächer löschen (Dateien werden später bereinigt)
    if (fachIds.length > 0) {
      const placeholders = fachIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM bilder WHERE fach_id IN (${placeholders})`).run(...fachIds);
    }

    // Regal löschen (Etagen und Fächer werden durch CASCADE automatisch gelöscht)
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

