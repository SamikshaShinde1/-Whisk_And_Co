# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Website for "Pastel n Postery", a home bakery (Instagram: @pastel_n_postery). It's a portfolio project for an internship resume, so the code should be clean, well organised and commented in plain English. The developer (the owner of this repo) is building it for a client, the bakery owner, who is not technical. The admin side must be simple and safe for that client: a "Staff login" link in the footer, and "Change password" on the orders page so the handover password can be replaced.

The owner is a beginner learning React. Use simple English and work in big steps. Stop to ask only when you need something from the owner, such as an account, a password or their WhatsApp number. After each big step, say how to test it and remind the owner to commit with git. Leave commits to the owner unless they ask you to commit.

**Stack:**
- `client/`: React + Vite, hosted on Vercel.
- `server/`: Node + Express + Mongoose + bcryptjs + jsonwebtoken + cors + dotenv, hosted on Render, with MongoDB Atlas as the database.

**Plan:**
1. Setup ✅
2. Full frontend ✅
3. Backend ✅ (connected to MongoDB Atlas; the first real order and the admin account are saved)
4. Admin login and orders page ✅ (built; the owner is testing it)
5. GitHub repo "pastel-n-postery"
6. Deploy: Render for the server, Vercel for the client
7. README and a resume line

**Secrets:** the WhatsApp number, admin password, `MONGO_URI` and JWT secret stay in `.env` files only. Keep `.env.example` files up to date. The root `.gitignore` excludes `.env*` except `.env.example`.

## Backend architecture (`server/`)

- Uses ES modules and Express 5, so errors in async route handlers reach `middleware/errors.js` automatically. That file turns Mongoose `ValidationError`s into a 400 response carrying the first validator's friendly message, which the client shows to the user.
- `app.js` exports `createApp()` (middleware, routes, error handling). It is a function so `CLIENT_URL` is read after `.env` loads. `server.js` loads `.env`, exits at startup if `MONGO_URI` or `JWT_SECRET` is missing, connects and listens. Tests use `createApp()` directly.
- `utils/indiaTime.js`: `todayInIndia()` returns today as `YYYY-MM-DD` in Asia/Kolkata. Use it for every "today" check (Render runs in UTC). The client has the same helper in `src/indiaTime.js`, plus `formatDay`.
- CORS only allows the origins listed in `CLIENT_URL` (comma-separated).
- `trust proxy` is set so the rate limiter sees real visitor IPs on Render.
- `config/db.js` sets `mongoose.set('sanitizeFilter', true)` to block NoSQL injection.

**Routes:**
- `POST /api/orders` (public): rate-limited to 10 per 15 minutes. The client sends items as `{slug, qty}` only. The server looks up each product (using `mongoose.trusted` for its own `$in`, because `sanitizeFilter` would block it), takes the name and the price from the database (`priceNow(product)`, which is the offer price while a special is active), and rejects unknown or sold-out items with a 400. It ignores any client total, and `address` is cleared for pickup. The order is validated first, and only then gets an `orderNumber` (`PNP-1001`, `PNP-1002`, …) from `models/Counter.js`, which uses an atomic `$inc`. This way, rejected orders don't use up numbers. The response is only `{_id, orderNumber, total, status}`.
- `POST /api/orders/track` (public): body `{number, phone}`. It is a POST so the phone never appears in URLs, browser history or server logs. Rate-limited to 30 per 15 minutes.
  - Returns the order only when **both** the order number and the phone match.
  - It `.select()`s only the safe fields (`orderNumber`, `items`, `total`, `date`, `deliveryType`, `status`, `createdAt`), so no name, phone, address or note is returned.
  - A wrong number and a wrong phone give the same 404 message.
- `GET /api/orders` (admin): all orders, newest first.
- `PATCH /api/orders/:id` (admin): body `{status}`, which must be one of `ORDER_STATUSES` (exported from `models/Order.js`).
- `GET /api/products` (public): every item that is not archived, including sold-out ones (`available: false`), oldest `_id` first (the original menu order).
  - Sold-out items stay visible on the site in grey; the orders route refuses them.
  - The filter is `archived: mongoose.trusted({ $ne: true })`, so items saved before the `archived` field existed still count as not archived.
- `GET /api/products/all` (admin): every item, including archived ones, for the Manage menu page.
- **Archive instead of delete**, like Instagram: `PUT {archived: true}` hides an item from the website and from ordering, and `{archived: false}` restores it. `DELETE` removes an item for good.
- `POST /api/products`, `PUT /api/products/:id` and `DELETE /api/products/:id` (admin):
  - Only the fields listed in `EDITABLE` in `routes/products.js` are accepted.
  - The `slug` is created once from the name (`-2`, `-3`… if it is taken) and never changes, so shared links keep working.
  - `PUT` accepts partial bodies (the Sold out switch sends only `{available}`). It loads the item, `set()`s the fields and `save()`s, so cross-field validators (offer price, dates) always see the whole item.
- `POST /api/products/upload` (admin): multipart field `image`, JPG/PNG/WebP up to 5 MB, held in memory by multer and sent to Cloudinary (`config/cloudinary.js`, folder `pastel-n-postery`, resized to at most 1600px wide). Returns `{url}`. Returns 503 if the `CLOUDINARY_*` keys are missing; the rest of the server works without them. The Cloudinary keys are read when needed, because route modules are imported before `dotenv.config()` runs.
- `PATCH /api/auth/password` (admin): body `{currentPassword, newPassword}` (new password at least 8 characters). A wrong current password returns **400, not 401**, so the client does not log the user out.
- `POST /api/auth/login`: rate-limited to 5 per 15 minutes. Returns `{token, email}`, where the token is a 7-day HS256 JWT. `middleware/requireAdmin.js` checks `Authorization: Bearer <token>`.

**Models:**
- The validation rules live in `models/Order.js`: a 10-digit phone, `date` as a `YYYY-MM-DD` string, an integer `qty` from 1 to 50, at least one item, and an address required for delivery.
- `orderNumber` is `unique` and `sparse`, because orders placed before this feature have no number. The admin table shows `#<last 6 characters of the id>` for those.
- `models/Admin.js` stores a bcrypt hash of the password.
- `models/Product.js`: `slug`, `name`, `category`, `price`, `priceFrom` (shows "From ₹…"), `unit`, `description`, `image` (an https link or `/images/...`), `bestSeller`, `available` and `archived`. `CATEGORY_IDS` must match `CATEGORIES` in `client/src/data/menu.js`.
- **Special offers** (also in `models/Product.js`): `isSpecial`, `specialTag` (required while `isSpecial`), `offerPrice` (optional, null when empty, must be lower than `price` while `isSpecial`), and `specialStart` / `specialEnd` (`YYYY-MM-DD` or empty for no limit, both days included, end on or after start).
  - The `specialActive` virtual (sent in JSON; `id: false` keeps out the extra `id`) is true when today in India is inside the dates. The client never works out "active" by itself.
- `scripts/seedProducts.js` (`npm run seed-products`) copies `MENU` from `client/src/data/menu.js` into MongoDB, one item at a time in menu order. It skips slugs that already exist, so it never overwrites the admin's edits.

**Admin account:** `scripts/createAdmin.js` creates or updates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, with bcrypt cost 12 and a minimum password length of 8.

## Commands

Run these from `client/`:

```
npm run dev       # dev server at http://localhost:5173
npm run build     # production build into client/dist
npm run lint      # oxlint (config: client/.oxlintrc.json)
npm run preview   # serve the production build (port 4173)
npm run favicon   # reads ../logo.png and writes public/logo.png, favicon.png and apple-touch-icon.png (uses sharp)
```

Run these from `server/`:

```
npm run dev            # API at http://localhost:5000, restarts when files change (node --watch)
npm start              # run without watching (used on Render)
npm run create-admin   # create or update the admin login from server/.env
npm run seed-products  # one time: copy the starting menu into MongoDB (safe to re-run)
npm test               # backend tests (node:test + supertest + mongodb-memory-server, in server/tests/)
```

Backend tests live in `server/tests/*.test.js` and use `tests/helpers.js` (`startTestServer()` starts an in-memory MongoDB and signs an admin JWT; `daysFromToday(n)` and `orderFor(items)` help build data). The first run downloads MongoDB, so it is slow once. The client has no tests.

## Frontend architecture

**Libraries:**
- React 19
- React Router 7: `BrowserRouter` is in `main.jsx`, and the routes are in `App.jsx`. The routes are `/`, `/menu`, `/menu/:slug`, `/track`, `/admin` (redirects to `/admin/orders`), `/admin/login`, `/admin/orders`, `/admin/menu` and `*` (the 404 page). Admin pages skip the intro and the floating buttons.
- Motion: import from `motion/react`.
- React Icons: `react-icons/fi` and `react-icons/fa`.
- Plain CSS, with one CSS file per component.
- `client/vercel.json` rewrites every path to `index.html`, so deep links still work after a refresh.

**Single sources of truth:**
- `src/config/site.js` (`SITE`): name, Instagram link, opening hours and preorder note.
  - `whatsappLink(message)` builds every WhatsApp link from `VITE_WHATSAPP_NUMBER`.
- **The live menu is in MongoDB** and is edited at `/admin/menu`. Items are identified by `slug` everywhere in the client (links, keys, `findProduct`), not `id`.
- `src/hooks/useProducts.js`: `useProducts()` returns `{products, loading, error, retry}`.
  - It loads the menu once per visit, shares the same request between every section, and sorts it by `CATEGORIES` order.
  - `clearMenuCache()` is called after every admin change. `findProduct(products, slug)` finds one item.
  - Home sections refer to items by slug (`HeroSlider` `SLIDES`, `SIGNATURE_SLUG`, `PREORDER_SLUGS`) and must cope with a deleted item.
- **Sold out:** items with `available: false` stay on the menu.
  - Put `.is-soldout` on the photo's wrapper to make the photo grey, and use `.soldout-badge` for the label (both in `index.css`).
  - `ProductCard`, the Home sections and `ProductDetail` all do this.
  - `ProductDetail` shows a "Sold out for now" box with a WhatsApp "Ask when it's back" button instead of `OrderPanel`.
  - "You may also like" only suggests available items.
- `components/MenuStatus.jsx`: `LoadingCards` (shimmer cards, placed inside the real grid), `LoadingNote` (adds a "warming up" line after 4 seconds, because Render's free tier sleeps) and `LoadError` (with a Try again button).
- `src/data/menu.js`: `CATEGORIES`, `CRAFT_IMAGE`, `getCategory` (with a fallback), `formatPrice(amount, from)`, `hasOffer(item)`, `priceNow(item)` and `unsplash(id, width)`.
- **Special offers on the site** (all driven by `item.specialActive`):
  - `components/PriceTag.jsx` shows every menu price, with the old price struck through during an offer. Use it, not `formatPrice`, for item prices.
  - `.special-badge` (gold, with a shine) replaces "Best seller" on cards and the product page; `.product-card--special` adds a gold ring.
  - `hooks/useSpecials.js` returns `{specials, title}` ("Diwali Specials", or "Festive specials" for mixed tags).
  - `SpecialBanner` sits under the navbar (not on admin pages); closing it is remembered in `sessionStorage` (`pnp-banner-closed`) for that set of offers.
  - `home/SpecialOffers` (`id="specials"`) comes right after the hero and returns null when nothing is active.
  - `HeroSlider` puts up to 3 active specials in front of `SLIDES`.
  - `OrderPanel` uses `priceNow(item)` for its total.
  - Manage menu: the form has a "Special offer" switch with tag, offer price and dates; the list has a "Specials" filter and a live / starts / ended badge.
  - `MENU` is now only seed data for `npm run seed-products`. Editing it does not change the website.
  - Several of the Unsplash photos show the wrong food. The owner plans to replace them with their own photos, through the photo upload on `/admin/menu`.
- `src/data/reviews.js`: **placeholder reviews, not real ones**. They must be replaced with real customer reviews before launch.
- `src/api.js`: every backend call goes through `request()`, which reads `VITE_API_URL` (default `http://localhost:5000`), adds a Bearer token when one is given, and throws errors with a friendly `.message`. Admin calls should be added here.

**Images:**
- `SmartImage` shows a tinted emoji placeholder when a photo is missing or fails to load. It remembers which `src` failed, so a photo that arrives later still gets shown.
- `LogoMark` shows a "P" badge when `public/logo.png` is missing. The owner hasn't added `logo.png` yet.

**App shell (`App.jsx`):**
- The `Intro` overlay plays once per tab session, tracked by `sessionStorage.introSeen`. It is skipped when the user prefers reduced motion.
- Then come `ScrollManager`, `Navbar`, the routes, `Footer` (which has `id="contact"`) and `FloatingButtons` (Instagram + WhatsApp, bottom-right).
- `ScrollManager` scrolls to `#hash` sections, otherwise back to the top. It does nothing when the navigation state has `keepScroll: true`; the Menu filter pills set this.

**Admin pages (`pages/admin/`):**
- `src/adminAuth.js` keeps `{token, email}` in localStorage under the key `pnp-admin`.
- `hooks/useAdminSession.js` gives `{admin, logout, handleSessionError}` to every admin page. `handleSessionError(err)` returns true after handling a 401.
- `AdminMenu` (`/admin/menu`) shows:
  - category and "Sold out" filter pills,
  - a list with a Sold out `role="switch"` toggle (changed on screen straight away and undone if the API call fails), Edit and Delete,
  - an "Archived" filter pill, where archived items have Restore and "Delete forever" buttons,
  - `ProductForm` (add or edit, photo upload with a local preview, or a pasted link), in `components/Modal.jsx` (the native `<dialog>`),
  - a "Remove?" dialog (also in `Modal`) with two choices: Archive or "Delete forever". For an item that is already archived, it only offers "Delete forever".
- `AdminOrders` and `AdminMenu` link to each other from their toolbars.
- `AdminOrders` redirects to the login page when there is no token. A 401 from the API clears the token and returns to the login page with a message (passed in navigation state).
- Status changes are shown on screen straight away and undone if the API call fails.
- `STATUSES` must match `ORDER_STATUSES` on the server.
- On screens up to 760px wide, the table turns into cards using `td[data-label]`.
- The admin pages reuse the `.menu__pill` and `.field` styles from `Menu.css` and `OrderPanel.css`.

**Track order:**
- `pages/Track.jsx` reads `?number=` to pre-fill the order number; the success message in `OrderPanel` links there.
- `src/recentOrders.js` keeps the last 5 orders placed from this browser in localStorage (key `pnp-recent-orders`). It stores only `{orderNumber, item, date}`, never the phone, name or address. `OrderPanel` saves to it, and the Track page shows them as tap-to-fill buttons with a "Forget these" link.
- If customers forget their number, the Track page has an "Ask us on WhatsApp" link, and the admin finds the order with the search box on `AdminOrders` (order number, name or phone). Never add tracking by phone alone.
- `components/OrderProgress.jsx` maps the statuses new, baking, ready and delivered to the steps Received, Baking, Ready and Delivered. Its `STEPS` must match `ORDER_STATUSES`.
- The WhatsApp message in `OrderPanel` includes the order number once the order has been placed.

**Menu page:** the selected filter is stored in the URL as `?category=<id>`, and the search as `?q=<text>` (written 300 ms after typing stops, with `replace`). The search matches every typed word against name, category name and description, and works together with the category. The footer's category links use `?category=` to open a filtered menu.

**Product detail (`pages/ProductDetail.jsx`):**
- `OrderPanel` has `key={item.slug}`, so its form resets when you open another item. It sends `items: [{slug, qty}]`; the server sets the name and price.
- `OrderPanel` holds the quantity, the note ("Message on cake" for cakes) and the form.
- It posts the order with `createOrder` and builds the pre-typed WhatsApp message from the same state.

**Design ("FOLD"-style artisan bakery):**
- Colours and fonts are set as tokens in `src/index.css`:
  - Espresso `#2b1a14`, cream `#f6efe5`, blush `#f6d6cf`, rose `#eeb5b0` and gold `#c49a5c`.
  - `--gold-deep` is for gold text on cream backgrounds.
  - Fonts: DM Serif Display for uppercase headings, Pinyon Script for the `.script` accent words, Manrope for body text.
- **Dark and light mode:** `<html data-theme="light|dark">` switches a set of theme tokens in `index.css`. New CSS must use these tokens, not the brand colours, for anything that should change:
  - `--bg`, `--bg-2`, `--surface` (cards), `--blush-bg`, `--text`, `--text-muted`.
  - `--night` / `--night-2` for the always-dark navbar, footer, hero, page headers and `.section--dark`. Brand `--cream` text stays fixed on those.
  - `--ink` / `--on-ink` / `--ink-hover` for filled buttons, badges and active pills (espresso in light mode, cream in dark).
  - `rgba(var(--line-rgb), x)` for lines and `rgba(var(--shadow-rgb), x)` for shadows.
  - `--danger-*`, `--success-*`, `--baking-bg` and `--switch-off` for status colours.
  - Text on `--rose` stays `var(--espresso)` in both modes.
  - `hooks/useTheme.js` keeps the choice (`light`, `dark` or `system`, the default) in localStorage under `pnp-theme` and follows the device for `system`. It adds `html.theme-fade` for 450 ms to fade colours, and updates the `theme-color` meta.
  - An inline script in `client/index.html` repeats the same rules before React loads, so the page never flashes. Keep the two in sync.
  - `components/ThemeToggle.jsx` is the sun/moon button in the navbar, with a Light, Dark and System menu.
- Sections alternate between `.section--dark` and cream (or `.section--blush`).
- Shared classes:
  - Buttons: `.btn-dark`, `.btn-rose`, `.btn-outline`, `.btn-outline-light` and `.btn-whatsapp`.
  - `.zoom-img` adds the hover zoom on photos.
  - `Reveal` adds the fade-in when scrolling.
  - `PageHeader` is the dark banner at the top of inner pages.
- Breakpoints: 900px, 640/560px and 420px. The navbar switches to the hamburger menu at 1000px, because it has 5 links.

**Hero slider:**
- All the slides share one grid cell, and inactive slides are `inert`.
- The 3D tilt comes from the section's mouse position, turned into `rotateX`/`rotateY` springs. The price tag uses `translateZ` to float in front of the photo.
- It auto-plays every 6 seconds.
