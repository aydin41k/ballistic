# Ballistic — a colour-packed bullet journal that moves at your pace

Next.js + Tailwind + TypeScript frontend, paired with a Laravel-style REST API (Bearer token auth) so your tasks stay in sync everywhere.

---

## 🌈 At a glance
- 🧭 Quick capture with optimistic updates and drag-to-reorder lanes
- 🎯 Status cycle made for focus: `todo → doing → done → wontdo`
- 🗂️ Projects + descriptions so every thought has a home
- 🔐 Login / register with token storage + auto-redirect on expiry
- ⚡ Built for speed: App Router, client-side filters, animated UI polish
- ✅ Tests included — run `./runtests.sh` to keep things honest

## 🎢 Daily flow (infographic vibes)
1. ✏️ Capture: type, hit enter, keep rolling — it appears instantly.
2. 🎨 Organise: tag a project, jot a note, set the order.
3. 🔀 Shuffle: drag, drop, or rocket an item straight to the top.
4. 🚦 Focus: tap the status dot to move work forward.
5. 🎉 Celebrate: watch the board lighten as done/wontdo fade away.
6. 🔄 Sync: every move hits your API with Bearer auth headers.

## ⚙️ Setup in five minutes
1. **Clone & install**
   ```bash
   npm install
   ```
2. **Point to your API** (Laravel-ish, expects `/api/*` routes)
   ```bash
   # .env.local
   NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
   ```
3. **Run it**
   ```bash
   npm run dev
   ```
4. **Create an account** at `/register`, then log in and start firing tasks.

## 🔒 API & auth handshake
- All requests use `NEXT_PUBLIC_API_BASE_URL` and send `Authorization: Bearer <token>`.
- Token + user are stored in `localStorage`; a 401 wipes them and bounces you to `/login`.
- Supported statuses: `todo`, `doing`, `done`, `wontdo`.
- Core endpoints the UI calls:
  - `POST /api/login`, `POST /api/register`, `POST /api/logout`
  - `GET /api/items` with optional `project_id` and `status`
  - `POST /api/items` to create, `PATCH /api/items/:id` to update/move, `DELETE /api/items/:id` to remove

## 🖥️ Command cheat sheet
- Dev server: `npm run dev`
- Type checks + lint in CI: `npm run build`
- Tests (please run before pushing): `./runtests.sh`

## 🧪 Testing notes
- `./runtests.sh` wraps the whole suite — no extra flags needed.
- Optimistic updates, auth redirects, and reordering all have coverage; add a test with any new behaviour you ship.

## 🚢 Deploying
- Provide `NEXT_PUBLIC_API_BASE_URL` in your hosting environment (Vercel, Fly, Render, your favourite VPS).
- Build and run: `npm run build && npm start`.
- The app assumes HTTPS for production tokens; keep it locked down.

## 🤝 Contributing
- Yarn not required; `npm` all the way.
- Keep commits tight, keep colours bright, and run `./runtests.sh` before opening a PR.
- We're here to help!
