import express from "express";
import db from "../database.js";
import uploadFloorPlan from "../middleware/upload-floorplan.js";
import { authenticateToken } from "../middleware/auth.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST /api/floorplan - Floor plan image upload
router.post("/", authenticateToken, uploadFloorPlan.single("floorplan"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        nachricht: "Keine Bilddatei hochgeladen",
        fehler: true,
      });
    }

    // Deaktiviere alle anderen floor plans
    db.prepare("UPDATE warehouse_floor_plan SET is_active = 0").run();

    // Neue floor plan in Datenbank speichern
    const imagePath = req.file.filename;
    const stmt = db.prepare("INSERT INTO warehouse_floor_plan (image_path, is_active) VALUES (?, 1)");
    const result = stmt.run(imagePath);

    res.status(201).json({
      nachricht: "Grundriss erfolgreich hochgeladen",
      daten: {
        id: result.lastInsertRowid.toString(),
        image_path: `/floorplans/${imagePath}`,
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Fehler beim Hochladen des Grundrisses:", error);
    
    // Datei löschen bei Fehler
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      nachricht: "Fehler beim Hochladen des Grundrisses",
      fehler: true,
    });
  }
});

// GET /api/floorplan - Get current active floor plan
router.get("/", authenticateToken, (req, res) => {
  try {
    const floorPlan = db
      .prepare("SELECT id, image_path, created_at, is_active FROM warehouse_floor_plan WHERE is_active = 1 LIMIT 1")
      .get();

    if (!floorPlan) {
      return res.status(404).json({
        nachricht: "Kein aktiver Grundriss gefunden",
        fehler: true,
      });
    }

    // Get base URL from request
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'lager.local:5000';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      id: floorPlan.id.toString(),
      image_path: `${baseUrl}/floorplans/${floorPlan.image_path}`,
      created_at: floorPlan.created_at,
      is_active: Boolean(floorPlan.is_active),
    });
  } catch (error) {
    console.error("Fehler beim Laden des Grundrisses:", error);
    res.status(500).json({
      nachricht: "Fehler beim Laden des Grundrisses",
      fehler: true,
    });
  }
});

// PUT /api/floorplan/:id - Set floor plan as active
router.put("/:id", authenticateToken, (req, res) => {
  try {
    const floorPlanId = parseInt(req.params.id);

    // Prüfen ob floor plan existiert
    const floorPlan = db
      .prepare("SELECT id FROM warehouse_floor_plan WHERE id = ?")
      .get(floorPlanId);

    if (!floorPlan) {
      return res.status(404).json({
        nachricht: "Grundriss nicht gefunden",
        fehler: true,
      });
    }

    // Deaktiviere alle anderen
    db.prepare("UPDATE warehouse_floor_plan SET is_active = 0").run();

    // Aktiviere diesen
    db.prepare("UPDATE warehouse_floor_plan SET is_active = 1 WHERE id = ?").run(floorPlanId);

    const updatedFloorPlan = db
      .prepare("SELECT id, image_path, created_at, is_active FROM warehouse_floor_plan WHERE id = ?")
      .get(floorPlanId);

    // Get base URL from request
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'lager.local:5000';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      nachricht: "Grundriss erfolgreich aktiviert",
      daten: {
        id: updatedFloorPlan.id.toString(),
        image_path: `${baseUrl}/floorplans/${updatedFloorPlan.image_path}`,
        created_at: updatedFloorPlan.created_at,
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Fehler beim Aktivieren des Grundrisses:", error);
    res.status(500).json({
      nachricht: "Fehler beim Aktivieren des Grundrisses",
      fehler: true,
    });
  }
});

// DELETE /api/floorplan/:id - Delete floor plan image
router.delete("/:id", authenticateToken, (req, res) => {
  try {
    const floorPlanId = parseInt(req.params.id);

    // Prüfen ob floor plan existiert
    const floorPlan = db
      .prepare("SELECT id, image_path FROM warehouse_floor_plan WHERE id = ?")
      .get(floorPlanId);

    if (!floorPlan) {
      return res.status(404).json({
        nachricht: "Grundriss nicht gefunden",
        fehler: true,
      });
    }

    // Datei löschen
    const filePath = path.join(__dirname, "..", "floorplans", floorPlan.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Aus Datenbank löschen
    db.prepare("DELETE FROM warehouse_floor_plan WHERE id = ?").run(floorPlanId);

    res.json({
      nachricht: "Grundriss erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Grundrisses:", error);
    res.status(500).json({
      nachricht: "Fehler beim Löschen des Grundrisses",
      fehler: true,
    });
  }
});

export default router;

