# DK-Control API Dokumentation

> **Version**: 2.0 | **Erstellt**: 2026-04-21  
> **Basis-URL**: `https://<ihr-server>/api.php`

---

## Inhaltsverzeichnis

1. [Überblick & Architektur](#1-überblick--architektur)
2. [Authentifizierung](#2-authentifizierung)
   - [Session-basiert (Browser)](#21-session-basiert-browser)
   - [User-API-Token (externe Apps)](#22-user-api-token-externe-apps)
   - [System-API-Keys](#23-system-api-keys-interner-gebrauch)
3. [Authentifizierungs-Endpunkte](#3-authentifizierungs-endpunkte)
   - [POST auth_login](#31-post-auth_login)
   - [POST auth_logout](#32-post-auth_logout)
   - [GET auth_status](#33-get-auth_status)
   - [GET user_info](#34-get-user_info)
   - [GET user_tokens_list](#35-get-user_tokens_list)
   - [DELETE user_token_delete](#36-delete-user_token_delete)
4. [NEA – Netzersatzanlagen](#4-nea--netzersatzanlagen)
   - [GET nea_dashboard](#41-get-nea_dashboard)
   - [GET nea_systems](#42-get-nea_systems)
   - [GET nea_inspections](#43-get-nea_inspections)
   - [GET nea_inspection_detail](#44-get-nea_inspection_detail)
5. [MM – Mängelmeldungen](#5-mm--mängelmeldungen)
   - [GET mm_list](#51-get-mm_list)
   - [GET mm_detail](#52-get-mm_detail)
6. [Gebäudebegehungen](#6-gebäudebegehungen)
   - [GET building_list](#61-get-building_list)
   - [GET building_inspections](#62-get-building_inspections)
   - [GET building_inspection_detail](#63-get-building_inspection_detail)
7. [Klima – Klimaanlage](#7-klima--klimaanlage)
   - [GET klima_devices](#71-get-klima_devices)
   - [GET klima_status](#72-get-klima_status)
8. [Schlüsselverwaltung](#8-schlüsselverwaltung)
   - [GET keys_inventory](#81-get-keys_inventory)
   - [GET keys_issued](#82-get-keys_issued)
9. [Dashboard & Projekte](#9-dashboard--projekte)
   - [GET dashboard_data](#91-get-dashboard_data)
   - [GET projects_list](#92-get-projects_list)
10. [Zählererfassung (PWA)](#10-zählererfassung-pwa)
11. [Fehlercodes & Fehlerbehandlung](#11-fehlercodes--fehlerbehandlung)
12. [Berechtigungsübersicht](#12-berechtigungsübersicht)
13. [Code-Beispiele](#13-code-beispiele)
    - [Android (Kotlin)](#131-android-kotlin)
    - [C# .NET](#132-c-net)
    - [Python](#133-python)
    - [JavaScript / TypeScript](#134-javascript--typescript)
14. [Datenbankmigrationen](#14-datenbankmigrationen)

---

## 1. Überblick & Architektur

Die DK-Control API ist eine HTTP-REST-JSON-API. Alle Anfragen gehen an **`api.php`** mit dem
Pflichtparameter `?action=<endpunkt>`.

### Basis-Konventionen

| Eigenschaft     | Wert                                      |
|-----------------|-------------------------------------------|
| Protokoll       | HTTPS empfohlen                           |
| Format          | JSON (`Content-Type: application/json`)   |
| Zeichensatz     | UTF-8                                     |
| Auth-Header     | `Authorization: Bearer <token>`           |
| Erfolgsfeld     | `"success": true`                         |
| Fehlerfeld      | `"success": false, "error": "Beschreibung"` |

### Kategorien von Endpunkten

```
┌─────────────────────────────────────────────────────────────┐
│  Öffentliche Endpunkte  │  Kein Auth benötigt               │
│  auth_login             │                                   │
├─────────────────────────────────────────────────────────────┤
│  Benutzer-API-Endpunkte │  Session ODER Bearer dkc_...      │
│  auth_logout, auth_status, user_info                        │
│  nea_*, mm_*, building_*, klima_*, keys_*, dashboard_*      │
├─────────────────────────────────────────────────────────────┤
│  Session-Endpunkte      │  Nur aktive Browser-Session       │
│  notifications, meter_*, ckeditor_draft                     │
├─────────────────────────────────────────────────────────────┤
│  System-API-Endpunkte   │  IP-Whitelist + System-API-Key    │
│  sync, sms, email, rmi, gfr, webhook                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentifizierung

### 2.1 Session-basiert (Browser)

Standard-Browser-Authentifizierung über PHP-Sessions und Session-Cookies.
Nach dem Login über die Web-UI können alle Benutzer-API-Endpunkte direkt aufgerufen werden.

### 2.2 User-API-Token (externe Apps)

**Für externe Anwendungen (Android, iOS, C#, Python, etc.) empfohlen.**

**Ablauf:**

```
App                         Server
 |                             |
 |-- POST auth_login --------> |  (username + password)
 |<-- { token: "dkc_xxx" } -- |
 |                             |
 |-- GET nea_systems --------> |  (Authorization: Bearer dkc_xxx)
 |<-- { systems: [...] } ----- |
```

**Token-Format:** `dkc_` gefolgt von 64 Hex-Zeichen (256 Bit Entropie)  
**Ablaufzeit:** Konfigurierbar (Standard: 30 Tage), unbegrenzt mit `ttl_days: 0`  
**Speicherung:** Sicher im Keystore (Android) oder Credential Manager (Windows/iOS)

**Token verwenden:**
```http
GET /api.php?action=nea_systems HTTP/1.1
Authorization: Bearer dkc_a1b2c3d4...
```

### 2.3 System-API-Keys (interner Gebrauch)

System-API-Keys sind für Systemintegrationen (Webhooks, Automatisierung) gedacht.
Sie werden in der Admin-Oberfläche verwaltet und über IP-Whitelist abgesichert.

```http
POST /api.php?action=sync HTTP/1.1
Authorization: Bearer <system-api-key>
```

---

## 3. Authentifizierungs-Endpunkte

### 3.1 POST auth_login

**Öffentlicher Endpunkt** – kein vorheriges Auth erforderlich.  
Erstellt einen neuen User-API-Token für externe Apps.

**URL:** `POST api.php?action=auth_login`

**Request Body (JSON oder application/x-www-form-urlencoded):**

```json
{
    "username":   "max.mustermann",
    "password":   "geheimesPasswort",
    "token_name": "Android App",
    "ttl_days":   30
}
```

| Feld         | Typ    | Pflicht | Beschreibung                                          |
|--------------|--------|---------|-------------------------------------------------------|
| `username`   | string | ✓       | Benutzername oder Alias                               |
| `password`   | string | ✓       | Klartext-Passwort                                     |
| `token_name` | string | –       | Bezeichnung des Tokens (Standard: `"API Token"`)      |
| `ttl_days`   | int    | –       | Gültigkeitsdauer in Tagen. `0` = unbegrenzt (Standard: 30) |

**Erfolgsantwort (200):**

```json
{
    "success":    true,
    "token":      "dkc_a1b2c3d4e5f6...",
    "token_type": "Bearer",
    "expires_at": "2026-05-21 14:36:59",
    "user": {
        "id":       42,
        "username": "max.mustermann",
        "vname":    "Max",
        "nname":    "Mustermann",
        "email":    "max@example.com",
        "is_admin": false
    }
}
```

**Fehlerantworten:**

| HTTP | `error`-Text                  | Ursache                        |
|------|-------------------------------|--------------------------------|
| 400  | `username und password sind erforderlich` | Pflichtfelder fehlen |
| 401  | `Ungültige Anmeldedaten`      | Falscher User/Passwort         |
| 405  | `Method not allowed`          | Kein POST verwendet            |
| 429  | `Too many requests`           | Brute-Force-Schutz ausgelöst   |
| 500  | `Token-Generierung fehlgeschlagen` | Serverseitiger Fehler     |

---

### 3.2 POST auth_logout

Invalidiert den aktuellen Bearer-Token.

**URL:** `POST api.php?action=auth_logout`  
**Auth:** `Authorization: Bearer dkc_...`

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "message": "Erfolgreich abgemeldet"
}
```

---

### 3.3 GET auth_status

Prüft ob der Token / die Session noch gültig ist.

**URL:** `GET api.php?action=auth_status`  
**Auth:** `Authorization: Bearer dkc_...`

**Erfolgsantwort (200):**
```json
{
    "success":       true,
    "authenticated": true,
    "user": {
        "id":       42,
        "username": "max.mustermann",
        "vname":    "Max",
        "nname":    "Mustermann",
        "email":    "max@example.com",
        "is_admin": false
    }
}
```

**Fehlerantwort (401):**
```json
{
    "success":       false,
    "authenticated": false,
    "error":         "Not authenticated"
}
```

---

### 3.4 GET user_info

Gibt erweiterte Benutzerinformationen inkl. aller Berechtigungen zurück.

**URL:** `GET api.php?action=user_info`  
**Auth:** `Authorization: Bearer dkc_...`

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "user": {
        "id":                42,
        "username":          "max.mustermann",
        "vname":             "Max",
        "nname":             "Mustermann",
        "email":             "max@example.com",
        "is_admin":          false,
        "active_project_id": 1
    },
    "permissions": {
        "nea_view":      true,
        "view_mm_list":  true,
        "building_view": true,
        "keys_view":     false,
        ...
    }
}
```

---

### 3.5 GET user_tokens_list

Listet alle eigenen API-Tokens auf (ohne Token-Wert).

**URL:** `GET api.php?action=user_tokens_list`  
**Auth:** `Authorization: Bearer dkc_...`

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "tokens": [
        {
            "id":           1,
            "name":         "Android App",
            "expires_at":   "2026-05-21 14:36:59",
            "last_used_at": "2026-04-21 14:30:00",
            "last_ip":      "192.168.1.100",
            "created_at":   "2026-04-21 14:00:00"
        }
    ]
}
```

---

### 3.6 DELETE user_token_delete

Löscht einen eigenen Token anhand der Token-ID.

**URL:** `POST api.php?action=user_token_delete` (auch DELETE möglich)  
**Auth:** `Authorization: Bearer dkc_...`

**Request Body (JSON):**
```json
{ "token_id": 5 }
```

**Erfolgsantwort (200):**
```json
{ "success": true, "message": "Token gelöscht" }
```

---

## 4. NEA – Netzersatzanlagen

> Alle NEA-Endpunkte benötigen die Berechtigung **`nea_view`** (oder Admin).

### 4.1 GET nea_dashboard

Übersicht des NEA-Moduls mit Statistiken und fälligen Tests.

**URL:** `GET api.php?action=nea_dashboard[&project_id=1]`

**Erfolgsantwort (200):**
```json
{
    "success":    true,
    "project_id": 1,
    "stats": {
        "total_systems":          5,
        "inspections_this_week":  3,
        "inspections_this_month": 12,
        "failed_last_30_days":    1
    },
    "due_tests": [
        {
            "system_id":       2,
            "system_name":     "NEA Gebäude A",
            "days_overdue":    3,
            "last_inspection": "2026-04-14"
        }
    ],
    "recent_inspections": [
        {
            "id":             45,
            "nea_system_id":  1,
            "inspection_date":"2026-04-21",
            "inspector_name": "Max Mustermann",
            "status":         "completed",
            "overall_result": "passed"
        }
    ]
}
```

---

### 4.2 GET nea_systems

**URL:** `GET api.php?action=nea_systems[&project_id=1]`

**Erfolgsantwort (200):**
```json
{
    "success":    true,
    "project_id": 1,
    "systems": [
        {
            "id":                     1,
            "name":                   "NEA Hauptgebäude",
            "description":            "Notstromaggregat 400kVA",
            "location":               "Keller B2",
            "manufacturer":           "Deutz",
            "model":                  "TBG620",
            "serial_number":          "SN-12345",
            "installation_date":      "2020-01-15",
            "enabled":                true,
            "project_id":             1,
            "last_inspection_date":   "2026-04-21",
            "last_inspection_result": "passed"
        }
    ]
}
```

---

### 4.3 GET nea_inspections

**URL:** `GET api.php?action=nea_inspections`

**Query-Parameter:**

| Parameter   | Typ    | Beschreibung                                             |
|-------------|--------|----------------------------------------------------------|
| `system_id` | int    | Filter nach NEA-Anlage                                   |
| `year`      | int    | Filter nach Jahr (z. B. `2026`)                         |
| `status`    | string | `in_progress` \| `completed` \| `cancelled`             |
| `limit`     | int    | Einträge pro Seite (max. 200, Standard: 50)              |
| `offset`    | int    | Versatz für Paginierung (Standard: 0)                   |

**Erfolgsantwort (200):**
```json
{
    "success":     true,
    "project_id":  1,
    "total":       42,
    "limit":       50,
    "offset":      0,
    "inspections": [
        {
            "id":              45,
            "nea_system_id":   1,
            "system_name":     "NEA Hauptgebäude",
            "inspection_type": "weekly_test",
            "inspection_date": "2026-04-21",
            "inspector_name":  "Max Mustermann",
            "status":          "completed",
            "overall_result":  "passed",
            "runtime_hours":   1250,
            "notes":           "",
            "created_at":      "2026-04-21 09:00:00"
        }
    ]
}
```

**Inspection-Typen:** `weekly_test`, `monthly_inspection`, `annual_inspection`  
**Statuse:** `in_progress`, `completed`, `cancelled`  
**Ergebnisse:** `passed`, `failed`, `pending`

---

### 4.4 GET nea_inspection_detail

**URL:** `GET api.php?action=nea_inspection_detail&id=45`

**Pflichtparameter:**

| Parameter | Typ | Beschreibung      |
|-----------|-----|-------------------|
| `id`      | int | Prüfungs-ID (**Pflicht**) |

**Erfolgsantwort (200):**
```json
{
    "success":    true,
    "inspection": {
        "id":                 45,
        "nea_system_id":      1,
        "system": {
            "id":   1,
            "name": "NEA Hauptgebäude"
        },
        "inspection_type":   "weekly_test",
        "inspection_date":   "2026-04-21",
        "inspector_id":      42,
        "inspector_name":    "Max Mustermann",
        "status":            "completed",
        "overall_result":    "passed",
        "runtime_hours":     1250,
        "runtime_hours_after": 1251,
        "defects_found":     null,
        "corrective_actions": null,
        "notes":             "",
        "checklist_data":    { "step1": "ok", "step2": "ok" },
        "defect_notes":      {},
        "photos":            ["foto1.jpg"],
        "created_at":        "2026-04-21 09:00:00"
    }
}
```

---

## 5. MM – Mängelmeldungen

> Berechtigung: **`view_mm_list`** für die Liste, **`view_mm`** für Details (oder Admin).

### 5.1 GET mm_list

**URL:** `GET api.php?action=mm_list`

**Query-Parameter:**

| Parameter | Typ    | Beschreibung                               |
|-----------|--------|--------------------------------------------|
| `status`  | int    | `0` = ausstehend, `1` = freigegeben, `2` = erledigt |
| `street`  | string | Filter nach Straßen-Key                    |
| `limit`   | int    | Einträge pro Seite (max. 200, Standard: 50) |
| `offset`  | int    | Versatz für Paginierung                    |

**Erfolgsantwort (200):**
```json
{
    "success":  true,
    "total":    125,
    "limit":    50,
    "offset":   0,
    "messages": [
        {
            "uid":             "DKC-2026-0001",
            "status":          0,
            "betreff":         "Heizungsausfall",
            "street":          "musterstrasse",
            "whg":             "1.001",
            "melder":          "Hans Müller",
            "datetime":        "2026-04-21 10:30:00",
            "dringlichkeit":   "normal",
            "nachunternehmer": null,
            "scanned":         false,
            "zugeh":           "haus"
        }
    ]
}
```

**Status-Werte:**

| Wert | Bedeutung           |
|------|---------------------|
| `0`  | Ausstehend / Neu    |
| `1`  | Freigegeben         |
| `2`  | Erledigt            |
| `3`  | Gesperrt            |

**Dringlichkeit-Werte:** `normal`, `hoch`  
**Zugeh-Werte:** `haus` (Hauseigentümer), `gw` (Gewerbe), `all` (alle)

---

### 5.2 GET mm_detail

**URL:** `GET api.php?action=mm_detail&uid=DKC-2026-0001`

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "message": {
        "uid":               "DKC-2026-0001",
        "status":            0,
        "betreff":           "Heizungsausfall",
        "meldung_massage":   "Die Heizung in Wohnung 001 funktioniert nicht.",
        "apleona":           null,
        "folge":             null,
        "street":            "musterstrasse",
        "whg":               "1.001",
        "melder":            "Hans Müller",
        "tel":               "0123 456789",
        "email":             "hans@example.com",
        "datetime":          "2026-04-21 10:30:00",
        "dringlichkeit":     "normal",
        "nachunternehmer":   null,
        "ekpreis":           "0",
        "klausel":           false,
        "zugeh":             "haus",
        "scanned":           false,
        "zeit":              0,
        "planon":            null,
        "instructions":      []
    }
}
```

---

## 6. Gebäudebegehungen

> Berechtigung: **`building_view`** (oder Admin).

### 6.1 GET building_list

**URL:** `GET api.php?action=building_list[&project_id=1]`

**Erfolgsantwort (200):**
```json
{
    "success":    true,
    "project_id": 1,
    "buildings": [
        {
            "id":          1,
            "name":        "Hauptgebäude",
            "address":     "Musterstraße 1, 12345 Musterstadt",
            "description": "Bürogebäude mit 5 Etagen",
            "enabled":     true,
            "project_id":  1
        }
    ]
}
```

---

### 6.2 GET building_inspections

**URL:** `GET api.php?action=building_inspections`

**Query-Parameter:**

| Parameter     | Typ    | Beschreibung                                              |
|---------------|--------|-----------------------------------------------------------|
| `building_id` | int    | Filter nach Gebäude                                       |
| `status`      | string | `open` \| `in_progress` \| `completed`                   |
| `year`        | int    | Filter nach Jahr                                          |
| `limit`       | int    | Max. 200, Standard: 50                                   |
| `offset`      | int    | Paginierung                                               |

**Erfolgsantwort (200):**
```json
{
    "success":     true,
    "project_id":  1,
    "total":       15,
    "limit":       50,
    "offset":      0,
    "inspections": [
        {
            "id":               12,
            "building_id":      1,
            "building_name":    "Hauptgebäude",
            "title":            "Halbjährliche Begehung Q2 2026",
            "inspection_date":  "2026-04-21 09:00:00",
            "status":           "completed",
            "overall_result":   "ok",
            "created_by_name":  "Max Mustermann",
            "last_editor_name": "Max Mustermann",
            "weather":          "sonnig",
            "attendees":        "Hr. Müller, Fr. Schmidt"
        }
    ]
}
```

---

### 6.3 GET building_inspection_detail

**URL:** `GET api.php?action=building_inspection_detail&id=12`

**Erfolgsantwort (200):**
```json
{
    "success":    true,
    "inspection": {
        "id":               12,
        "building_id":      1,
        "building_name":    "Hauptgebäude",
        "title":            "Halbjährliche Begehung Q2 2026",
        "inspection_date":  "2026-04-21 09:00:00",
        "status":           "completed",
        "overall_result":   "ok",
        "created_by_name":  "Max Mustermann",
        "last_editor_name": "Max Mustermann",
        "weather":          "sonnig",
        "attendees":        "Hr. Müller, Fr. Schmidt",
        "general_notes":    "Keine besonderen Vorkommnisse.",
        "results": [
            {
                "id":              101,
                "checkpoint_id":   5,
                "checkpoint_name": "Fluchttüren",
                "status":          "ok",
                "note":            "",
                "comment":         "",
                "edited_by_name":  "Max Mustermann",
                "edited_at":       "2026-04-21 09:30:00"
            }
        ]
    }
}
```

**Checkpoint-Status:** `ok`, `not_ok`, `na` (nicht anwendbar), `null` (noch nicht geprüft)

---

## 7. Klima – Klimaanlage

> Berechtigung: **`view_groups`** (oder Admin).  
> ⚠️ **Hinweis:** Echtzeit-Temperaturen und Live-Steuerbefehle erfordern eine aktive
> RMI-Hardwareverbindung, die in der stateless-API nicht verfügbar ist. Die folgenden
> Endpunkte liefern nur die in der Datenbank gespeicherten Konfigurationsdaten.

### 7.1 GET klima_devices

**URL:** `GET api.php?action=klima_devices`

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "devices": [
        {
            "address":  1,
            "name":     "Büro EG",
            "group_id": 1,
            "enabled":  true,
            "sort":     1
        }
    ]
}
```

---

### 7.2 GET klima_status

**URL:** `GET api.php?action=klima_status[&address=1]`

**Query-Parameter:**

| Parameter | Typ | Beschreibung                              |
|-----------|-----|-------------------------------------------|
| `address` | int | Optional – nur ein bestimmtes Gerät       |

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "devices": [
        {
            "address":        1,
            "name":           "Büro EG",
            "enabled":        true,
            "group_id":       1,
            "operating_mode": "cooling",
            "note":           "Echtzeit-Status erfordert direkte RMI-Verbindung"
        }
    ]
}
```

---

## 8. Schlüsselverwaltung

> Berechtigung: **`keys_view`** (oder Admin).

### 8.1 GET keys_inventory

**URL:** `GET api.php?action=keys_inventory[&status=active&limit=50&offset=0]`

**Query-Parameter:**

| Parameter | Typ    | Beschreibung                             |
|-----------|--------|------------------------------------------|
| `status`  | string | `active` (Standard) \| `inactive` \| leer = alle |
| `limit`   | int    | Max. 200, Standard: 50                  |
| `offset`  | int    | Paginierung                              |

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "total":   48,
    "limit":   50,
    "offset":  0,
    "keys": [
        {
            "id":          1,
            "number":      "K-001",
            "name":        "Haupteingang",
            "description": "Haustür vorne",
            "type_id":     2,
            "cabinet_id":  1,
            "total_count": 3,
            "enabled":     true
        }
    ]
}
```

---

### 8.2 GET keys_issued

Gibt aktuell ausgegebene (nicht zurückgegebene) Schlüssel zurück.

**URL:** `GET api.php?action=keys_issued[&limit=50&offset=0]`

**Erfolgsantwort (200):**
```json
{
    "success": true,
    "total":   12,
    "limit":   50,
    "offset":  0,
    "issued": [
        {
            "id":             55,
            "key_id":         1,
            "key_number":     "K-001",
            "key_name":       "Haupteingang",
            "recipient_name": "Hans Müller",
            "issued_at":      "2026-04-15 10:00:00",
            "issued_by":      "Admin",
            "notes":          "Vorübergehend für Renovierung"
        }
    ]
}
```

---

## 9. Dashboard & Projekte

### 9.1 GET dashboard_data

Gibt eine Gesamtübersicht aller Module zurück. Daten werden permissions-basiert gefiltert.

**URL:** `GET api.php?action=dashboard_data[&project_id=1]`  
**Auth:** Beliebiger authentifizierter Benutzer

**Erfolgsantwort (200):**
```json
{
    "success":    true,
    "project_id": 1,
    "mm": {
        "total":     125,
        "pending":   8,
        "approved":  45,
        "completed": 72
    },
    "nea": {
        "total_systems":          5,
        "inspections_this_month": 12
    },
    "building": {
        "open":        2,
        "in_progress": 1,
        "completed":   18
    },
    "keys": {
        "total_inventory":  48,
        "currently_issued": 12
    },
    "notifications": {
        "unread": 3
    }
}
```

> Module ohne entsprechende Berechtigung werden nicht im Response enthalten.

---

### 9.2 GET projects_list

**URL:** `GET api.php?action=projects_list`  
**Auth:** Beliebiger authentifizierter Benutzer

**Erfolgsantwort (200):**
```json
{
    "success":            true,
    "active_project_id":  1,
    "projects": [
        {
            "id":          1,
            "name":        "Hauptprojekt",
            "description": "Verwaltungsobjekt Musterstraße",
            "status":      "active",
            "created_at":  "2023-01-01 00:00:00"
        }
    ]
}
```

---

## 10. Zählererfassung (PWA)

Diese Endpunkte werden von der internen PWA-App verwendet und sind **ausschließlich session-basiert**.
Sie erfordern eine aktive Browser-Session und sind **nicht** über User-API-Token (`dkc_...`) zugänglich.

> ⚠️ Für externe Apps ist die Zählererfassung über diese Endpunkte **nicht verfügbar**.
> Die `meter_*`-Actions befinden sich in `$sessionBasedActions` und validieren keine Bearer-Tokens.

| Endpunkt              | Methode | Beschreibung                            |
|-----------------------|---------|-----------------------------------------|
| `meter_list`          | GET     | Alle Zähler des aktiven Projekts        |
| `meter_submit`        | POST    | Ablesung eintragen                      |
| `meter_batch_sync`    | POST    | Mehrere Ablesungen auf einmal           |
| `meter_readings`      | GET     | Ablesungshistorie eines Zählers         |
| `meter_qr_list`       | GET     | Zähler mit QR-Code                      |
| `meter_deactivate`    | POST    | Zähler deaktivieren                     |
| `meter_activate`      | POST    | Zähler reaktivieren                     |

---

## 11. Fehlercodes & Fehlerbehandlung

### Standard-Fehlerformat

```json
{
    "success": false,
    "error":   "Beschreibung des Fehlers"
}
```

### HTTP-Statuscodes

| Code | Bedeutung                                         |
|------|---------------------------------------------------|
| 200  | Erfolg                                            |
| 400  | Fehlerhafte Anfrage (fehlende/ungültige Parameter)|
| 401  | Nicht authentifiziert                             |
| 403  | Keine Berechtigung (falsche Permissions)          |
| 404  | Ressource nicht gefunden                          |
| 405  | HTTP-Methode nicht erlaubt                        |
| 429  | Too Many Requests (Rate Limiting / Brute-Force)   |
| 500  | Interner Serverfehler                             |

### Rate Limiting

Der Brute-Force-Schutz (BruteForceProtection) begrenzt fehlgeschlagene Login-Versuche.
Bei HTTP 429 enthält der Response-Header `Retry-After: <sekunden>`.

---

## 12. Berechtigungsübersicht

| Berechtigung       | Endpunkte                                             |
|--------------------|-------------------------------------------------------|
| `nea_view`         | nea_dashboard, nea_systems, nea_inspections, nea_inspection_detail |
| `view_mm_list`     | mm_list                                               |
| `view_mm`          | mm_detail                                             |
| `building_view`    | building_list, building_inspections, building_inspection_detail |
| `view_groups`      | klima_devices, klima_status                           |
| `keys_view`        | keys_inventory, keys_issued                           |
| `meters_view`      | meter_list, meter_qr_list, meter_readings             |
| `meters_create`    | meter_submit, meter_batch_sync                        |
| *(alle)*           | auth_status, auth_logout, user_info, user_tokens_list, user_token_delete, dashboard_data, projects_list |
| `admin`            | Implizit alle Berechtigungen                          |

---

## 13. Code-Beispiele

### 13.1 Android (Kotlin)

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class DkControlApi(private val baseUrl: String) {

    private val client = OkHttpClient()
    private var authToken: String? = null

    fun login(username: String, password: String): Boolean {
        val body = JSONObject().apply {
            put("username", username)
            put("password", password)
            put("token_name", "Android App")
            put("ttl_days", 30)
        }
        val request = Request.Builder()
            .url("$baseUrl/api.php?action=auth_login")
            .post(body.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val response = client.newCall(request).execute()
        val json = JSONObject(response.body!!.string())

        if (json.getBoolean("success")) {
            authToken = json.getString("token")
            // Token sicher im Android Keystore speichern
            saveTokenToKeystore(authToken!!)
            return true
        }
        return false
    }

    fun getNeaSystems(projectId: Int = 1): JSONObject {
        val request = Request.Builder()
            .url("$baseUrl/api.php?action=nea_systems&project_id=$projectId")
            .addHeader("Authorization", "Bearer $authToken")
            .get()
            .build()

        val response = client.newCall(request).execute()
        return JSONObject(response.body!!.string())
    }

    fun getMmList(status: Int? = null, limit: Int = 50): JSONObject {
        val url = buildString {
            append("$baseUrl/api.php?action=mm_list&limit=$limit")
            if (status != null) append("&status=$status")
        }
        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $authToken")
            .get()
            .build()

        val response = client.newCall(request).execute()
        return JSONObject(response.body!!.string())
    }

    fun logout() {
        val request = Request.Builder()
            .url("$baseUrl/api.php?action=auth_logout")
            .addHeader("Authorization", "Bearer $authToken")
            .post("".toRequestBody())
            .build()
        client.newCall(request).execute()
        authToken = null
    }

    private fun saveTokenToKeystore(token: String) {
        // Android Keystore / EncryptedSharedPreferences implementation
    }
}

// Verwendung:
// val api = DkControlApi("https://rmi.dk-automation.de")
// if (api.login("admin", "passwort")) {
//     val systems = api.getNeaSystems()
//     println(systems.getJSONArray("systems").toString(2))
// }
```

---

### 13.2 C# .NET

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

public class DkControlApi : IDisposable
{
    private readonly HttpClient _client;
    private readonly string _baseUrl;
    private string? _authToken;

    public DkControlApi(string baseUrl)
    {
        _baseUrl = baseUrl.TrimEnd('/');
        _client = new HttpClient();
    }

    public async Task<bool> LoginAsync(string username, string password,
        string tokenName = "C# App", int ttlDays = 30)
    {
        var payload = new
        {
            username,
            password,
            token_name = tokenName,
            ttl_days = ttlDays
        };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync(
            $"{_baseUrl}/api.php?action=auth_login", content);
        var body = await response.Content.ReadAsStringAsync();
        var node = JsonNode.Parse(body)!;

        if (node["success"]?.GetValue<bool>() == true)
        {
            _authToken = node["token"]?.GetValue<string>();
            // Token sicher speichern (Windows Credential Manager o. ä.)
            return true;
        }
        return false;
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string action,
        Dictionary<string, string>? queryParams = null)
    {
        var url = $"{_baseUrl}/api.php?action={action}";
        if (queryParams != null)
        {
            foreach (var (k, v) in queryParams)
                url += $"&{k}={Uri.EscapeDataString(v)}";
        }
        var request = new HttpRequestMessage(method, url);
        if (_authToken != null)
            request.Headers.Add("Authorization", $"Bearer {_authToken}");
        return request;
    }

    public async Task<JsonNode?> GetNeaSystemsAsync(int projectId = 1)
    {
        var req = CreateRequest(HttpMethod.Get, "nea_systems",
            new() { { "project_id", projectId.ToString() } });
        var resp = await _client.SendAsync(req);
        return JsonNode.Parse(await resp.Content.ReadAsStringAsync());
    }

    public async Task<JsonNode?> GetNeaInspectionsAsync(
        int? systemId = null, int? year = null, string? status = null,
        int limit = 50, int offset = 0)
    {
        var q = new Dictionary<string, string>
        {
            { "limit", limit.ToString() },
            { "offset", offset.ToString() }
        };
        if (systemId.HasValue) q["system_id"] = systemId.Value.ToString();
        if (year.HasValue)     q["year"]      = year.Value.ToString();
        if (status != null)    q["status"]    = status;

        var req = CreateRequest(HttpMethod.Get, "nea_inspections", q);
        var resp = await _client.SendAsync(req);
        return JsonNode.Parse(await resp.Content.ReadAsStringAsync());
    }

    public async Task<JsonNode?> GetMmListAsync(
        int? status = null, int limit = 50, int offset = 0)
    {
        var q = new Dictionary<string, string>
        {
            { "limit", limit.ToString() },
            { "offset", offset.ToString() }
        };
        if (status.HasValue) q["status"] = status.Value.ToString();

        var req = CreateRequest(HttpMethod.Get, "mm_list", q);
        var resp = await _client.SendAsync(req);
        return JsonNode.Parse(await resp.Content.ReadAsStringAsync());
    }

    public async Task<JsonNode?> GetDashboardAsync(int projectId = 1)
    {
        var req = CreateRequest(HttpMethod.Get, "dashboard_data",
            new() { { "project_id", projectId.ToString() } });
        var resp = await _client.SendAsync(req);
        return JsonNode.Parse(await resp.Content.ReadAsStringAsync());
    }

    public async Task LogoutAsync()
    {
        if (_authToken == null) return;
        var req = CreateRequest(HttpMethod.Post, "auth_logout");
        req.Content = new StringContent("", Encoding.UTF8, "application/json");
        await _client.SendAsync(req);
        _authToken = null;
    }

    public void Dispose() => _client.Dispose();
}

// Verwendung:
// using var api = new DkControlApi("https://rmi.dk-automation.de");
// bool ok = await api.LoginAsync("admin", "passwort", "Windows App");
// if (ok)
// {
//     var dashboard = await api.GetDashboardAsync();
//     Console.WriteLine(dashboard?.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
// }
```

---

### 13.3 Python

```python
import requests
from typing import Optional, Dict, Any


class DkControlApi:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.token: Optional[str] = None

    def login(self, username: str, password: str,
              token_name: str = "Python App", ttl_days: int = 30) -> bool:
        resp = self.session.post(
            f"{self.base_url}/api.php",
            params={"action": "auth_login"},
            json={
                "username":   username,
                "password":   password,
                "token_name": token_name,
                "ttl_days":   ttl_days,
            }
        )
        data = resp.json()
        if data.get("success"):
            self.token = data["token"]
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            return True
        print(f"Login fehlgeschlagen: {data.get('error')}")
        return False

    def _get(self, action: str, **params) -> Dict[str, Any]:
        resp = self.session.get(
            f"{self.base_url}/api.php",
            params={"action": action, **params}
        )
        resp.raise_for_status()
        return resp.json()

    def get_nea_systems(self, project_id: int = 1) -> Dict:
        return self._get("nea_systems", project_id=project_id)

    def get_nea_inspections(self, system_id: int = None, year: int = None,
                            status: str = None, limit: int = 50, offset: int = 0) -> Dict:
        params = {"limit": limit, "offset": offset}
        if system_id: params["system_id"] = system_id
        if year:      params["year"]      = year
        if status:    params["status"]    = status
        return self._get("nea_inspections", **params)

    def get_mm_list(self, status: int = None, limit: int = 50) -> Dict:
        params = {"limit": limit}
        if status is not None:
            params["status"] = status
        return self._get("mm_list", **params)

    def get_mm_detail(self, uid: str) -> Dict:
        return self._get("mm_detail", uid=uid)

    def get_building_inspections(self, building_id: int = None,
                                  status: str = None) -> Dict:
        params = {}
        if building_id: params["building_id"] = building_id
        if status:      params["status"]      = status
        return self._get("building_inspections", **params)

    def get_dashboard(self, project_id: int = 1) -> Dict:
        return self._get("dashboard_data", project_id=project_id)

    def logout(self) -> None:
        if self.token:
            self.session.post(
                f"{self.base_url}/api.php",
                params={"action": "auth_logout"}
            )
            self.token = None
            self.session.headers.pop("Authorization", None)


# Verwendung:
# api = DkControlApi("https://rmi.dk-automation.de")
# if api.login("admin", "passwort"):
#     dashboard = api.get_dashboard()
#     print(f"Offene MM: {dashboard.get('mm', {}).get('pending', 'N/A')}")
#     systems = api.get_nea_systems()
#     for s in systems.get("systems", []):
#         print(f"  - {s['name']}: letzte Prüfung {s['last_inspection_date']}")
```

---

### 13.4 JavaScript / TypeScript

```typescript
interface AuthResponse {
    success: boolean;
    token?: string;
    token_type?: string;
    expires_at?: string;
    user?: UserInfo;
    error?: string;
}

interface UserInfo {
    id: number;
    username: string;
    vname: string;
    nname: string;
    email: string;
    is_admin: boolean;
}

class DkControlApi {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async login(username: string, password: string,
                tokenName = 'Web App', ttlDays = 30): Promise<boolean> {
        const resp = await fetch(`${this.baseUrl}/api.php?action=auth_login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, token_name: tokenName, ttl_days: ttlDays }),
        });
        const data: AuthResponse = await resp.json();
        if (data.success && data.token) {
            this.token = data.token;
            sessionStorage.setItem('dkc_token', this.token);
            return true;
        }
        console.error('Login fehlgeschlagen:', data.error);
        return false;
    }

    private async get<T>(action: string, params: Record<string, string | number> = {}): Promise<T> {
        const q = new URLSearchParams({ action, ...Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)])
        )});
        const resp = await fetch(`${this.baseUrl}/api.php?${q}`, {
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
    }

    getNeaSystems(projectId = 1)       { return this.get('nea_systems', { project_id: projectId }); }
    getNeaInspections(params = {})     { return this.get('nea_inspections', params); }
    getMmList(params = {})             { return this.get('mm_list', params); }
    getBuildingInspections(params = {}) { return this.get('building_inspections', params); }
    getDashboard(projectId = 1)        { return this.get('dashboard_data', { project_id: projectId }); }
    getProjectsList()                  { return this.get('projects_list'); }

    async logout(): Promise<void> {
        if (!this.token) return;
        await fetch(`${this.baseUrl}/api.php?action=auth_logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
        });
        this.token = null;
        sessionStorage.removeItem('dkc_token');
    }
}

// Verwendung:
// const api = new DkControlApi('https://rmi.dk-automation.de');
// await api.login('admin', 'passwort', 'React App');
// const dashboard = await api.getDashboard();
// const systems = await api.getNeaSystems();
```

---

## 14. Datenbankmigrationen

Vor der Nutzung der Benutzer-API-Tokens muss die folgende Migration ausgeführt werden:

**Datei:** `config/sql/migration_2026_04_21_user_api_tokens.sql`

```sql
CREATE TABLE IF NOT EXISTS `user_api_tokens` (
    `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`     INT             NOT NULL,
    `token`       VARCHAR(128)    NOT NULL COMMENT 'dkc_ + 64 hex chars',
    `name`        VARCHAR(255)    NOT NULL DEFAULT 'API Token',
    `expires_at`  DATETIME        NULL,
    `last_used_at` DATETIME       NULL,
    `last_ip`     VARCHAR(64)     NULL,
    `created_at`  DATETIME        NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY  `token_unique`  (`token`),
    INDEX       `user_id_idx`   (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Ausführen:**
```bash
mysql -u <user> -p <database> < config/sql/migration_2026_04_21_user_api_tokens.sql
```

---

## Anhang: Vollständige Endpunkt-Übersicht

| Endpunkt                   | Methode | Auth    | Berechtigung      | Beschreibung                        |
|----------------------------|---------|---------|-------------------|-------------------------------------|
| `auth_login`               | POST    | –       | Öffentlich        | Login, gibt Token zurück            |
| `auth_logout`              | POST    | Bearer  | –                 | Token invalidieren                  |
| `auth_status`              | GET     | Bearer  | –                 | Token-Gültigkeit prüfen             |
| `user_info`                | GET     | Bearer  | –                 | Benutzer + Berechtigungen           |
| `user_tokens_list`         | GET     | Bearer  | –                 | Eigene API-Tokens auflisten         |
| `user_token_delete`        | POST    | Bearer  | –                 | Token löschen                       |
| `nea_dashboard`            | GET     | Bearer  | `nea_view`        | NEA Übersicht                       |
| `nea_systems`              | GET     | Bearer  | `nea_view`        | NEA-Anlagen                         |
| `nea_inspections`          | GET     | Bearer  | `nea_view`        | NEA-Prüfungen (Liste)               |
| `nea_inspection_detail`    | GET     | Bearer  | `nea_view`        | NEA-Prüfung (Detail)                |
| `mm_list`                  | GET     | Bearer  | `view_mm_list`    | Mängelmeldungen (Liste)             |
| `mm_detail`                | GET     | Bearer  | `view_mm`         | Mängelmeldung (Detail)              |
| `building_list`            | GET     | Bearer  | `building_view`   | Gebäude                             |
| `building_inspections`     | GET     | Bearer  | `building_view`   | Begehungen (Liste)                  |
| `building_inspection_detail`| GET    | Bearer  | `building_view`   | Begehung (Detail)                   |
| `klima_devices`            | GET     | Bearer  | `view_groups`     | Klimageräte                         |
| `klima_status`             | GET     | Bearer  | `view_groups`     | Klimaanlagen-Status (DB)            |
| `keys_inventory`           | GET     | Bearer  | `keys_view`       | Schlüssel-Bestand                   |
| `keys_issued`              | GET     | Bearer  | `keys_view`       | Ausgegebene Schlüssel               |
| `dashboard_data`           | GET     | Bearer  | –                 | Gesamt-Übersicht                    |
| `projects_list`            | GET     | Bearer  | –                 | Projekte                            |
| `meter_list`               | GET     | Session | –                 | Zähler-Liste (PWA)                  |
| `meter_submit`             | POST    | Session | –                 | Ablesung speichern                  |
| `meter_batch_sync`         | POST    | Session | –                 | Batch-Ablesungen                    |
| `meter_readings`           | GET     | Session | –                 | Ablesungshistorie                   |
| `meter_qr_list`            | GET     | Session | –                 | Zähler mit QR-Code                  |
| `meter_deactivate`         | POST    | Session | –                 | Zähler deaktivieren                 |
| `meter_activate`           | POST    | Session | –                 | Zähler reaktivieren                 |
