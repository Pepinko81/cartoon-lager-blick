# 📦 Lagerverwaltung 3D (Cartoon-Lager-Blick)

Willkommen beim wohl modernsten lokalen Lagerverwaltungs-Tool!
**Features:**
- Benutzer-Authentifizierung (JWT, bcrypt)
- SQLite + lokale Bildspeicherung, komplett ohne Cloud
- 3D Cartoon-Regale (React Three Fiber)
- Etagen, Fächer, Bilder – alles verschachtelt, ganz wie Sie es aus der echten Lagerwelt kennen
- Browserbasiert, PWA ready: auch offline nutzbar, mobil und auf dem Tablet

---

## 🚀 Schnellstart

### Voraussetzungen

- Node.js ≥ 18 (empfohlen 20+)
- npm ≥ 9
- (Linux, empfohlen für systemd Units)

### 1️⃣ Repository klonen

```bash
git clone https://github.com/Pepinko81/cartoon-lager-blick.git
cd cartoon-lager-blick
```

### 2️⃣ Backend installieren
```bash
cd backend
npm install
```

### 3️⃣ Frontend installieren
```bash
cd ../
npm install
```

### 4️⃣ Datenbank & Beispiel-Daten (automatisch!)
- Beim ersten Start richtet sich die Datenbank inkl. Beispiel-Regale ein!

---

## 🟢 Starten

**Backend (API, Express):**
```bash
cd backend
npm run dev
```
Standard: http://localhost:5000

**Frontend (Vite React, 3D):**
```bash
cd ../
npm run dev
```
Standard: http://localhost:8080

**Mobil/Tablet?**  
Im selben WLAN einfach `http://<IP-des-Rechners>:8080` im Browser aufrufen.

---

## 🔑 Erstlogin
- **E-Mail:** test@lager.de
- **Passwort:** 123456

---

## 🧩 Features
- Regale mit mehreren Etagen und Fächern
- Bilder-Upload direkt ins lokale Dateisystem
- 3D-Visualisierung der Regale (Three Fiber, cartoonig, performant)
- Responsive: Desktop, Tablet, Smartphone
- Authentifiziert & geschützt (JWT)
- Kann als PWA installiert werden (Home-Screen auf Handy/Tablet)

---

## 🛠️ Systemd Units
Beispiel: `/etc/systemd/system/lager-backend.service`

```ini
[Unit]
Description=Lagerverwaltung Backend (Express + SQLite)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/cartoon-lager-blick/backend
ExecStart=/usr/bin/npm run dev
Restart=always
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Beispiel: `/etc/systemd/system/lager-frontend.service`

```ini
[Unit]
Description=Lagerverwaltung Frontend (Vite + React)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/cartoon-lager-blick
ExecStart=/usr/bin/npm run dev
Restart=always
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Nicht vergessen:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lager-backend
sudo systemctl enable --now lager-frontend
```
---

## 🧰 Troubleshooting

**Port schon belegt:**  
`lsof -i :5000 ; lsof -i :8080` - Prozess beenden oder Port anpassen.

**Bilder werden nicht angezeigt?**  
IP-Adresse/Host ist im CORS für Backend und Frontend erlaubt?

**Fehler: JWT läuft ab**  
Erneut einloggen erforderlich.

---

## 👑 Präsentationsmodus

- 3D-Visualisierung: Regal auswählen, Fächer oder Bilder einfach per Klick managen
- Live im Browser: mobil, Tablet, Desktop, auch lokal installierbar (PWA)
- "Regal bearbeiten" und "Etagen verwalten" direkt als erweiterte Optionen
---

Viel Spaß und Erfolg beim Präsentieren dieses Projekts!  
_„Kein Lager mehr ohne Cartoon-Lager-Blick!“_
