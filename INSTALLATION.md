# Lagerverwaltung – Installationsanleitung (DE)

## 1. Klonen & Installieren

```bash
git clone https://github.com/Pepinko81/cartoon-lager-blick.git
cd cartoon-lager-blick
cd backend && npm install && cd ..
npm install
```

## 2. Starten

Frontend:
```bash
npm run dev
```

Backend (anderes Terminal):
```bash
cd backend
npm run dev
```

## 3. Erstzugang

- http://localhost:8080
- Nutzer: test@lager.de
- Passwort: 123456

## 4. Produktionsbetrieb

**Empfehlung:**  
- systemd Units (siehe README)
- oder [pm2](https://pm2.keymetrics.io/) verwenden

---

## Support

Fehler im Terminal?  
- Node-Version prüfen
- Firewall/CORS beachten
- Ports belegt? Siehe Fehlermeldung.
