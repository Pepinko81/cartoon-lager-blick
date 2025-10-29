# Lagerverwaltung Backend

Lokales Node.js + Express + SQLite Backend für das Lagerverwaltungssystem.

## Installation

```bash
cd backend
npm install
```

## Starten

### Entwicklung (mit Auto-Reload)
```bash
npm run dev
```

### Produktion
```bash
npm start
```

Der Server läuft standardmäßig auf `http://localhost:5000`.

## API-Endpunkte

### Regale

- `GET /api/regale` - Alle Regale mit Fächern und Bildern laden
- `POST /api/regal` - Neues Regal hinzufügen
  ```json
  {
    "name": "Regal A",
    "description": "Beschreibung (optional)",
    "slotCount": 10
  }
  ```

### Fächer

- `PUT /api/fach/:id` - Fach aktualisieren
  ```json
  {
    "bezeichnung": "F1",
    "beschreibung": "Beschreibung (optional)"
  }
  ```

### Bilder

- `POST /api/fach/:id/bild` - Bild hochladen (Multipart-Form)
  - Form-Feld: `bild`
  - Maximale Dateigröße: 10MB
  - Erlaubte Formate: JPEG, PNG, GIF, WEBP

- `DELETE /api/bild/:id` - Bild löschen

- `GET /bilder/:filename` - Bild abrufen (statischer Zugriff)

## Datenbank

Die SQLite-Datenbank wird automatisch beim ersten Start erstellt (`lager.db`).

### Tabellen

- `regale` - Regale (id, name, beschreibung)
- `faecher` - Fächer (id, regal_id, bezeichnung, beschreibung)
- `bilder` - Bilder (id, fach_id, dateipfad, datum_erstellt)

## Backup

Erstelle ein Backup der Datenbank und Bilder:

```bash
npm run backup
```

Das Backup wird als ZIP-Datei im `backups/` Verzeichnis gespeichert.

## CORS

CORS ist nur für localhost aktiviert:
- `http://localhost:5173` (Vite Dev Server)
- `http://localhost:3000`
- `http://127.0.0.1:5173`

## Fehlerbehandlung

Alle API-Antworten sind auf Deutsch:

- Erfolg: `{ "nachricht": "...", "daten": {...} }`
- Fehler: `{ "nachricht": "...", "fehler": true }`

