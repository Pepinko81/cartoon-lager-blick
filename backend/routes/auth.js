import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../database.js";
import { authenticateToken, JWT_SECRET } from "../middleware/auth.js";

const router = express.Router();

// POST /api/register - Benutzer registrieren
router.post("/register", express.json(), async (req, res) => {
  try {
    const { email, passwort } = req.body;

    // Validierung
    if (!email || !email.trim()) {
      return res.status(400).json({
        nachricht: "E-Mail-Adresse ist erforderlich",
        fehler: true,
      });
    }

    if (!passwort || passwort.length < 6) {
      return res.status(400).json({
        nachricht: "Passwort muss mindestens 6 Zeichen lang sein",
        fehler: true,
      });
    }

    // Email-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        nachricht: "Ungültige E-Mail-Adresse",
        fehler: true,
      });
    }

    // Prüfen ob Benutzer bereits existiert
    const existierenderBenutzer = db
      .prepare("SELECT id FROM benutzer WHERE email = ?")
      .get(email.trim().toLowerCase());

    if (existierenderBenutzer) {
      return res.status(409).json({
        nachricht: "E-Mail-Adresse ist bereits registriert",
        fehler: true,
      });
    }

    // Passwort hashen
    const passwortHash = await bcrypt.hash(passwort, 10);

    // Benutzer speichern
    const stmt = db.prepare("INSERT INTO benutzer (email, passwort_hash) VALUES (?, ?)");
    stmt.run(email.trim().toLowerCase(), passwortHash);

    res.status(201).json({
      nachricht: "Benutzer erfolgreich registriert.",
    });
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    res.status(500).json({
      nachricht: "Fehler bei der Registrierung",
      fehler: true,
    });
  }
});

// POST /api/login - Benutzer anmelden
router.post("/login", express.json(), async (req, res) => {
  try {
    const { email, passwort } = req.body;

    // Validierung
    if (!email || !passwort) {
      return res.status(400).json({
        nachricht: "E-Mail-Adresse und Passwort sind erforderlich",
        fehler: true,
      });
    }

    // Benutzer finden
    const benutzer = db
      .prepare("SELECT id, email, passwort_hash FROM benutzer WHERE email = ?")
      .get(email.trim().toLowerCase());

    if (!benutzer) {
      return res.status(401).json({
        nachricht: "Ungültige Anmeldedaten",
        fehler: true,
      });
    }

    // Passwort vergleichen
    const passwortKorrekt = await bcrypt.compare(passwort, benutzer.passwort_hash);

    if (!passwortKorrekt) {
      return res.status(401).json({
        nachricht: "Ungültige Anmeldedaten",
        fehler: true,
      });
    }

    // JWT-Token erstellen
    const token = jwt.sign(
      { id: benutzer.id, email: benutzer.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      nachricht: "Login erfolgreich",
      token: token,
    });
  } catch (error) {
    console.error("Fehler beim Login:", error);
    res.status(500).json({
      nachricht: "Fehler beim Login",
      fehler: true,
    });
  }
});

// GET /api/profil - Aktuelle Benutzerinformationen
router.get("/profil", authenticateToken, (req, res) => {
  try {
    const benutzer = db
      .prepare("SELECT id, email, erstellt_am FROM benutzer WHERE id = ?")
      .get(req.benutzer.id);

    if (!benutzer) {
      return res.status(404).json({
        nachricht: "Benutzer nicht gefunden",
        fehler: true,
      });
    }

    res.json({
      nachricht: "Profil erfolgreich geladen",
      daten: {
        id: benutzer.id.toString(),
        email: benutzer.email,
        erstellt_am: benutzer.erstellt_am,
      },
    });
  } catch (error) {
    console.error("Fehler beim Laden des Profils:", error);
    res.status(500).json({
      nachricht: "Fehler beim Laden des Profils",
      fehler: true,
    });
  }
});

export default router;

