import archiver from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, "..");
const dbPath = path.join(backendDir, "lager.db");
const bilderDir = path.join(backendDir, "bilder");
const backupDir = path.join(backendDir, "backups");

// Backup-Verzeichnis erstellen, falls es nicht existiert
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Zeitstempel für Dateinamen
const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
const backupFileName = `backup-${timestamp}.zip`;
const backupPath = path.join(backupDir, backupFileName);

// ZIP-Archiv erstellen
const output = fs.createWriteStream(backupPath);
const archive = archiver("zip", {
  zlib: { level: 9 }, // Maximale Kompression
});

output.on("close", () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Backup erfolgreich erstellt: ${backupFileName}`);
  console.log(`📦 Größe: ${sizeMB} MB`);
  console.log(`📁 Speicherort: ${backupPath}`);
});

archive.on("error", (err) => {
  console.error("❌ Fehler beim Erstellen des Backups:", err);
  process.exit(1);
});

// Archivierung starten
archive.pipe(output);

// Datenbank hinzufügen
if (fs.existsSync(dbPath)) {
  archive.file(dbPath, { name: "lager.db" });
  console.log("📄 Datenbank hinzugefügt");
} else {
  console.warn("⚠️  Datenbankdatei nicht gefunden");
}

// Bilder-Verzeichnis hinzufügen
if (fs.existsSync(bilderDir)) {
  archive.directory(bilderDir, "bilder");
  console.log("🖼️  Bilder-Verzeichnis hinzugefügt");
} else {
  console.warn("⚠️  Bilder-Verzeichnis nicht gefunden");
}

// Archivierung abschließen
archive.finalize();

