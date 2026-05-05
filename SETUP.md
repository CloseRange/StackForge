# StackForge Setup Guide

Get the backend and frontend running against Supabase in 5 minutes.

## Prerequisites

- Node.js 18+
- A Supabase project (free tier works fine)
- `psql` or access to Supabase SQL Editor

## 1. Set up the database

### Option A: Supabase SQL Editor (easiest)

1. Go to your Supabase project → SQL Editor
2. Create a new query
3. Copy the contents of `server/prisma/migrations/001_initial_schema.sql`
4. Paste into the query editor
5. Click **Run**

The migration is idempotent — safe to run multiple times.

### Option B: psql (if you prefer CLI)

```bash
psql postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres \
  -f server/prisma/migrations/001_initial_schema.sql
```

Find `YOUR_PASSWORD` and `YOUR_PROJECT_REF` in Supabase project settings.

## 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your Supabase credentials:

```env
PORT=3000
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

Find these keys in Supabase:
- **Project Settings → API** for `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Project Settings → API** (scroll down) for `SUPABASE_SERVICE_ROLE_KEY`

## 3. Start the backend

```bash
cd server
npm install
npm run dev
```

You should see:

```
StackForge server listening on port 3000
```

Test the server:

```bash
curl http://localhost:3000/health
```

Should return `{"status":"ok"}`.

## 4. Configure the frontend

```bash
cd client
cp .env.example .env
```

Edit `client/.env` (usually fine as-is, but verify):

```env
VITE_API_URL=http://localhost:3000/api
```

## 5. Start the frontend

```bash
cd client
npm install
npm run dev
```

You should see:

```
  VITE v6.X.X  ready in XXXms

  ➜  Local:   http://localhost:5173/
```

Go to `http://localhost:5173` in your browser.

## 6. Test the full flow

1. **Sign up**: Create an account with email/password
2. **Create a project**: Click "New Campaign", fill in name + description
3. **Create a card**: Click "+ Add Card"
4. **Drag to move**: Drag cards between columns (`Deck` → `In Play` → `Review` → `Victory`)

## Troubleshooting

### "Cannot find module" errors in backend

Run `npm install` again to ensure all deps are installed.

### "Invalid token" when signing in

- Check that `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify the database migration ran successfully in Supabase

### Frontend API calls fail

- Ensure backend is running on port 3000
- Check `VITE_API_URL` in `client/.env`
- Look at browser DevTools Network tab to see actual errors

### "Email is already registered" on sign up

This is normal — Supabase Auth prevents duplicate emails. Just use a different email or try sign in instead.

## Project Structure

```
StackForge/
├── server/                  # Express backend
│   ├── src/
│   │   ├── config/         # Supabase & env config
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic (Supabase queries)
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # Express routes
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   └── migrations/     # SQL schema
│   └── package.json
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
