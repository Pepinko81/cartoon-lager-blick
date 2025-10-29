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
    beschreibung TEXT
  );

  CREATE TABLE IF NOT EXISTS faecher (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regal_id INTEGER NOT NULL,
    bezeichnung TEXT NOT NULL,
    beschreibung TEXT,
    FOREIGN KEY (regal_id) REFERENCES regale(id) ON DELETE CASCADE
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
`);

// Index für bessere Performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_faecher_regal_id ON faecher(regal_id);
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

// Bilder-Verzeichnis erstellen, falls es nicht existiert
const bilderDir = path.join(__dirname, "bilder");
if (!fs.existsSync(bilderDir)) {
  fs.mkdirSync(bilderDir, { recursive: true });
}

export default db;

