# Vanaheim

A private family home automation dashboard for the Willson household. Vanaheim provides a single, secure interface for monitoring and controlling smart home devices, built on top of Home Assistant.

## What It Does

- **Family dashboard** — live view of home status including locks, presence, weather, network, and more
- **Device control** — lock/unlock doors, view sensor states, manage shopping list
- **Secure access** — passkey authentication (Face ID / Touch ID) for family members
- **Private by design** — not indexed, not public, built exclusively for the Willson family

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Auth**: WebAuthn/Passkeys, JWT, Cloudflare Turnstile
- **Database**: Cloudflare D1
- **Hosting**: Cloudflare Pages + Workers
- **Home Automation**: Home Assistant

## Security Features

- Passkey authentication (Face ID / Touch ID / PIN) — password invalidated after setup
- JWT sessions via HttpOnly cookies
- Cloudflare Turnstile CAPTCHA on login
- Rate limiting on authentication endpoints
- HTTP security headers (HSTS, CSP, X-Frame-Options)
- Not discoverable — robots.txt blocks all crawlers, noindex meta tag set

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, logout, passkey registration + authentication
│   │   └── ha/             # Home Assistant proxy (JWT protected)
│   ├── dashboard/          # Protected dashboard + settings
│   ├── login/
│   └── page.tsx            # Landing page
├── components/
│   ├── AuthProvider.tsx
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── lib/
│   ├── auth.ts             # JWT + cookie helpers
│   └── db.ts               # D1 database helpers
└── middleware.ts            # Route protection
```

## Roadmap

- [x] JWT authentication with HttpOnly cookies
- [x] Cloudflare Turnstile CAPTCHA
- [x] Live Home Assistant dashboard
- [x] Lock/unlock control
- [x] WebAuthn passkey authentication
- [x] WAF protection + bot blocking
- [ ] Email recovery via Resend
- [ ] PWA manifest + service worker
- [ ] Camera feeds
- [ ] Lights control
- [ ] Climate / thermostat
- [ ] Alarm panel
- [ ] Family calendar
- [ ] Push notifications
