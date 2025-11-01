import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "lager.db");
const db = new Database(dbPath);

// Datenbankinitialisierung
db.pragma("foreign_keys = ON");

// Tabellen erstellen
db.exec(`
  CREATE TABLE IF NOT EXISTS regale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    beschreibung TEXT,
    position_x REAL,
    position_y REAL,
    rotation REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS etagen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regal_id INTEGER NOT NULL,
    nummer INTEGER NOT NULL,
    name TEXT,
    FOREIGN KEY (regal_id) REFERENCES regale(id) ON DELETE CASCADE,
    UNIQUE(regal_id, nummer)
  );

  CREATE TABLE IF NOT EXISTS faecher (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etage_id INTEGER NOT NULL,
    bezeichnung TEXT NOT NULL,
    beschreibung TEXT,
    FOREIGN KEY (etage_id) REFERENCES etagen(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bilder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fach_id INTEGER NOT NULL,
    dateipfad TEXT NOT NULL,
    datum_erstellt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fach_id) REFERENCES faecher(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS benutzer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwort_hash TEXT NOT NULL,
    erstellt_am DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS warehouse_floor_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS branding_logos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logo_url TEXT NOT NULL,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 5,
    position_z REAL DEFAULT -5.8,
    scale REAL DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Prüfe ob alte Struktur existiert (faecher.regal_id vorhanden)
try {
  const tableInfo = db.pragma("table_info(faecher)");
  const hasRegalId = tableInfo.some((col) => col.name === "regal_id");
  const hasEtageId = tableInfo.some((col) => col.name === "etage_id");

  if (hasRegalId && !hasEtageId) {
    console.log("🔄 Starte Datenbank-Migration: Regal → Etage → Fach");

    // Temporäre Tabelle für Fächer mit regal_id erstellen
    db.exec(`
      CREATE TABLE IF NOT EXISTS faecher_temp (
        id INTEGER PRIMARY KEY,
        regal_id INTEGER NOT NULL,
        bezeichnung TEXT NOT NULL,
        beschreibung TEXT
      );
      
      INSERT INTO faecher_temp SELECT id, regal_id, bezeichnung, beschreibung FROM faecher;
      
      DROP TABLE faecher;
      
      CREATE TABLE faecher (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        etage_id INTEGER NOT NULL,
        bezeichnung TEXT NOT NULL,
        beschreibung TEXT,
        FOREIGN KEY (etage_id) REFERENCES etagen(id) ON DELETE CASCADE
      );
    `);

    // Für jedes Regal: Etage erstellen und Fächer migrieren
    const regale = db.prepare("SELECT id FROM regale").all();
    const insertEtage = db.prepare(
      "INSERT INTO etagen (regal_id, nummer, name) VALUES (?, ?, ?)"
    );
    const insertFach = db.prepare(
      "INSERT INTO faecher (id, etage_id, bezeichnung, beschreibung) VALUES (?, ?, ?, ?)"
    );

    for (const regal of regale) {
      // Etage "Etage 1" erstellen
      const etageResult = insertEtage.run(regal.id, 1, "Etage 1");
      const etageId = etageResult.lastInsertRowid;

      // Alle Fächer dieses Regals migrieren
      const faecher = db
        .prepare("SELECT id, bezeichnung, beschreibung FROM faecher_temp WHERE regal_id = ?")
        .all(regal.id);

      for (const fach of faecher) {
        insertFach.run(fach.id, etageId, fach.bezeichnung, fach.beschreibung || null);
      }

      console.log(
        `✅ Regal ${regal.id}: Etage 1 erstellt, ${faecher.length} Fächer migriert`
      );
    }

    // Temporäre Tabelle löschen
    db.exec("DROP TABLE IF EXISTS faecher_temp");
    console.log("✅ Datenbank-Migration abgeschlossen");
  }
} catch (error) {
  console.error("⚠️ Migrationsfehler (kann ignoriert werden wenn Schema bereits aktuell):", error.message);
}

// Migration: Add position and rotation columns to regale table if they don't exist
try {
  const regaleTableInfo = db.pragma("table_info(regale)");
  const hasPositionX = regaleTableInfo.some((col) => col.name === "position_x");
  const hasPositionY = regaleTableInfo.some((col) => col.name === "position_y");
  const hasRotation = regaleTableInfo.some((col) => col.name === "rotation");

  if (!hasPositionX || !hasPositionY || !hasRotation) {
    console.log("🔄 Füge position_x, position_y und rotation zu regale Tabelle hinzu...");
    if (!hasPositionX) {
      db.exec("ALTER TABLE regale ADD COLUMN position_x REAL");
    }
    if (!hasPositionY) {
      db.exec("ALTER TABLE regale ADD COLUMN position_y REAL");
    }
    if (!hasRotation) {
      db.exec("ALTER TABLE regale ADD COLUMN rotation REAL DEFAULT 0");
    }
    console.log("✅ Position- und Rotation-Spalten zu regale Tabelle hinzugefügt");
  }
} catch (error) {
  console.error("⚠️ Migrationsfehler für position/rotation-Spalten:", error.message);
}

// Index für bessere Performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_faecher_etage_id ON faecher(etage_id);
  CREATE INDEX IF NOT EXISTS idx_etagen_regal_id ON etagen(regal_id);
  CREATE INDEX IF NOT EXISTS idx_bilder_fach_id ON bilder(fach_id);
  CREATE INDEX IF NOT EXISTS idx_benutzer_email ON benutzer(email);
`);

// Testbenutzer erstellen, falls DB leer ist
const benutzerAnzahl = db.prepare("SELECT COUNT(*) as anzahl FROM benutzer").get();
if (benutzerAnzahl.anzahl === 0) {
  // Passwort synchron hashen für Initialisierung
  const testPasswortHash = bcrypt.hashSync("123456", 10);
  db.prepare("INSERT INTO benutzer (email, passwort_hash) VALUES (?, ?)").run(
    "test@lager.de",
    testPasswortHash
  );
  console.log("✅ Testbenutzer erstellt: test@lager.de / 123456");
}

// Beispiel-Daten erstellen, falls keine Regale existieren
const regaleAnzahl = db.prepare("SELECT COUNT(*) as anzahl FROM regale").get();
if (regaleAnzahl.anzahl === 0) {
  console.log("📦 Erstelle Beispiel-Daten...");
  
  const insertRegal = db.prepare("INSERT INTO regale (name, beschreibung) VALUES (?, ?)");
  const insertEtage = db.prepare("INSERT INTO etagen (regal_id, nummer, name) VALUES (?, ?, ?)");
  const insertFach = db.prepare("INSERT INTO faecher (etage_id, bezeichnung) VALUES (?, ?)");

  const regalResult = insertRegal.run("Test Regal", "Beispiel-Regal mit 3 Etagen");
  const regalId = regalResult.lastInsertRowid;

  // 3 Etagen erstellen
  for (let e = 1; e <= 3; e++) {
    const etageResult = insertEtage.run(regalId, e, `Etage ${e}`);
    const etageId = etageResult.lastInsertRowid;

    // 3 Fächer pro Etage
    for (let f = 1; f <= 3; f++) {
      insertFach.run(etageId, `E${e}-F${f}`);
    }
  }

  console.log("✅ Beispiel-Daten erstellt: 1 Regal, 3 Etagen, 9 Fächer");
}

// Bilder-Verzeichnis erstellen, falls es nicht existiert
const bilderDir = path.join(__dirname, "bilder");
if (!fs.existsSync(bilderDir)) {
  fs.mkdirSync(bilderDir, { recursive: true });
}

// Floorplans-Verzeichnis erstellen, falls es nicht existiert
const floorplansDir = path.join(__dirname, "floorplans");
if (!fs.existsSync(floorplansDir)) {
  fs.mkdirSync(floorplansDir, { recursive: true });
}

// Logos-Verzeichnis erstellen, falls es nicht existiert
const logosDir = path.join(__dirname, "logos");
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

export default db;

