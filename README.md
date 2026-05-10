# StackForge

StackForge is a full-stack collaborative project board where tasks are represented as collectible-style cards. Campaigns map to projects, cards move across board columns from deck to victory, and every task carries rarity, difficulty, and XP.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT auth
- Frontend: React, Vite, TypeScript, Zustand, Tailwind CSS
- UX: Dark-mode-first board with draggable task cards and modal card editing

## Project Structure

```text
.
├── client
│   ├── src
│   │   ├── components
│   │   │   ├── board
│   │   │   ├── cards
│   │   │   └── ui
│   │   ├── context
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── types
│   │   ├── utils
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server
│   ├── prisma
│   │   └── schema.prisma
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── types
│   │   ├── utils
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
└── README.md
```

## Implemented Flow

The scaffold includes a working vertical slice for:

1. Register or log in with JWT auth.
2. Create a project campaign.
3. Create a task card inside that project.
4. Drag the card between `Deck`, `In Play`, `Blocked`, `Review`, and `Victory`.

## Backend API Highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/:projectId`
- `GET /api/cards/project/:projectId`
- `POST /api/cards`
- `PATCH /api/cards/:cardId`
- `POST /api/cards/:cardId/move`
- `POST /api/cards/:cardId/assign`

Controllers stay thin, services own business logic, auth is middleware-based, and payload validation uses Zod.

## Local Setup

### 1. Configure the backend

```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

The default backend runs on `http://localhost:4000`.

### 2. Configure the frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The default frontend runs on `http://localhost:5173`.

## Environment Variables

### Server

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stackforge?schema=public"
JWT_SECRET="change-me"
PORT="4000"
CLIENT_URL="http://localhost:5173"
```

### Client

```env
VITE_API_URL="http://localhost:4000/api"
VITE_PORTFOLIO_URL="https://your-portfolio.example.com"
```

## Notes

- The Prisma schema includes `User`, `Project`, `Card`, and `ChecklistItem` models.
- Card fields include rarity, XP, checklist items, tags, status, and optional assignee.
- The client uses Zustand for board state and React Context for auth state.
- Both the server and client builds complete successfully.
- The public site includes footer links for features, demo, documentation, terms, privacy, GitHub, and direct admin messages.

