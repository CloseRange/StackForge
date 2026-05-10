# StackForge

> **A gamified, card-based project management platform** that transforms task tracking into an engaging collaborative experience.

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

StackForge reimagines project management through the lens of collectible card games. Transform your team's workflow into an engaging, visual experience where:

- **Campaigns** = Projects that define your goals
- **Cards** = Tasks with rarity tiers, difficulty levels, and XP values
- **Board States** = Status columns (`Deck` → `In Play` → `Blocked` → `Review` → `Victory`)
- **Gamification** = Track team progress through XP, difficulty ratings, and milestone achievements

Perfect for teams that want task management to be engaging, visual, and fun—not just another todo list.

## ✨ Key Features

### Core Functionality
- 🎯 **Intuitive Kanban Board** — Drag-and-drop cards between status columns
- 👥 **Collaborative Workspace** — Multi-user projects with role-based access
- 🎮 **Gamification** — Difficulty tiers, XP tracking, and rarity classifications
- 📊 **Visual Task Details** — Rich card editing with checklists, tags, and descriptions
- 🌙 **Dark Mode First** — Sleek, modern UI optimized for focus and extended use

### Technical Highlights
- ✅ **Type-Safe** — Full TypeScript across client and server
- 🔐 **Secure Auth** — JWT-based authentication with best practices
- 💾 **Scalable Database** — PostgreSQL with Prisma ORM and migrations
- ⚡ **Fast Frontend** — React + Vite with optimized bundle size
- 🏗️ **Clean Architecture** — Service layer pattern, thin controllers, middleware-based validation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│  (Vite, Tailwind CSS, Zustand, @dnd-kit)              │
├─────────────────────────────────────────────────────────┤
│             Express.js REST API (TypeScript)            │
│  (JWT Auth, Zod Validation, Service Layer)             │
├─────────────────────────────────────────────────────────┤
│         PostgreSQL + Prisma ORM                         │
│  (Typed Models, Migrations, Query Builder)             │
└─────────────────────────────────────────────────────────┘
```

## 📋 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Lightning-fast bundler |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | State management (board) |
| **@dnd-kit** | Accessible drag-and-drop |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime |
| **Express.js** | HTTP server |
| **TypeScript** | Type safety |
| **Prisma** | ORM & migrations |
| **PostgreSQL** | Primary database |
| **JWT** | Authentication |
| **Zod** | Schema validation |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 12+ (local or cloud)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/closerange/stackforge.git
cd stackforge

# Install all dependencies
npm install:all

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Configure your database URL in server/.env
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/stackforge"

# Run migrations and seed
cd server
npx prisma migrate dev

# Start both client and server
cd ..
npm run dev
```

**Frontend runs on:** `http://localhost:5173`  
**Backend runs on:** `http://localhost:4000`

### Environment Variables

#### Server (`server/.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/stackforge"

# Server Config
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Auth
JWT_SECRET=your-secret-key-change-this-in-production
```

#### Client (`client/.env`)
```env
# API
VITE_API_URL=http://localhost:4000/api

# Optional: Portfolio or home page URL
VITE_PORTFOLIO_URL=https://yourportfolio.com
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/login` — Authenticate and receive JWT
- `POST /api/auth/logout` — Invalidate session

### Projects
- `GET /api/projects` — Fetch user's projects
- `POST /api/projects` — Create new project
- `PATCH /api/projects/:projectId` — Update project
- `DELETE /api/projects/:projectId` — Delete project

### Cards (Tasks)
- `GET /api/cards/project/:projectId` — Fetch project cards
- `POST /api/cards` — Create new card
- `PATCH /api/cards/:cardId` — Update card details
- `POST /api/cards/:cardId/move` — Move card between columns
- `POST /api/cards/:cardId/assign` — Assign card to team member

### Activity & Notifications
- `GET /api/activity/:projectId` — Project activity log
- `GET /api/notifications` — User notifications

## 🏛️ Project Structure

```
stackforge/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── board/              # Kanban board view
│   │   │   ├── cards/              # Card editor & display
│   │   │   ├── header/             # Navigation & tabs
│   │   │   └── ui/                 # Base UI components
│   │   ├── pages/                  # Route pages
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API clients
│   │   ├── context/                # React Context (auth)
│   │   ├── types/                  # TypeScript definitions
│   │   └── utils/                  # Helpers & utilities
│   ├── tailwind.config.js          # Styling configuration
│   └── vite.config.ts              # Build configuration
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── controllers/            # Request handlers
│   │   ├── services/               # Business logic
│   │   ├── middleware/             # Auth, validation, error handling
│   │   ├── models/                 # Data models
│   │   ├── routes/                 # API routes
│   │   ├── types/                  # TypeScript definitions
│   │   └── utils/                  # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # Database migrations
│   └── tsconfig.json               # TypeScript config
│
├── scripts/                         # Build & utility scripts
├── package.json                    # Root workspace config
└── README.md                       # This file
```

## 🔄 Data Model

### Core Entities

**User**
- ID, Email, Password (hashed)
- Created/Updated timestamps
- Relations: Projects (owner), Cards (assigned)

**Project**
- ID, Name, Description, Owner ID
- Created/Updated timestamps
- Relations: Cards, Project Members

**Card (Task)**
- ID, Title, Description
- Difficulty (1–10), XP Value, Rarity
- Status (Deck, In Play, Blocked, Review, Victory)
- Tags, Checklist Items
- Relations: Project, assigned User

**ChecklistItem**
- ID, Label, Completed flag
- Relation: Card

See [server/prisma/schema.prisma](server/prisma/schema.prisma) for full schema.

## 🔐 Security

- **Authentication**: JWT tokens with secure secret key
- **Validation**: All endpoints validate input with Zod schemas
- **CORS**: Configured to allow frontend origin only
- **Password Hashing**: bcrypt with salt rounds
- **Authorization**: Middleware enforces user context on protected routes
- **SQL Injection**: Prevented via Prisma's parameterized queries

## 🛠️ Development

### Scripts

```bash
# Root workspace
npm run install:all       # Install all dependencies
npm run dev              # Start both server & client concurrently
npm run build            # Build both, deploy-ready
npm run start            # Build and start production

# Server only
npm run server:dev       # Start server with hot reload
npm run server:build     # Build TypeScript

# Client only
npm run client:dev       # Start Vite dev server
npm run client:build     # Production build
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint (with React and TypeScript plugins)
- **Formatting**: Consistent with Prettier
- **Git Hooks**: Pre-commit linting (optional setup)

## 📦 Database Migrations

Prisma handles versioning:

```bash
cd server

# Create a new migration
npx prisma migrate dev --name add_feature

# Apply pending migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

All migrations are tracked in [server/prisma/migrations/](server/prisma/migrations/).

## 🚢 Deployment

### Production Build

```bash
npm run build
cd server
npm start
```

The frontend is bundled and served from `server/public/`.

### Environment Setup

Before deploying:
1. Set a strong `JWT_SECRET`
2. Configure production `DATABASE_URL` (Supabase, RDS, etc.)
3. Set `NODE_ENV=production`
4. Update `CLIENT_URL` to your domain
5. Enable CORS for your frontend domain

### Platform Examples

- **Railway**, **Render**, **Fly.io** — Great for Node.js + PostgreSQL
- **Vercel** (frontend only) + **node backend** on dedicated host
- **Docker** — Included in many deployment platforms

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code is TypeScript with no `any` types
- Components follow React best practices
- New features include tests or examples
- Commit messages are clear and descriptive

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 💬 Support & Feedback

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/closerange/stackforge/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/closerange/stackforge/discussions)

## 🙏 Acknowledgments

Built with inspiration from:
- Kanban methodology for visual workflow management
- Collectible card games for engagement and gamification
- Modern web stack best practices (TypeScript, React, Prisma)

---

**Made with ❤️ by Michael Hulbert**  
[GitHub](https://github.com/closerange) • [LinkedIn](https://www.linkedin.com/in/michael-hulbert-387a1016a)

