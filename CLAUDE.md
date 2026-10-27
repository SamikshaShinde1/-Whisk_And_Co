# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Website for "Pastel n Postery", a home bakery (Instagram: @pastel_n_postery). It's a portfolio project for an internship resume, so the code should be clean, well organised and commented in plain English.

The owner is a beginner learning React. Use simple English and work in big steps. Stop to ask only when you need something from the owner, such as an account, a password or their WhatsApp number. After each big step, say how to test it and remind the owner to commit with git. Leave commits to the owner unless they ask you to commit.

**Stack:**
- `client/`: React + Vite, hosted on Vercel.
- `server/`: Node + Express + Mongoose + bcryptjs + jsonwebtoken + cors + dotenv, hosted on Render, with MongoDB Atlas as the database. This folder doesn't exist yet.

**Plan:**
1. Setup ✅
2. Full frontend ✅
3. Backend and an end-to-end order test
4. Admin login and orders page
5. GitHub repo "pastel-n-postery"
6. Deploy: Render for the server, Vercel for the client
7. README and a resume line

**Planned backend API:**
- `POST /api/orders`: public; customers place an order.
- `POST /api/auth/login`: returns a JWT.
- `GET /api/orders`: admin only (JWT checked by `middleware/requireAdmin.js`).
- `PATCH /api/orders/:id`: admin only; changes an order's status.

**Planned Order model:** `customerName`, `phone`, `items [{name, price, qty}]`, `note`, `deliveryType` (pickup or delivery), `address` (only for delivery), `date`, `total`, `status` (new, baking, ready or delivered; default new), plus timestamps. Prices sent by the client can't be trusted, so the server should recalculate the total from the items.

**Planned admin pieces:** an `Admin` model and `scripts/createAdmin.js`, which creates the admin account from `.env` values. The admin pages will be `/admin/login` and `/admin/orders`.

**Secrets:** the WhatsApp number, admin password, `MONGO_URI` and JWT secret stay in `.env` files only. Keep `.env.example` files up to date. The root `.gitignore` excludes `.env*` except `.env.example`.

## Commands

Run these from `client/`:

```
npm run dev       # dev server at http://localhost:5173
npm run build     # production build into client/dist
npm run lint      # oxlint (config: client/.oxlintrc.json)
npm run preview   # serve the production build (port 4173)
npm run favicon   # reads ../logo.png and writes public/logo.png, favicon.png and apple-touch-icon.png (uses sharp)
```

There is no test framework yet.

## Frontend architecture

**Libraries:**
- React 19
- React Router 7: `BrowserRouter` is in `main.jsx`, and the routes are in `App.jsx`. The routes are `/`, `/menu`, `/menu/:id` and `*` (the 404 page).
- Motion: import from `motion/react`.
- React Icons: `react-icons/fi` and `react-icons/fa`.
- Plain CSS, with one CSS file per component.
- `client/vercel.json` rewrites every path to `index.html`, so deep links still work after a refresh.

**Single sources of truth:**
- `src/config/site.js` (`SITE`): name, Instagram link, opening hours and preorder note.
  - `whatsappLink(message)` builds every WhatsApp link from `VITE_WHATSAPP_NUMBER`.
- `src/data/menu.js`: `CATEGORIES`, `MENU`, `BEST_SELLERS` (items marked `bestSeller: true`) and `CRAFT_IMAGE`.
  - Helpers: `getItem`, `getCategory`, `formatPrice(amount, from)` and `unsplash(id, width)`.
  - Each item's `image` is either an Unsplash URL or `/images/<file>` for the owner's own photos.
  - Several of the Unsplash IDs the owner supplied show the wrong food. These are listed in the chat history, and the owner plans to replace them with their own photos.
- `src/data/reviews.js`: **placeholder reviews, not real ones**. They must be replaced with real customer reviews before launch.
- `src/api.js`: every backend call goes through `request()`, which reads `VITE_API_URL` (default `http://localhost:5000`), adds a Bearer token when one is given, and throws errors with a friendly `.message`. Admin calls should be added here.

**Images:**
- `SmartImage` shows a tinted emoji placeholder when a photo fails to load.
- `LogoMark` shows a "P" badge when `public/logo.png` is missing. The owner hasn't added `logo.png` yet.

**App shell (`App.jsx`):**
- The `Intro` overlay plays once per tab session, tracked by `sessionStorage.introSeen`. It is skipped when the user prefers reduced motion.
- Then come `ScrollManager`, `Navbar`, the routes, `Footer` (which has `id="contact"`) and `FloatingButtons` (Instagram + WhatsApp, bottom-right).
- `ScrollManager` scrolls to `#hash` sections, otherwise back to the top. It does nothing when the navigation state has `keepScroll: true`; the Menu filter pills set this.

**Menu page:** the selected filter is stored in the URL as `?category=<id>`. The footer's category links use this to open a filtered menu.

**Product detail (`pages/ProductDetail.jsx`):**
- `OrderPanel` has `key={item.id}`, so its form resets when you open another item.
- `OrderPanel` holds the quantity, the note ("Message on cake" for cakes) and the form.
- It posts the order with `createOrder` and builds the pre-typed WhatsApp message from the same state.

**Design ("FOLD"-style artisan bakery):**
- Colours and fonts are set as tokens in `src/index.css`:
  - Espresso `#2b1a14`, cream `#f6efe5`, blush `#f6d6cf`, rose `#eeb5b0` and gold `#c49a5c`.
  - `--gold-deep` is for gold text on cream backgrounds.
  - Fonts: DM Serif Display for uppercase headings, Pinyon Script for the `.script` accent words, Manrope for body text.
- Sections alternate between `.section--dark` and cream (or `.section--blush`).
- Shared classes:
  - Buttons: `.btn-dark`, `.btn-rose`, `.btn-outline`, `.btn-outline-light` and `.btn-whatsapp`.
  - `.zoom-img` adds the hover zoom on photos.
  - `Reveal` adds the fade-in when scrolling.
  - `PageHeader` is the dark banner at the top of inner pages.
- Breakpoints: 900px, 640/560px and 420px.

**Hero slider:**
- All the slides share one grid cell, and inactive slides are `inert`.
- The 3D tilt comes from the section's mouse position, turned into `rotateX`/`rotateY` springs. The price tag uses `translateZ` to float in front of the photo.
- It auto-plays every 6 seconds.
