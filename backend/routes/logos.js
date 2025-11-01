import express from "express";
import db from "../database.js";
import uploadLogo from "../middleware/upload-logo.js";
import { authenticateToken } from "../middleware/auth.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST /api/logo - Upload logo file
router.post("/", authenticateToken, uploadLogo.single("logo"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        nachricht: "Keine Logo-Datei hochgeladen",
        fehler: true,
      });
    }

    const logoUrl = req.file.filename;
    const stmt = db.prepare(
      "INSERT INTO branding_logos (logo_url, position_x, position_y, position_z, scale) VALUES (?, ?, ?, ?, ?)"
    );
    const result = stmt.run(logoUrl, 0, 5, -5.8, 3);

    res.status(201).json({
      nachricht: "Logo erfolgreich hochgeladen",
      daten: {
        id: result.lastInsertRowid.toString(),
        logo_url: `/logos/${logoUrl}`,
        position_x: 0,
        position_y: 5,
        position_z: -5.8,
        scale: 3,
      },
    });
  } catch (error) {
    console.error("Fehler beim Hochladen des Logos:", error);
    
    // Datei löschen bei Fehler
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      nachricht: "Fehler beim Hochladen des Logos",
      fehler: true,
    });
  }
});

// GET /api/logo - Get current logo configuration (latest)
router.get("/", authenticateToken, (req, res) => {
  try {
    const logo = db
      .prepare("SELECT id, logo_url, position_x, position_y, position_z, scale, created_at FROM branding_logos ORDER BY created_at DESC LIMIT 1")
      .get();

    if (!logo) {
      return res.status(404).json({
        nachricht: "Kein Logo gefunden",
        fehler: true,
      });
    }

    // Get base URL from request
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'lager.local:5000';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      id: logo.id.toString(),
      logo_url: `${baseUrl}/logos/${logo.logo_url}`,
      position_x: logo.position_x,
      position_y: logo.position_y,
      position_z: logo.position_z,
      scale: logo.scale,
      created_at: logo.created_at,
    });
  } catch (error) {
    console.error("Fehler beim Laden des Logos:", error);
    res.status(500).json({
      nachricht: "Fehler beim Laden des Logos",
      fehler: true,
    });
  }
});

// PUT /api/logo/:id - Update logo position/scale
router.put("/:id", authenticateToken, express.json(), (req, res) => {
  try {
    const logoId = parseInt(req.params.id);
    const { position_x, position_y, position_z, scale } = req.body;

    // Prüfen ob Logo existiert
    const logo = db.prepare("SELECT id FROM branding_logos WHERE id = ?").get(logoId);
    if (!logo) {
      return res.status(404).json({
        nachricht: "Logo nicht gefunden",
        fehler: true,
      });
    }

    const updates = [];
    const params = [];

    if (position_x !== undefined) {
      updates.push("position_x = ?");
      params.push(parseFloat(position_x));
    }
    if (position_y !== undefined) {
      updates.push("position_y = ?");
      params.push(parseFloat(position_y));
    }
    if (position_z !== undefined) {
      updates.push("position_z = ?");
      params.push(parseFloat(position_z));
    }
    if (scale !== undefined) {
      updates.push("scale = ?");
      params.push(parseFloat(scale));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        nachricht: "Keine Daten zum Aktualisieren bereitgestellt",
        fehler: true,
      });
    }

    params.push(logoId);
    const stmt = db.prepare(`UPDATE branding_logos SET ${updates.join(", ")} WHERE id = ?`);
    stmt.run(...params);

    const updatedLogo = db
      .prepare("SELECT id, logo_url, position_x, position_y, position_z, scale FROM branding_logos WHERE id = ?")
      .get(logoId);

    // Get base URL from request
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'lager.local:5000';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      nachricht: "Logo-Position erfolgreich aktualisiert",
      daten: {
        id: updatedLogo.id.toString(),
        logo_url: `${baseUrl}/logos/${updatedLogo.logo_url}`,
        position_x: updatedLogo.position_x,
        position_y: updatedLogo.position_y,
        position_z: updatedLogo.position_z,
        scale: updatedLogo.scale,
      },
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Logos:", error);
    res.status(500).json({
      nachricht: "Fehler beim Aktualisieren des Logos",
      fehler: true,
    });
  }
});

// DELETE /api/logo/:id - Delete logo
router.delete("/:id", authenticateToken, (req, res) => {
  try {
    const logoId = parseInt(req.params.id);

    // Prüfen ob Logo existiert
    const logo = db
      .prepare("SELECT id, logo_url FROM branding_logos WHERE id = ?")
      .get(logoId);

    if (!logo) {
      return res.status(404).json({
        nachricht: "Logo nicht gefunden",
        fehler: true,
      });
    }

    // Datei löschen
    const filePath = path.join(__dirname, "..", "logos", logo.logo_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Aus Datenbank löschen
    db.prepare("DELETE FROM branding_logos WHERE id = ?").run(logoId);

    res.json({
      nachricht: "Logo erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Logos:", error);
    res.status(500).json({
      nachricht: "Fehler beim Löschen des Logos",
      fehler: true,
    });
  }
});

export default router;

