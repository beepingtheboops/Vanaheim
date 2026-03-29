# Vanaheim — Willson Family Command Center

A secure family home automation dashboard built with Next.js 14, deployed on Cloudflare Pages + Workers, connected to Home Assistant via Cloudflare Tunnel.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Cloudflare Edge                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Cloudflare Pages (Next.js)            │   │
│  │                                                 │   │
│  │  ┌───────────┐  ┌───────────────┐  ┌────────┐  │   │
│  │  │  Landing  │  │  API Routes   │  │  Auth  │  │   │
│  │  │  /login   │  │  /api/auth    │  │  JWT   │  │   │
│  │  │ Dashboard │  │  /api/ha/*    │  │  Guard │  │   │
│  │  └───────────┘  └──────┬────────┘  └────────┘  │   │
│  └─────────────────────────┼───────────────────────┘   │
│                            │                           │
│  ┌─────────────────────────┼───────────────────────┐   │
│  │        Cloudflare D1    │  (SQLite at edge)      │   │
│  │  Users · Sessions · Audit Log · Passkeys         │   │
│  └─────────────────────────┼───────────────────────┘   │
│                            │                           │
│  ┌─────────────────────────┴───────────────────────┐   │
│  │     Cloudflare Worker (super-rain-384e)          │   │
│  │     HA proxy — JWT verified, token injected      │   │
│  └─────────────────────────┬───────────────────────┘   │
└────────────────────────────┼────────────────────────────┘
                             │ HTTPS via Cloudflare Tunnel
┌────────────────────────────┴────────────────────────────┐
│                  Home Network (192.168.5.x)             │
│                                                         │
│  ThinkCentre (192.168.5.246, Debian 13)                 │
│                                                         │
│  /opt/docker/vanaheim/                                  │
│    └── homeassistant (port 8123)                        │
│                                                         │
│  /opt/docker/infrastructure/                            │
│    ├── cloudflared (Tunnel: vanaheim-ha)                │
│    ├── pihole (port 53)                                 │
│    └── unbound (port 5335)                              │
│                                                         │
│  /opt/docker/plex/                                      │
│    └── sonarr · radarr · prowlarr · qbittorrent         │
│        overseerr · notifiarr · unpackerr                │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Auth**: WebAuthn/Passkeys + JWT (jose) + HttpOnly cookies + Cloudflare Turnstile
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Hosting**: Cloudflare Pages + Workers
- **Home Automation**: Home Assistant via Cloudflare Tunnel + Worker proxy
- **DNS**: Pi-hole + Unbound (recursive resolver on port 5335)
- **Infrastructure**: Docker (3 isolated projects), Debian 13, ThinkCentre

## Security

| Layer | Implementation |
|-------|---------------|
| Auth | WebAuthn passkeys (Face ID/Touch ID) + password fallback |
| Password invalidation | Disabled after passkey registration |
| JWT | HttpOnly + Secure + SameSite=Strict cookies |
| CAPTCHA | Cloudflare Turnstile (server-side verified) |
| Rate limiting | Login endpoint + HA login attempts (5 max) |
| HA proxy | Cloudflare Worker with JWT verification |
| API auth | Pages-level JWT check on all `/api/ha/*` routes |
| WAF | Managed Challenge on `ha.thewillsons.com` |
| Bot protection | Block AI bots + Bot Fight Mode |
| Headers | HSTS, CSP, X-Frame-Options, Permissions-Policy |
| Indexing | robots.txt + noindex meta — not discoverable |
| Secrets | Cloudflare Pages secrets + Wrangler secrets, never in git |

## Dashboard Panels

| Panel | Data Source | Features |
|-------|-------------|----------|
| Front Door | August lock via HA | State, lock/unlock control, battery, last operator |
| Presence | `person.matt` | Home/away status |
| Network | Eero via HA | WAN status, external IP |
| Weather | Met.no via HA | Temp, condition, humidity, wind, 4-day forecast |
| Daylight | `sun.sun` | Sunrise/sunset, progress bar |
| Printer Ink | HP LaserJet via HA | 4 cartridges, color-coded levels |
| Shopping List | HA todo | View + add items |

## Project Structure

```
Vanaheim/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/          # Password login + Turnstile
│   │   │   │   ├── logout/
│   │   │   │   ├── me/
│   │   │   │   └── passkey/
│   │   │   │       ├── register-options/   # WebAuthn registration
│   │   │   │       ├── register-verify/    # Verify + invalidate password
│   │   │   │       ├── auth-options/       # WebAuthn authentication
│   │   │   │       ├── auth-verify/        # Verify + issue JWT
│   │   │   │       ├── list/               # List registered passkeys
│   │   │   │       └── delete/             # Remove passkey
│   │   │   └── ha/[...path]/       # HA proxy (JWT required)
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Main dashboard
│   │   │   └── settings/           # Passkey registration UI
│   │   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── AuthProvider.tsx
│   │   ├── LoginPage.tsx           # Sigil selector + passkey/password flow
│   │   └── DashboardPage.tsx       # Live HA dashboard
│   ├── lib/
│   │   ├── auth.ts                 # JWT + cookie helpers
│   │   └── db.ts                   # D1 helpers (users, passkeys, tokens)
│   └── middleware.ts               # Route protection
├── ha-proxy/                       # Cloudflare Worker
│   ├── src/index.ts                # JWT-verified HA proxy
│   └── wrangler.toml
├── migrations/
│   └── 001_passkeys.sql            # Passkeys + reset tokens tables
├── public/
│   ├── _headers                    # Security headers
│   ├── robots.txt                  # Disallow all crawlers
│   └── yggdrasil.png              # Background image
├── schema.sql                      # Base D1 schema
└── wrangler.toml                   # Pages config + D1 binding
```

## Server Setup

Docker is organized into 3 isolated projects on the ThinkCentre (`192.168.5.246`):

```bash
# Vanaheim
cd /opt/docker/vanaheim && docker compose up -d

# Infrastructure (cloudflared, pihole, unbound)
cd /opt/docker/infrastructure && docker compose up -d

# Plex stack
cd /opt/docker/plex && docker compose up -d
```

Each project has its own `.env` file with only the secrets it needs. Never cross-reference between projects.

## Cloudflare Tunnel Routes

| Hostname | Target |
|----------|--------|
| `thewillsons.com` | Cloudflare Pages |
| `ha.thewillsons.com` | `192.168.5.246:8123` |
| `movies.thewillsons.com` | `192.168.5.246:5055` |

## Environment Variables

### Cloudflare Pages Secrets
| Key | Description |
|-----|-------------|
| `JWT_SECRET` | Shared with Worker for JWT signing/verification |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side secret |

### Cloudflare Worker Secrets (super-rain-384e)
| Key | Description |
|-----|-------------|
| `JWT_SECRET` | Same value as Pages secret |
| `HA_TOKEN` | Home Assistant long-lived access token |
| `HA_URL` | Internal HA URL via tunnel |

## Passkey Setup (First Time)

1. Log in with your password at `https://thewillsons.com/login`
2. Navigate to `https://thewillsons.com/dashboard/settings`
3. Click **Set Up Passkey** and complete Face ID / Touch ID
4. Password is automatically invalidated — passkey is now your only sign-in method
5. Recovery via email only (Resend integration — coming soon)

Approved users: `matt@`, `noonie@`, `odin@`, `abbat@` `@thewillsons.com`

## Roadmap

- [x] JWT authentication with HttpOnly cookies
- [x] Cloudflare Turnstile CAPTCHA
- [x] D1 account lockout + audit logging
- [x] Home Assistant proxy via Cloudflare Worker + Tunnel
- [x] Live dashboard (lock, weather, presence, network, daylight, printer, shopping)
- [x] Lock/unlock control from dashboard
- [x] WebAuthn passkey authentication (Face ID / Touch ID / PIN)
- [x] Password invalidation after passkey registration
- [x] WAF protection + bot blocking
- [x] Search engine blocking (robots.txt + noindex)
- [x] Docker infrastructure separation
- [ ] Email recovery via Resend
- [ ] PWA manifest + service worker
- [ ] Camera feeds
- [ ] Lights control
- [ ] Climate / thermostat
- [ ] Alarm panel
- [ ] Family calendar
- [ ] Push notifications
