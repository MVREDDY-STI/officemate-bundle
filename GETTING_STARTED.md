# OfficeMate — Getting Started Guide

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose
- Git
- Terminal/CLI access

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/MVREDDY-STI/officemate-bundle.git
cd officemate-bundle

# Copy environment file
cp .env.example .env
# (Default values are suitable for local development)
```

### 2. Start Docker Containers

```bash
docker compose up -d
```

**What happens:**
- PostgreSQL database starts with schema + migrations (auto-applied)
- MinIO object storage starts
- Backend (Bun.js) starts and connects to DB
- Frontend (React) starts and proxies through Nginx

**Verify services are healthy:**
```bash
docker compose ps
```

All services should show `Up` status. First startup may take 2-3 minutes.

### 3. Access the Application

| Component | URL | Credentials |
|-----------|-----|-------------|
| **Frontend** | http://localhost | See note below |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin123 |
| **PostgreSQL** | localhost:5432 | solum / password |

**Frontend Demo Accounts:**
```
Email: admin@example.com
Password: password

Email: user@example.com
Password: password
```

Or sign up a new account (admin approval not required by default).

### 4. Flutter TV App (Optional)

```bash
cd officemate/
flutter run -d macos  # (or -d linux, -d windows, -d chrome)
```

Then in the Flutter terminal, press `r` for hot reload or `R` for hot restart.

**TV App Setup:**
1. Get pairing code from Frontend → TV Setup → Generate Code
2. In Flutter app, enter pairing code + backend URL
3. App connects and displays meeting room bookings

---

## Database Setup

See **[DB_SETUP.md](DB_SETUP.md)** for detailed database information.

### PostgreSQL Quick Access

```bash
# Connect to database
docker exec -it officemate_db psql -U solum -d officemate

# Example query: List all users
SELECT id, email, name, role, is_approved FROM users;

# Example query: List bookings
SELECT b.id, r.name AS room, b.title, b.booking_date, b.start_slot, b.end_slot
FROM bookings b
JOIN rooms r ON b.room_id = r.id
ORDER BY b.booking_date DESC
LIMIT 10;
```

**Credentials:**
- Username: `solum`
- Password: `password`
- Database: `officemate`
- Host: `localhost:5432`

---

## Project Structure

```
officemate-bundle/
├── backend/                 # Bun.js backend (TypeScript)
│   ├── src/
│   │   ├── routes/         # API endpoints (/api/v1/*)
│   │   ├── db/             # Database client & migrations
│   │   ├── middleware/     # Auth, validation
│   │   └── ws/             # WebSocket hub for real-time
│   └── Dockerfile
│
├── frontend/                # React + Vite (TypeScript)
│   ├── src/
│   │   ├── pages/          # Page components (/dashboard/*)
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context (global state)
│   │   └── services/       # API calls, auth
│   ├── nginx.conf          # Reverse proxy setup
│   └── Dockerfile
│
├── officemate/              # Flutter TV App (Dart)
│   ├── lib/
│   │   ├── screens/        # App screens
│   │   ├── widgets/        # UI widgets
│   │   ├── services/       # API, WebSocket, config
│   │   ├── models/         # Data models
│   │   └── theme/          # Colors, sizing, fonts
│   └── pubspec.yaml        # Flutter dependencies
│
├── docker-compose.yml       # Services orchestration
├── .env.example             # Environment template
├── DB_SETUP.md              # Database documentation
└── README.md                # Project overview
```

---

## Common Tasks

### Run Backend Tests (if available)
```bash
docker compose exec backend bun test
```

### Rebuild Frontend Bundle
```bash
docker compose build frontend && docker compose up -d frontend
```

### View Backend Logs
```bash
docker compose logs -f backend
```

### View Database Logs
```bash
docker compose logs -f db
```

### Reset Everything
```bash
# Stop and remove all containers + volumes
docker compose down -v

# Restart everything fresh
docker compose up -d
```

### Access MinIO Console
```
URL: http://localhost:9001
Username: minioadmin
Password: minioadmin123
```

Create a bucket named `officemate` if it doesn't exist.

### Connect to Database with pgAdmin

1. **Install pgAdmin locally or use Docker:**
   ```bash
   docker run -p 5050:80 dpage/pgadmin4
   ```

2. **Access pgAdmin:** http://localhost:5050

3. **Add Server:**
   - Server name: `officemate-db`
   - Host: `host.docker.internal` (or your machine IP)
   - Port: `5432`
   - Username: `solum`
   - Password: `password`
   - Database: `officemate`

---

## Environment Variables

Key variables in `.env` (optional, defaults provided):

```bash
# PostgreSQL
POSTGRES_DB=officemate
POSTGRES_USER=solum
POSTGRES_PASSWORD=password

# JWT Secret (required for auth, but defaults to dev key)
JWT_SECRET=change_me_to_a_long_random_secret_at_least_32_chars

# MinIO (S3 storage)
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=officemate

# Frontend
VITE_API_URL=        # Empty = use relative URLs (proxied by Nginx)
```

See `.env.example` for all available options.

---

## API Documentation

### Key Endpoints

**Authentication:**
- `POST /api/v1/auth/login` — User login
- `POST /api/v1/auth/signup` — User registration
- `POST /api/v1/auth/refresh` — Refresh JWT token

**Bookings:**
- `GET /api/v1/bookings/mine` — User's bookings
- `POST /api/v1/bookings` — Create booking
- `PATCH /api/v1/bookings/{id}/cancel` — Cancel booking
- `DELETE /api/v1/bookings/{id}` — Delete booking

**Rooms:**
- `GET /api/v1/rooms` — List all rooms
- `POST /api/v1/rooms` — Create room (admin)

**TV Display:**
- `POST /api/v1/displays/pair-code` — Generate pairing code (admin)
- `POST /api/v1/displays/register` — Register TV device
- `GET /api/v1/displays/me/bookings?date=YYYY-MM-DD` — Get today's bookings (TV)
- `GET/POST/PATCH /api/v1/slides` — Manage display slides (admin)

For full API details, see backend source code in `backend/src/routes/`.

---

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
```bash
docker compose ps  # Check if db container is running
docker compose logs db  # Check logs
docker compose restart db  # Restart the database
```

### Frontend Won't Load
```bash
docker compose logs frontend  # Check for build errors
docker compose build frontend  # Rebuild
docker compose up -d frontend
```

### Backend Returns 503/Health Check Failing
```bash
docker compose logs backend
docker compose exec backend curl http://localhost:3000/health
```

### Flutter App Can't Connect
- Check backend URL in Flutter app settings
- Use `http://localhost:3000` if running on same machine
- Use machine IP if running on different machine
- Check firewall settings (port 3000, 80)

### Missing `is_approved` Column Error
The database schema is missing the user approval migration. See [DB_SETUP.md](DB_SETUP.md) for fixing this.

---

## Next Steps

1. **Book a Meeting Room**
   - Login to frontend
   - Navigate to "Book Room"
   - Select date, time, and room
   - Enter meeting subject and book

2. **View on TV Display**
   - Pair a Flutter TV app using the pairing code
   - Bookings will appear automatically on the display

3. **Create Display Slides**
   - Go to "TV Setup" → "Slides"
   - Add custom slides (text, quotes, images, birthdays)
   - They'll rotate on all paired displays

4. **Manage Users** (Admin)
   - Go to "User Management" tab
   - Approve new registrations
   - Change user roles
   - Delete inactive users

5. **Customize Branding**
   - Go to "TV Setup" → "Branding"
   - Upload logo
   - Change sidebar theme color
   - Updates appear live on all TVs

---

## Support & Resources

- **Documentation:** See markdown files in project root
- **GitHub Issues:** Report bugs or feature requests
- **API Logs:** `docker compose logs backend`
- **Database Logs:** `docker compose logs db`
- **Frontend Console:** Open browser DevTools (F12)

---

## Shutdown

```bash
# Stop containers (keeps data)
docker compose stop

# Stop and remove containers (keeps data)
docker compose down

# Stop and remove everything including data
docker compose down -v

# Start again
docker compose up -d
```
