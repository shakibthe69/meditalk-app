# MediTalk

MediTalk — AI-powered patient‑engagement healthcare platform. Patients log medicines
and get reminder alerts, doctors share posts, admins monitor adherence and conversations,
and a picture of a prescription is read by OCR → structured JSON by Gemini.

An Android app (Expo / React Native) + a Spring Boot (Java 17) + MySQL backend. Repo root
contains one top-level `README.md`; details for each part live in:
`backend/README.md`, `mobile/README.md`.

---

## Table of contents

1. [Architecture](#architecture)
2. [Quick start — local development](#quick-start--local-development)
3. [Production — full runbook](#production--full-runbook)
4. [Environment variables reference](#environment-variables-reference)
5. [API overview](#api-overview)
6. [Scripting the installs](#scripting-the-installs)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [FAQ / troubleshooting](#faq--troubleshooting)

---

## Architecture

```
mobile/                       Expo (React Native 0.7x) + Expo Router
  src/services/api/*           apiClient.ts, auth, prescriptionApi, aiChatService,
  src/components/*             ui, prescriptions/*, medicines/*, admin/*, notifications
backend/                      Spring Boot 3.x (Java 17), Maven wrapper
  src/main/java/com/meditalk/  controllers, services, repositories, dto, entities
  src/main/resources/
    application.yml            all feature config, driven from env vars
```

**Data flow**

1. Patient takes a photo → smartphone uploads to `POST /api/prescriptions/ocr` (multipart).
2. Backend preprocesses → OCR.space (primary) → fallback Google Cloud Vision (backup) →
   Gemini structured extraction (`PRESCRIPTION_GEMINI_API_KEY`) → deterministic parser fallback.
   Returns `draft` + `requiresUserVerification`.
3. Structured result saved to DB via `PrescriptionController` → async AI chat reads
   confirmed medication list (never raw OCR text).

## Quick start — local development

### 1) MySQL

XAMPP (or any MySQL >= 8). Create the database and import the schema:

```bash
mysql -u root -p < backend/db_info.txt     # or docs/meditalk_schema.sql
```

### 2) Backend

```bash
cd backend
cp .env.example .env          # add your real API keys below
# Optional but recommended: set JAVA_HOME to a JDK 17
./mvnw spring-boot:run
# default port: 8080
```

### 3) Mobile (web)

```bash
cd mobile
npx expo start
# web → http://localhost:8081
```

### 4) Mobile (iOS / Android)

The **Expo Go** app on the device scans a QR from `npx expo start`. Metro prints it on
startup — if it is not shown in this terminal, enter the URL manually:

```
exp://<LAN-IP>:8081
```

Replace `<LAN-IP>` with the IP of the dev machine on your LAN (e.g. `192.168.1.20`).

---

## Production — full runbook

### a) Backend on a host (e.g. a VPS / Pi / AWS EC2, port 8080)

```bash
cd backend
# 1) JDK 17
sudo apt install -y openjdk-17-jdk    # Debian/Ubuntu
# 2) MySQL running and reachable
# 3) Copy .env from .env.example and fill in keys
./mvnw -Dspring-boot.run.jvmArguments="-Xmx1024m" spring-boot:run
```

Systemd unit example (replace `YOUR_USER`):

```ini
[Unit]
Description=Meditalk backend
After=network.target mysql.service

[Service]
User=YOUR_USER
WorkingDirectory=/opt/meditalk/backend
ExecStart=/opt/meditalk/backend/mvnw spring-boot:run
Restart=always
Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"

[Install]
WantedBy=multi-user.target
```

Enable & start: `sudo systemctl enable --now meditalk-backend`.

### b) Mobile — build the native APK/IPA (no Expo Go needed in production)

```bash
cd mobile
# Android
npx expo prebuild --platform android      # then open android/app in Android Studio
# iOS
npx expo prebuild --platform ios          # requires Xcode on macOS, codesign
```

Or ship a bare project with `expo run:android` / `expo run:ios`.

### c) Run on the phone over the LAN

The device needs `EXPO_PUBLIC_API_BASE_URL` (or `apiClient` falls back to Metro's host)
pointing at the machine where the backend runs. In production you can:

- keep the dev server running on the **backend machine** and set the env var on the
  device to `http://<backend-LAN-IP>:8080`, **or**
- run the backend behind a TLS reverse proxy (see below).

---

## Environment variables reference

Copy `backend/.env.example` → `backend/.env` and fill in the values. **Never commit**
`backend/.env` (it is git-ignored).

| Variable | Description | Default |
|---|---|---|
| `OCR_SPACE_ENABLED` | Enable OCR.space | `true` |
| `OCR_SPACE_API_KEY` | OCR.space free/paid key | *(none)* |
| `OCR_SPACE_LANGUAGE` | `eng` \| `auto` | `eng` |
| `OCR_SPACE_ENGINE` | 2 = printed text | `2` |
| `OCR_SPACE_TIMEOUT_SECONDS` | Upload/send timeout | `45` |
| `OCR_SPACE_MAX_PAYLOAD_BYTES` | Free-plan limit (1 MB) | `1000000` |
| `OCR_SPACE_PAID_PLAN` | True = larger uploads | `false` |
| `GOOGLE_VISION_ENABLED` | Enable Cloud Vision fallback for OCR | `true` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service-account JSON (Vision) | *(none)* |
| `GOOGLE_CLOUD_API_KEY` | API key for Vision REST | *(none)* |
| `GEMINI_VERTEX_EXPRESS` | `true` for `AQ.` Vertex keys, `false` for `AIza…` | `false` |
| `GEMINI_API_KEY` | Shared fallback for generic chat models | *(none)* |
| `PRESCRIPTION_GEMINI_API_KEY` | Structured extraction (OCR → JSON) | *(none)* |
| `HEALTH_CHAT_GEMINI_API_KEY` | Patient-facing AI chat model | *(none)* |
| `HEALTH_CHAT_GEMINI_MODEL` | Model for health chat (overrides `GEMINI_MODEL`) | *(none)* |
| `HEALTH_CHAT_GEMINI_MODEL` | Generic chat default `gemini-3.8-flash` | `gemini-3.8-flash` |
| `GEMINI_MAX_OUTPUT_TOKENS` | | `800` |
| `GEMINI_TEMPERATURE` | | `0.3` |
| `GEMINI_TIMEOUT_SECONDS` | | `45` |
| `JWT_SECRET` | Secret for signing JWTs | *(fixed in repo)* |
| `WEBRTC_TURN_URL` / `…_USERNAME` / `…_CREDENTIAL` | ICE/TURN for calls | *(none)* |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin panel login | `admin@meditalk.com` / `AdminPass123!` |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile → backend base URL (web/native) | `http://localhost:8080` |

---

## API overview

Base: `http://localhost:8080`. Every JSON envelope: `{ success, message, data, timestamp }`.

### Auth
- `POST /api/auth/register` — patient/doctor registration
- `POST /api/auth/login` — username + password → `{ token }`
- `GET /api/auth/refresh` — refresh expired tokens

### Patients / medicines
- `GET/POST /api/medicines` — list/create
- `GET /api/medicines/:id` — details incl. runs
- `GET /api/medicine-logs/today` — doses logged today
- `GET /api/medicine-logs/adherence` — adherence % and history
- `GET/POST/DELETE /api/prescriptions` — saved prescriptions (draft)
- `POST /api/prescriptions/ocr` — upload image → OCR → draft (multipart; field `image`)
- `POST /api/prescriptions/analyze` — parse free-text manually

### AI / chat
- `POST /api/ai/chat` — health assistant (JSON: `{ message, language, medicationContext, history }`)
- `GET /api/ai/status` — last failure + model list (no secrets)

### Reports / documents
- `GET /api/reports` — list (treated as collection of the authenticated patient)
- `POST /api/reports` — generate (URL, or `userId`+date form)
- `GET /api/reports/download/:id` — PDF
- `GET /api/safety-disclaimer`

### Admin (ADMIN role)
- `GET /api/admin/dashboard` — counts + thresholds
- `GET /api/admin/conversations` — chat list
- `GET/POST /api/admin-chat/...` — admin message thread (see `AdminChatController`)
- `GET /api/admin/medicines` — all medicines (inventory)
- `GET /api/admin/doctors` — all doctors
- `GET /api/admin/users` / `/api/users/profile` — profiles
- `GET /api/admin/monitoring` — drift alerts (reports, inactivity, adherence)
- `GET /api/admin/reports` — all reports (admin view)
- `GET /api/admin/docs` — docs (openapi) export — *(placeholder, not bound to a controller)*

### Doctor panels
- `GET /api/doctors` / `POST /api/doctors` / `DELETE /api/doctors/:id`
- `GET /api/doctor/:id/messages` — text thread
- `GET /api/doctor-posts` / `POST /api/doctor-posts` / `DELETE /api/doctor-posts/:id`
- `GET/POST /api/medicines-info` — OpenFDA drug info
- `GET/POST /api/turn-config` — TURN/STUN (for WebRTC)
- `GET /api/emergency/numbers`, `GET /api/emergency/hospitals`
- `GET /api/diseases/search` — searchable disease library

### WebRTC / realtime
- `GET /ws` — STOMP over WebSocket (`/topic/messages`, `/queue/incoming`)
- `GET /api/turn-config` — ICE servers from `WEBRTC_*` env vars

### Static uploads
- `GET/POST /uploads/**` — files stored under `backend/uploads`

---

## Scripting the installs

See `backend/setup_mysql_admin.bat`, `mobile/README.md`, and `docs/meditalk_schema.sql`.
Typical single machine run:

```bash
# 1. Start MySQL, create DB, import schema
mysql -u root < docs/meditalk_schema.sql

# 2. Backend
cd backend
cp .env.example .env
# fill keys (OCR_SPACE_API_KEY, PRESCRIPTION_GEMINI_API_KEY, HEALTH_CHAT_GEMINI_API_KEY)
./mvnw spring-boot:run &

# 3. Mobile (web)
cd mobile
npx expo start --web --port 8081
```

---

## Deployment

- **Backend** — any Linux host. MySQL on the same host or a separate RDS. Use a reverse
  proxy (Caddy / nginx) + TLS.
- **Mobile** — EAS Build, or `expo prebuild` + native CI. Self-host on the same LAN for
  clinic PCs. Production bundle: `npx expo export:native`.
- **Database** — MySQL 8 (XAMPP / RDS). Back up with `mysqldump`.

---

## Testing

```bash
# Backend (offline)
cd backend && ./mvnw -o -q test

# Mobile types (clean compile)
cd mobile && npx tsc --noEmit

# API contract smoke test
curl -s http://localhost:8080/api/health
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"apitest@meditalk.com","password":"TestPass123!"}'
```

---

## Troubleshooting

- **Phone cannot reach `:8080`** → same Wi-Fi as the dev box; check firewall; use
  `<LAN-IP>`; verify with `curl http://<LAN-IP>:8080/api/health`.
- **OCR returns "service rejected credential"** → wrong `OCR_SPACE_API_KEY`.
- **Vision fallback fails** → `GOOGLE_APPLICATION_CREDENTIALS` points to an invalid
  JSON or the project has no billing.
- **AI chat returns knowledge-engine answer even when configured** → Gemini key is
  blocked at Google; verify `GET /api/ai/status` shows `lastFailure`. Wait a few minutes
  after enabling a previously disabled API.
- **Mobile shows "cannot get http://localhost:8080/..."** → wrong `EXPO_PUBLIC_API_BASE_URL`.

---

Made with 정성을 다해 개발되었습니다. —
© 2026 MediTalk contributors.
