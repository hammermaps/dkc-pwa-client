# DK-Control PWA Client

Eine **Progressive Web App (PWA)** für das DK-Control Facility-Management-System.  
Gebaut mit **Vue 3 + Quasar Framework + TypeScript** – vollständig offline-fähig.

---

## Features

- 📱 **PWA** – installierbar auf iOS, Android und Desktop (standalone)
- 🔐 **Authentifizierung** – Bearer-Token + Session-Cookie-Support
- 📊 **Zählererfassung** – Zähler verwalten, Ablesungen erfassen mit Foto-Upload
- 🔌 **Offline-Modus** – IndexedDB-Cache + automatische Sync-Queue
- 📷 **QR-Scanner** – Zähler per QR-Code öffnen (BarcodeDetector API)
- 🔄 **Background Sync** – Workbox Background Sync für offline Ablesungen
- 📋 **Dashboard** – Übersicht über MM, NEA, Gebäude, Schlüssel
- 🌙 **Dark Mode** – automatisch basierend auf Systemeinstellung

---

## Technologie-Stack

| Technologie | Zweck |
|---|---|
| Vue 3 + TypeScript | UI-Framework |
| Quasar Framework 2 | UI-Komponenten, PWA-Build, Material Design |
| Vite | Build-Tool |
| Pinia | State Management |
| Dexie.js (IndexedDB) | Offline-Datenspeicherung |
| Workbox | Service Worker, Caching-Strategien, Background Sync |

---

## Projektstruktur

```
src/
├── api/          # API-Client-Schicht (auth, meters, dashboard, nea, mm, building)
├── stores/       # Pinia Stores (auth, meters, offline)
├── db/           # IndexedDB via Dexie.js (schema, index)
├── pages/        # Seiten (Login, Dashboard, Meter*, Settings)
├── components/   # Wiederverwendbare Komponenten (OfflineBanner, SyncIndicator, ImageUpload, QrScanner)
├── composables/  # Vue Composables (useNetwork, useOfflineQueue, useSync)
├── layouts/      # MainLayout mit Bottom-Nav + Side-Drawer
└── router/       # Vue Router mit Auth-Guards
src-pwa/          # PWA Service Worker + Manifest
```

---

## Installation & Entwicklung

### Voraussetzungen
- Node.js >= 18
- npm >= 6

### Setup

```bash
npm install
```

### `.env.local` erstellen

```bash
cp .env.example .env.local
# VITE_API_BASE_URL=https://your-server.example.com
```

### Development Server

```bash
npm run dev
# oder für PWA-Modus:
npx quasar dev -m pwa
```

### Build

```bash
# Standard SPA:
npm run build

# PWA-Build (empfohlen für Produktion):
npm run build:pwa
```

Die Build-Ausgabe befindet sich in `dist/pwa/`.

---

## API-Konfiguration

Die App kommuniziert mit der DK-Control REST-API (`api.php`).  
Siehe [API.md](./API.md) für die vollständige Dokumentation.

### Wichtiger Hinweis zu `meter_*`-Endpunkten

Die Zähler-Endpunkte (`meter_list`, `meter_submit`, etc.) sind ausschließlich **session-basiert** und akzeptieren keine Bearer-Tokens. Die PWA sendet Anfragen mit `credentials: 'include'`, sodass die Browser-Session verwendet wird.

**Serveranforderungen:**
```
Access-Control-Allow-Origin: https://your-pwa-domain.com
Access-Control-Allow-Credentials: true
```

---

## Offline-Architektur

```
Online:  App → API → IndexedDB Cache
Offline: App → IndexedDB Cache (read) + Offline Queue (write)
Sync:    Offline Queue → meter_batch_sync (beim Wiederherstellen der Verbindung)
```

### IndexedDB-Schema
- `meters` – gecachte Zählerliste
- `meterReadings` – Ablesungshistorie
- `offlineQueue` – ausstehende Ablesungen (wird beim Sync geleert)
- `userCache` – Benutzerinfo + Berechtigungen

---

## Erweiterungspunkte

- Push-Notifications via Web Push API
- Biometrische Authentifizierung (WebAuthn)
- Geolocation für Zähler-Standorte
- Mehrsprachigkeit (vue-i18n)
- Native App via Capacitor (iOS/Android aus demselben Codebase)
