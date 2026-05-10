# StackForge Setup Guide

Complete setup guide for running StackForge locally and in production.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Database Setup Options](#database-setup-options)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 12+ (or cloud PostgreSQL instance)
- **Git**

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/yourusername/stackforge.git
cd stackforge

# Install workspace dependencies
npm install:all
```

### 2. Set Up Database

Choose one option below:

#### Option A: Local PostgreSQL (macOS with Homebrew)

```bash
# Install PostgreSQL if not already installed
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create a database
createdb stackforge

# Verify connection
psql stackforge -c "SELECT version();"
```

Your connection string: `postgresql://postgres@localhost:5432/stackforge`

#### Option B: Docker PostgreSQL

```bash
docker run --name stackforge-postgres \
  -e POSTGRES_DB=stackforge \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  -d postgres:15

# Verify connection
docker exec stackforge-postgres psql -U postgres -d stackforge -c "SELECT version();"
```

Your connection string: `postgresql://postgres@localhost:5432/stackforge`

#### Option C: Cloud PostgreSQL (Supabase, AWS RDS, Render)

1. Create a PostgreSQL instance with your provider
2. Note the connection string
3. Example Supabase connection:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

### 3. Configure Backend Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/stackforge"
NODE_ENV=development

# Server Config
PORT=4000
CLIENT_URL=http://localhost:5173

# Authentication
JWT_SECRET=dev-secret-key-change-in-production-12345
```

> ⚠️ **Security**: Use a strong random `JWT_SECRET` in production!

### 4. Run Database Migrations

```bash
cd server

# Run migrations and generate Prisma client
npx prisma migrate dev

# (Optional) Seed demo data
# npx prisma db seed
```

Verify the database schema:

```bash
npx prisma studio  # Opens Prisma Studio UI on port 5555
```

### 5. Configure Frontend Environment

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:4000/api

# Optional: Your portfolio or home page
VITE_PORTFOLIO_URL=https://yourportfolio.com
```

### 6. Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts both server and client concurrently.

**Access:**
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:4000](http://localhost:4000)
- Prisma Studio: [http://localhost:5555](http://localhost:5555)

### 7. Test the Full Flow

1. Open [http://localhost:5173](http://localhost:5173) in your browser
2. **Register**: Create an account
3. **Create Project**: Click "New Campaign"
4. **Create Card**: Add a task
5. **Drag**: Move cards between status columns

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Strong `JWT_SECRET` (32+ characters, random)
- [ ] Production database URL set
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` set to your domain
- [ ] CORS configured for your domain
- [ ] Database backups enabled
- [ ] Logs configured

### Build for Production

```bash
npm run build
```

This creates:
- `/client/dist/` → Optimized React bundle
- `/server/dist/` → Compiled TypeScript
- The build script automatically copies frontend to `/server/public/`

### Start Production Server

```bash
cd server
NODE_ENV=production npm start
```

Server runs on port 4000 (or configured `PORT`).

### Environment Variables for Production

```env
NODE_ENV=production
PORT=4000

# Use a strong, random secret
JWT_SECRET=your-long-random-secret-key-here-do-not-share

# Production database
DATABASE_URL=postgresql://user:password@prod-host:5432/stackforge

# Your production domain
CLIENT_URL=https://yourdomain.com

# Optional monitoring/logging
# LOG_LEVEL=info
# SENTRY_DSN=https://...
```

### Deployment Platforms

#### Railway

1. Connect your GitHub repo
2. Select Node.js environment
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy with one click

#### Render

```yaml
# render.yaml
services:
  - type: web
    name: stackforge
    runtime: node
    buildCommand: npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
    databases:
      - name: stackforge-db
```

#### Vercel + Self-Hosted Backend

- Deploy frontend to Vercel (from `/client/dist`)
- Host backend on Railway, Render, or your own server
- Set `VITE_API_URL` to your backend domain

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install:all && npm run build
EXPOSE 4000
CMD ["npm", "start"]
```

```bash
docker build -t stackforge .
docker run -p 4000:4000 -e DATABASE_URL=... stackforge
```

---

## Database Setup Options

### Initial Schema

Run migrations to create all tables:

```bash
cd server
npx prisma migrate deploy
```

### View Current Schema

```bash
npx prisma introspect  # Introspect existing database
npx prisma studio     # Web UI to browse data
```

### Create a New Migration

```bash
# After modifying schema.prisma
npx prisma migrate dev --name descriptive_name

# Empty migration (manual SQL)
npx prisma migrate dev --name empty --create-only
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset  # Warns before destructive action
```

---

## Environment Configuration

### Server Defaults

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `4000` | HTTP server port |
| `NODE_ENV` | `development` | Set to `production` when deployed |
| `DATABASE_URL` | Required | PostgreSQL connection string |
| `JWT_SECRET` | Required | Secret key for signing JWTs (min 30 chars) |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |

### Client Defaults

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `http://localhost:4000/api` | Backend API base URL |
| `VITE_PORTFOLIO_URL` | (optional) | Your portfolio homepage |

---

## Troubleshooting

### Database Connection Errors

**Problem**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# macOS: Start Postgres with Homebrew
brew services start postgresql

# Docker: Check container status
docker ps -a | grep postgres
docker start stackforge-postgres
```

### Migration Errors

**Problem**: `Migration cannot be applied to the current state`

**Solutions**:
```bash
# Reset and start fresh (dev only)
npx prisma migrate reset

# Or manually resolve conflicts
npx prisma migrate resolve --rolled-back 002_migration_name
```

### "Invalid token" / "Unauthorized"

- Verify `JWT_SECRET` is the same in server and Prisma
- Check that auth middleware is applied to protected routes
- Inspect JWT payload: use [jwt.io](https://jwt.io)

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:4000/api/health

# Check VITE_API_URL in client/.env
grep VITE_API_URL client/.env

# Check browser console for CORS errors
# Verify CLIENT_URL in server/.env allows frontend URL
```

### Docker PostgreSQL Permissions

```bash
# Connect to container
docker exec -it stackforge-postgres psql -U postgres -d stackforge

# Create a non-root user
CREATE USER stackforge WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE stackforge TO stackforge;
```

### Out of Memory During Build

```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

---

## Learning Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Support

Stuck? Check [GitHub Issues](https://github.com/yourusername/stackforge/issues) or start a [Discussion](https://github.com/yourusername/stackforge/discussions).
├── client/                  # Vite + React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # React hooks (auth, board state)
│   │   ├── services/       # API calls
│   │   ├── context/        # Auth context
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Auth

- `POST /api/auth/register` — Sign up
- `POST /api/auth/login` — Sign in

### Projects

- `GET /api/projects` — List your projects
- `POST /api/projects` — Create a project
- `GET /api/projects/:projectId` — Get project details
- `PATCH /api/projects/:projectId` — Update project
- `DELETE /api/projects/:projectId` — Delete project

### Cards

- `GET /api/cards/project/:projectId` — List cards in a project
- `POST /api/cards` — Create a card
- `PATCH /api/cards/:cardId` — Update a card
- `POST /api/cards/:cardId/move` — Move card to a different column
- `POST /api/cards/:cardId/assign` — Assign card to a user
- `DELETE /api/cards/:cardId` — Delete a card

All endpoints except auth require a bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The frontend gets this token after sign in and attaches it automatically.

## What's Next

- Add project membership (invite other users)
- Add more card fields (comments, attachments, etc.)
- Add notifications
- Deploy to production (Vercel for frontend, Railway/Render for backend)
