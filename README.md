# HomeBase — Family Command Center

A secure family home automation dashboard built with Next.js, deployed on Cloudflare Pages + Workers.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Cloudflare Pages (Edge)                        │
│  ┌───────────┐  ┌────────────┐  ┌───────────┐  │
│  │ Next.js   │  │ API Routes │  │ Middleware │  │
│  │ Frontend  │──│ /api/auth  │──│ JWT Auth   │  │
│  │ (React)   │  │ /api/...   │  │ Guard      │  │
│  └───────────┘  └─────┬──────┘  └───────────┘  │
│                       │                          │
│  ┌────────────────────┴──────────────────────┐  │
│  │  Cloudflare D1 (SQLite)                   │  │
│  │  Users, Sessions, Audit Log, Settings     │  │
│  └───────────────────────────────────────────┘  │
│                       │                          │
│  ┌────────────────────┴──────────────────────┐  │
│  │  Cloudflare Workers (API proxy)           │  │
│  │  Home Assistant bridge (future)           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │
         │ HTTPS / WebSocket (via Cloudflare Tunnel)
         │
┌────────┴────────┐
│  Home Network   │
│  ┌────────────┐ │
│  │   Home     │ │
│  │ Assistant  │ │
│  │   Server   │ │
│  └────────────┘ │
└─────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Auth**: JWT (jose) + bcryptjs + HttpOnly cookies
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Hosting**: Cloudflare Pages + Workers
- **Home Automation**: Home Assistant REST API (via Cloudflare Tunnel)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Demo accounts:

| Name | Email                  | Password    | Role   |
|------|------------------------|-------------|--------|
| Dad  | dad@thewillsons.com    | admin123    | admin  |
| Mom  | mom@thewillsons.com    | admin123    | admin  |
| Alex | alex@thewillsons.com   | member123   | member |
| Emma | emma@thewillsons.com   | member123   | child  |

### 3. Set Up Cloudflare D1 Database

```bash
# Create the database
npx wrangler d1 create homebase-db

# Copy the database_id from the output and paste it in wrangler.toml

# Run the schema migration
npx wrangler d1 execute homebase-db --file=./schema.sql
```

### 4. Configure Secrets

```bash
# Set a strong JWT secret (generate one with: openssl rand -hex 32)
npx wrangler secret put JWT_SECRET
```

### 5. Deploy to Cloudflare Pages

```bash
npm run deploy
```

### 6. Add Custom Domain

In the Cloudflare dashboard:
1. Go to Workers & Pages → your project
2. Custom domains → Add `thewillsons.com`

## Project Structure

```
homebase-app/
├── src/
│   ├── app/
│   │   ├── api/auth/        # Auth API routes (login, register, me, logout)
│   │   ├── dashboard/       # Protected dashboard page
│   │   ├── layout.tsx       # Root layout with AuthProvider
│   │   └── page.tsx         # Login page (root)
│   ├── components/
│   │   ├── AuthProvider.tsx  # React auth context
│   │   ├── LoginPage.tsx     # Login UI
│   │   └── DashboardPage.tsx # Dashboard UI
│   ├── lib/
│   │   ├── auth.ts          # JWT, password, cookie helpers
│   │   └── users.ts         # User store (swap with D1 in production)
│   ├── styles/
│   │   └── globals.css      # Tailwind + custom styles
│   └── middleware.ts         # Route protection
├── schema.sql               # D1 database schema
├── wrangler.toml             # Cloudflare config
├── tailwind.config.js
├── next.config.js
└── package.json
```

## Security Features

- **HttpOnly cookies** — JWT tokens are never exposed to client-side JavaScript
- **Secure + SameSite=Strict** — cookies only sent over HTTPS, no cross-site leakage
- **bcrypt password hashing** — 12 rounds of salted hashing
- **Middleware route protection** — unauthenticated requests never reach dashboard
- **Admin-only registration** — only admin accounts can create new family members
- **Audit logging** — track who logged in, who changed what (D1 schema ready)

## Roadmap

- [ ] Migrate user store from in-memory to Cloudflare D1
- [ ] Home Assistant API integration via Cloudflare Tunnel
- [ ] Camera feeds (WebRTC / HLS streams)
- [ ] Device controls (locks, vacuum, sprinklers, lights)
- [ ] Family calendar with Google Calendar sync
- [ ] Push notifications via Web Push API
- [ ] Turnstile CAPTCHA on login form
- [ ] Rate limiting on auth endpoints
