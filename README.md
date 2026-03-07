# OfficeMate — Smart Office Management Platform

A full-stack smart office management solution by **SOLUM**, consisting of a Node.js/TypeScript backend, a React web frontend, and a Flutter mobile/desktop app.

---

## Project Structure

```
officemate-bundle/
├── backend/          # Bun.js + TypeScript REST API + WebSockets
├── frontend/         # React 19 + Vite + TypeScript web app
├── officemate/       # Flutter mobile & desktop app
├── docker-compose.yml
├── Dockerfile        # All-in-one single container build
└── nginx-allinone.conf
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | [Bun.js](https://bun.sh) · TypeScript · PostgreSQL · JWT · WebSockets |
| Frontend | React 19 · Vite · TypeScript · React Router · Framer Motion |
| Mobile/Desktop | Flutter 3 · Dart |
| Storage | MinIO (S3-compatible object storage) |
| Infrastructure | Docker · Docker Compose · Nginx |

---

## Quick Start (Docker Compose)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed

### 1. Clone the repository
```bash
git clone https://github.com/MVREDDY-STI/officemate-bundle.git
cd officemate-bundle
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set secure values:
```env
POSTGRES_DB=officemate
POSTGRES_USER=solum
POSTGRES_PASSWORD=your_strong_password

JWT_SECRET=your_long_random_secret_at_least_32_chars
```

### 3. Start all services
```bash
docker compose up --build
```

The web app will be available at **http://localhost**

| Service | URL |
|---------|-----|
| Web App (Frontend) | http://localhost |
| Backend API | http://localhost/api |
| MinIO Console | http://localhost:9001 |

---

## Local Development

### Backend

**Requirements:** [Bun](https://bun.sh) v1.3+, PostgreSQL 16

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
bun install
bun run db:migrate     # run schema migrations
bun run db:seed        # optional: seed sample data
bun run dev            # starts with hot reload on :3000
```

### Frontend

**Requirements:** Node.js 20+

```bash
cd frontend
npm install
npm run dev            # starts Vite dev server on :5173
```

### Flutter App

**Requirements:** Flutter SDK 3.x, Dart SDK ^3.11

```bash
cd officemate
flutter pub get
flutter run            # runs on connected device or emulator
```

---

## Environment Variables

### Root `.env` (used by Docker Compose)

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `officemate` |
| `POSTGRES_USER` | Database user | `solum` |
| `POSTGRES_PASSWORD` | Database password | *(required)* |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | *(required)* |
| `S3_ACCESS_KEY` | MinIO/S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | MinIO/S3 secret key | `minioadmin123` |
| `S3_BUCKET` | S3 bucket name | `officemate` |

### Backend `.env`

See `backend/.env.example` for full backend-specific variables including `DATABASE_URL` and `PORT`.

---

## API Overview

The backend exposes a REST API under `/api/` with the following route groups:

| Route | Description |
|-------|-------------|
| `POST /api/auth/login` | User authentication |
| `GET /api/rooms` | List meeting rooms |
| `POST /api/bookings` | Create a room booking |
| `GET /api/bookings` | List bookings |
| `GET /api/events` | Office events |
| `GET /api/assets` | Office assets |
| `GET /api/team` | Team management |
| `GET /api/guests` | Guest management |
| `GET /api/support` | Support tickets |
| `GET /api/content` | CMS content |
| `WS /ws` | Real-time WebSocket hub |

Full Swagger/OpenAPI spec is available at `/api/docs` when the backend is running.

---

## Docker Services

| Container | Image | Purpose |
|-----------|-------|---------|
| `officemate_db` | postgres:16-alpine | PostgreSQL database |
| `officemate_minio` | minio/minio | S3-compatible file storage |
| `officemate_backend` | built from `backend/` | Bun.js API server |
| `officemate_frontend` | built from `frontend/` | Nginx serving React app |

---

## Scripts

### Backend
```bash
bun run dev          # Development with hot reload
bun run start        # Production start
bun run db:migrate   # Run database migrations
bun run db:seed      # Seed sample data
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Flutter
```bash
flutter pub get      # Install dependencies
flutter run          # Run on device/emulator
flutter build apk    # Build Android APK
flutter build ios    # Build iOS (macOS required)
flutter build web    # Build web
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

Private — SOLUM. All rights reserved.
