# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Website for "Whisk & Co.", a home bakery (Instagram: @wiskco01, spelled without the "h"). It used to be called "Pastel n Postery": the internal `pnp-` localStorage keys, the Cloudinary folder `pastel-n-postery` and the database name keep the old name on purpose (changing them would lose visitors' carts or the uploaded photos). It's a portfolio project for an internship resume, so the code should be clean, well organised and commented in plain English. The developer (the owner of this repo) is building it for a client, the bakery owner, who is not technical. The admin side must be simple and safe for that client: a "Staff login" link in the footer, and "Change password" on the orders page so the handover password can be replaced.

The owner is a beginner learning React. Use simple English and work in big steps. Stop to ask only when you need something from the owner, such as an account, a password or their WhatsApp number. After each big step, say how to test it and remind the owner to commit with git. Leave commits to the owner unless they ask you to commit.

**Stack:**
- `client/`: React + Vite, hosted on Vercel.
- `server/`: Node + Express + Mongoose + bcryptjs + jsonwebtoken + cors + dotenv, hosted on Render, with MongoDB Atlas as the database.

**Plan:**
1. Setup ✅
2. Full frontend ✅
3. Backend ✅ (connected to MongoDB Atlas; the first real order and the admin account are saved)
4. Admin login and orders page ✅ (built; the owner is testing it)
5. GitHub repo ✅ https://github.com/SamikshaShinde1/-Whisk_And_Co (public; the local folder is still called "pastel-n-postery")
6. Deploy: Render for the server, Vercel for the client
7. README and a resume line

**Secrets:** the WhatsApp number, admin password, `MONGO_URI` and JWT secret stay in `.env` files only. Keep `.env.example` files up to date. The root `.gitignore` excludes `.env*` except `.env.example`.

## Backend architecture (`server/`)

- Uses ES modules and Express 5, so errors in async route handlers reach `middleware/errors.js` automatically. That file turns Mongoose `ValidationError`s into a 400 response carrying the first validator's friendly message, which the client shows to the user.
- `app.js` exports `createApp()` (middleware, routes, error handling). It is a function so `CLIENT_URL` is read after `.env` loads. `server.js` loads `.env`, exits at startup if `MONGO_URI` or `JWT_SECRET` is missing, connects and listens. Tests use `createApp()` directly.
- `utils/indiaTime.js` uses Asia/Kolkata for every "today" check (Render runs in UTC). It has `nowInIndia()`, `todayInIndia()`, `addDays`, `isSunday`, `earliestOrderDate()` and `orderDateProblem(date, now)`, which returns "" or a friendly message.
  - The client has an exact copy in `src/indiaTime.js` (plus `isSundayInIndia` and `formatDay`). Keep the two the same.
  - **Date rules ("Sunday: pre-orders only"):** no past dates; no same-day orders on a Sunday (the earliest is Monday); and a Sunday date only if the order is placed by Saturday `SUNDAY_DEADLINE` (20:00) in India.
- `createApp({ now })` stores the clock in `app.locals.now`. The orders route checks `orderDateProblem(order.date, req.app.locals.now())` after `validate()` and before taking an order number, and returns a 400 with the message. Tests pass a fake clock.
- **New-order email** (`utils/orderEmail.js`): `createApp({ notifyOrder })` stores it in `app.locals.notifyOrder` (default `sendOrderEmail`). The orders route calls it only AFTER the order is saved and the 201 is sent, and only logs a failure (`console.error`), so a failed email never loses an order.
  - It uses **Resend** over HTTPS with the built-in `fetch` (no package). Gmail/SMTP is not an option: Render's free plan blocks the SMTP ports.
  - The settings in `.env` are `RESEND_API_KEY` and `ORDER_EMAIL_TO` (comma-separated). Without them the email is skipped. `ORDER_EMAIL_FROM` is optional and defaults to `onboarding@resend.dev`, which only delivers to the Resend account's own email until a domain is verified.
  - `buildOrderEmail(order)` returns `{subject, text, html}` and HTML-escapes everything the customer typed.
- CORS only allows the origins listed in `CLIENT_URL` (comma-separated).
- `trust proxy` is set so the rate limiter sees real visitor IPs on Render.
- `config/db.js` sets `mongoose.set('sanitizeFilter', true)` to block NoSQL injection.

**Routes:**
- `POST /api/orders` (public): rate-limited to 10 per 15 minutes. The client sends items as `{slug, qty, note}` only, one line per cart line (the same slug may appear twice with different notes). The server looks up each product (using `mongoose.trusted` for its own `$in`, because `sanitizeFilter` would block it), takes the name and the price from the database (`priceNow(product)`, which is the offer price while a special is active), and rejects unknown or sold-out items with a 400. It ignores any client total, and `address` is cleared for pickup. The order is validated first, and only then gets an `orderNumber` (`WC-1001`, `WC-1002`, …) from `models/Counter.js`, which uses an atomic `$inc` on the counter `order-wc`. Orders from before the rename have `PNP-` numbers (old counter `order`); the track route accepts both prefixes. This way, rejected orders don't use up numbers. The response is only `{_id, orderNumber, total, status}`.
- `POST /api/orders/track` (public): body `{number, phone}`. It is a POST so the phone never appears in URLs, browser history or server logs. Rate-limited to 30 per 15 minutes.
  - Returns the order only when **both** the order number and the phone match.
  - It `.select()`s only the safe fields (`orderNumber`, `items.name`, `items.price`, `items.qty`, `total`, `date`, `deliveryType`, `status`, `createdAt`), so no name, phone, address, order note or item note is returned.
  - A wrong number and a wrong phone give the same 404 message.
- `GET /api/orders` (admin): all orders, newest first.
- `PATCH /api/orders/:id` (admin): body `{status}`, which must be one of `ORDER_STATUSES`. **One-way status** (`utils/orderStatus.js`, `statusChangeProblem(from, to)` returns "" or a friendly message, sent as a 400):
  - `STATUS_FLOW` new → baking → ready → delivered only moves forward (skipping forward is fine; the same status again is a harmless no-op).
  - `cancelled` is allowed only from `CANCELLABLE` (new, baking).
  - `FINAL_STATUSES` (delivered, cancelled) can never change.
  - The save is conditional on the status not having changed meanwhile (409 otherwise).
  - The client has an exact copy in `src/orderStatus.js` (only the second comment line differs). Keep the two the same.
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
- The validation rules live in `models/Order.js`: a 10-digit phone, `date` as a `YYYY-MM-DD` string, an integer `qty` from 1 to 50, an optional item `note` (max 200, e.g. the message on a cake), between 1 and `MAX_ORDER_LINES` (20) items (the route also rejects more than 20 before any lookup), and an address required for delivery.
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
npm run logo      # scripts/make-logo.mjs: downloads Fraunces + Pinyon Script, turns the letters into paths and writes public/logo-full.svg, logo-light.svg, logo-mark.svg, logo-mark-light.svg, favicon.svg/.png, apple-touch-icon.png, instagram-1080.png and src/components/logo/logoShapes.js; then runs share-image
npm run share-image  # writes public/og-image.png (1200x630 link preview, with public/logo-light.svg)
```

Run these from `server/`:

```
npm run dev            # API at http://localhost:5000, restarts when files change (node --watch)
npm start              # run without watching (used on Render)
npm run create-admin   # create or update the admin login from server/.env
npm run seed-products  # one time: copy the starting menu into MongoDB (safe to re-run)
npm test               # backend tests (node:test + supertest + mongodb-memory-server, in server/tests/)
```

Backend tests live in `server/tests/*.test.js` and use `tests/helpers.js` (`startTestServer()` starts an in-memory MongoDB and signs an admin JWT; `daysFromToday(n)` and `orderFor(items)` help build data; `startTestServer({ now })` sets a fake clock; `notifyOrder` defaults to a no-op so tests never send email). Each file runs in its own process, but the order rate limit (10 per 15 minutes) still applies within a file, so keep each file at 10 orders or fewer. The first run downloads MongoDB, so it is slow once. On Windows the in-memory MongoDB sometimes never reports "ready", so the helper waits 30 seconds and retries up to 3 times. The client has no tests.

## Frontend architecture

**Libraries:**
- React 19
- React Router 7: `BrowserRouter` is in `main.jsx`, and the routes are in `App.jsx`. The routes are `/`, `/menu`, `/menu/:slug`, `/checkout`, `/track`, `/admin` (redirects to `/admin/orders`), `/admin/login`, `/admin/orders`, `/admin/menu` and `*` (the 404 page). Admin pages skip the intro, the floating buttons, the special banner and the cart (button and drawer). `AdminOrders` and `AdminMenu` use `<PageHeader compact>` (the owner wanted the full banner back, just shorter): script "admin", the title, a small text line and the `.admin__toolbar` of labelled pill buttons (`.admin__tool`).
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
- `components/MenuStatus.jsx`: `LoadingCards` (shimmer cards, placed inside the real grid), `LoadingNote` ("Loading the menu…") and `LoadError` (with a Try again button).
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
  - A request still running after 4 seconds counts as "slow" (`isServerSlow` / `subscribeToServerSlow`). `components/WakeUpNotice.jsx` (in `App`, on every page including admin) reads it with `useSyncExternalStore` and shows "Waking up the oven…" bottom-left, because Render's free plan sleeps after 15 minutes.
- `components/PrivacyNote.jsx` ("We only use your details to prepare and deliver your order.") sits under the Checkout and Track forms. Add it to any new form that asks for a name or phone.
- **Link previews:** `index.html` has Open Graph and Twitter tags using `%SITE_URL%`, which `vite.config.js` replaces with `VITE_SITE_URL` (it warns on a build without it). Crawlers don't run JavaScript, so every page shares these tags. The image is `public/og-image.png`.

**Images:**
- `SmartImage` shows a tinted emoji placeholder when a photo is missing or fails to load. It remembers which `src` failed, so a photo that arrives later still gets shown.
- **Logo** ("dipped W" round sticker: whisk wires dipping into a chocolate "W" with drips, on a blush circle). Change the design only in `scripts/make-logo.mjs` and run `npm run logo`; `src/components/logo/logoShapes.js` is generated from it.
  - `LogoMark` draws it inline (not an `<img>`), coloured by the `--logo-*` tokens in `index.css`: blush circle + dark chocolate on light backgrounds; in dark mode and in the cocoa areas (navbar, footer, hero, page headers, intro) the circle is cocoa and the chocolate turns strawberry-rose. With `animate` it builds itself step by step (used by the intro).
  - `Logo` = `LogoMark` + the wordmark "Whisk" + script `.logo__amp` "&" + "Co.". The navbar hides the wordmark under 420px.

**App shell (`App.jsx`):**
- The `Intro` overlay plays once per tab session, tracked by `sessionStorage.introSeen`. It is skipped when the user prefers reduced motion. The logo builds itself (circle, W, the wires draw line by line, a little whisk wiggle, drips), sparkles pop, then the name and "baked with love" fade in (3.8 s).
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
- Statuses come from `src/orderStatus.js`. Past statuses are disabled in the dropdown; delivered and cancelled orders show a 🔒 "Completed" / "Cancelled" label instead; choosing delivered or cancelled first opens an "Are you sure?" `Modal`. The filter pills include "cancelled".
- `.btn-danger` (shared, in `index.css`) is for actions that can't be undone.
- On screens up to 760px wide, the table turns into cards using `td[data-label]`.
- The admin pages reuse the `.menu__pill` and `.field` styles from `Menu.css` and `OrderPanel.css`.

**Track order:**
- `pages/Track.jsx` reads `?number=` to pre-fill the order number; the thank-you screen in `Checkout` links there.
- `src/recentOrders.js` keeps the last 5 orders placed from this browser in localStorage (key `pnp-recent-orders`). It stores only `{orderNumber, item, date, savedAt}`, never the phone, name or address. `Checkout` saves to it (item = first name + "+ N more"), and the Track page shows them as tap-to-fill buttons under the heading "Your recent orders on this device", with a "Forget these" link (nothing at all when the list is empty).
  - `getRecentOrders()` drops (and deletes from storage) orders older than 7 days, and old entries without `savedAt`.
  - The browser has no phone, so it can't look up statuses by itself. After a successful track, `noteOrderStatus(number, status)` removes the order if it is delivered or cancelled (`FINAL_STATUSES`).
- If customers forget their number, the Track page has an "Ask us on WhatsApp" link, and the admin finds the order with the search box on `AdminOrders` (order number, name or phone). Never add tracking by phone alone.
- `components/OrderProgress.jsx` maps the statuses new, baking, ready and delivered to the steps Received, Baking, Ready and Delivered. Its `STEPS` must match `STATUS_FLOW`. A cancelled order shows a red "Cancelled" pill with the steps faded.
- `src/orderMessage.js` builds every WhatsApp order message (`OrderPanel` for one item, `Checkout` for the cart). It includes the order number once the order has been placed.

**Menu page:** the selected filter is stored in the URL as `?category=<id>`, and the search as `?q=<text>` (written 300 ms after typing stops, with `replace`). The search matches every typed word against name, category name and description, and works together with the category. The footer's category links use `?category=` to open a filtered menu.

**Product detail (`pages/ProductDetail.jsx`):**
- `OrderPanel` has `key={item.slug}`, so it resets when you open another item. It holds the quantity and the note ("Message on cake" for cakes), with "Add to cart" (adds and opens the drawer), "Buy now" (adds and goes to `/checkout`) and "Order on WhatsApp". It no longer has a details form; details are asked once, at checkout.

**Sunday rule on the site:** `components/SundayNotice.jsx` shows a pop-up once per visit on Sundays in India (`sessionStorage.pnp-sunday-seen`, only after the intro, not on admin pages), with "OK, pre-order" leading to `/menu`. It also exports `SundayNote` ("Today is Sunday: pre-orders only."), used in `OrderPanel`, `CartDrawer` and `Checkout`. On `Checkout` the date input has `min={earliestOrderDate()}`, and `orderDateProblem` shows its reason under the field and blocks submit. `SITE.hours` and `SITE.preorderNote` describe the same rule.

**Shopping cart:**
- `hooks/useCart.js` holds the `CartContext`, `useCart()` (`{lines, count, addItem, updateLine, removeLine, clearCart, isOpen, openCart, closeCart, bump}`), `useCartDetails()` (joins lines with the live menu: `{items, total, hasProblems, loading}`, where each item has `product`, `unitPrice` from `priceNow`, `lineTotal` and `problem` "Sold out" or "No longer on the menu"), and the limits `MAX_QTY` 50, `MAX_LINES` 20 and `MAX_NOTE` 200, which match the server.
- `components/cart/CartProvider.jsx` wraps the whole `App`.
  - It saves lines `{id, slug, qty, note}` in localStorage (`pnp-cart`) and syncs other tabs with the `storage` event.
  - Only slugs are stored, never prices.
  - Adding the same slug with the same note raises the quantity; a different note makes a new line.
  - `addItem` returns false when the cart is full.
- `CartButton` (navbar, right of "Order now") shows the count; `bump` is its `key`, which replays the bounce.
- `CartDrawer` is a native `<dialog>` sliding in from the right, with photo, price each, qty +/-, remove, a note input and the total. Sold-out lines must be removed before "Checkout".
- `ProductCard` is an `<article>` holding a `Link` plus a round + button (a button can't go inside a link). There is no + on sold-out items.
- `pages/Checkout.jsx`:
  - It has name, phone, pickup or delivery, address, date and an optional order note, plus a sticky summary (on top on phones).
  - It sends one `createOrder` with all lines.
  - On success it keeps a snapshot for the thank-you screen (order number, copy, Track, "Send on WhatsApp"), then clears the cart.
  - It shows "Your cart is empty" with "Browse menu" when there are no lines.

**Design (storytelling "Instagram poster" style; UI only: never change content, photos or features for a design change):**
- Colours and fonts are set as tokens in `src/index.css`:
  - "Blush & Cocoa" palette (chosen by the owner): cocoa `#3b2420` (`--cocoa`, `-2`, `-3`) for text, dark sections and primary buttons, cream `#fbf4ef` background, blush `#f6d6cf` soft sections and cards, rose `#c97b7b` accent. Gold `#c49a5c` is ONLY for festive specials.
  - Rose `#c97b7b` is only 2.9:1 on cream, so it is used as-is only on cocoa, as badge/button backgrounds (with cocoa text) and for big decoration. Rose TEXT/icons on cream or blush use `--rose-deep` `#8f4545`.
  - `--accent` is for script words, icons, numbers and dashed borders: `--rose-deep` on cream, `#e3a3a3` in dark mode, and `--rose` inside the cocoa areas (`.section--dark`, `.navbar`, `.footer`, `.hero`, `.page-header`, `.intro` redefine it). Every text pair passes WCAG AA in both modes.
  - Fonts: Fraunces (heavy, `--head-weight` 800, with `--head-soft` = `'SOFT' 100` for rounded retro shapes) for headings, prices, the big words and the `.logo__name` wordmark (900). Every rule using `--font-head` must also set `font-weight: var(--head-weight)` and `font-variation-settings: var(--head-soft)`. Pinyon Script for the `.script` accents. Manrope for body text. Headings are not uppercase (the big `.bg-word` is).
  - Type scale tokens: `--fs-display` (Home hero), `--fs-h1`, `--fs-h2` (`.section-title`), `--fs-h3`, `--fs-h4`, `--fs-lead` (`.section-text`), `--fs-body`, `--fs-small`, `--fs-label`, `--fs-script`, with `--lh-heading`, `--lh-sub` and `--lh-body`. Use these instead of new sizes.
  - Storytelling classes in `index.css`: `.chapter-no` ("01 ——"), `.bg-word` (huge decorative word, `aria-hidden`) and `.sticker` (turned label with a dashed inner line).
  - `components/BigWord.jsx`: a huge faint word behind a section with scroll parallax (a `<span>`, so section `p` styles can't resize it). Only use words already on the page (a heading, script word, category or item name). The parent needs `.has-big-word` (`overflow: clip`, NOT hidden, so sticky children still stick); its `.container` sits above. Each place moves it with its own class (`top`/`bottom`). Used by every Home chapter, `PageHeader` (its title), the Menu (chosen category), `ProductDetail` (category) and the `Footer` (`SITE.name`).
  - Cards look like printed posts: `ProductCard` has a framed photo, a sticker "Best seller" and an optional `number` ("01"). Order boxes (`.order`, `.track__result`, `.mini-card`) have a dashed inner outline like a printed label. Photos on Home/product are cream-framed prints on a turned rose card.
  - `Reveal` takes `x` to slide in from the side (photos). `src/numbers.js` has `twoDigits`.
  - `main.jsx` wraps the app in `<MotionConfig reducedMotion="user">`. Scroll/mouse-driven styles (parallax, tilt) also check `useReducedMotion()`.
- **Dark and light mode:** `<html data-theme="light|dark">` switches a set of theme tokens in `index.css`. New CSS must use these tokens, not the brand colours, for anything that should change:
  - `--bg`, `--bg-2`, `--surface` (cards), `--blush-bg`, `--text`, `--text-muted`.
  - `--night` / `--night-2` for the always-dark navbar, footer, hero, page headers and `.section--dark`. Brand `--cream` text stays fixed on those.
  - `--ink` / `--on-ink` / `--ink-hover` for filled buttons, badges and active pills (cocoa in light mode, cream in dark).
  - `rgba(var(--line-rgb), x)` for lines and `rgba(var(--shadow-rgb), x)` for shadows.
  - `--danger-*`, `--success-*`, `--baking-bg` and `--switch-off` for status colours.
  - Text on `--rose` stays `var(--espresso)` in both modes.
  - `hooks/useTheme.js` keeps the choice (`light`, `dark` or `system`, the default) in localStorage under `pnp-theme` and follows the device for `system`. It adds `html.theme-fade` for 450 ms to fade colours, and updates the `theme-color` meta.
  - An inline script in `client/index.html` repeats the same rules before React loads, so the page never flashes. Keep the two in sync.
  - `components/ThemeToggle.jsx` is the sun/moon button in the footer's bottom line (both footers), with a Light, Dark and System menu that opens upwards there.
- Sections alternate between `.section--dark` and cream (or `.section--blush`).
- Shared classes:
  - Buttons: `.btn-dark`, `.btn-rose`, `.btn-outline`, `.btn-outline-light` and `.btn-whatsapp`.
  - `.zoom-img` adds the hover zoom on photos.
  - `Reveal` adds the fade-in when scrolling.
  - `PageHeader` is the dark banner at the top of inner pages.
- Breakpoints: 900px, 640/560px and 420px. The navbar is kept short on purpose: Logo · Home · Menu · Track order · "Order now" · Cart (on the far right). Everything else (About, Contact, the theme) is in the footer. Under 860px it shows logo, cart and a menu button (the menu holds Home, Menu, Track order and Order now). The footer is compact (about 280px on a laptop): small brand column plus hours, menu links and contact, then one thin line with the copyright, Staff login and the theme button. On phones (560px) it stacks, the brand row is just logo + icons, and the menu and contact links flow along a line.

**Home chapters (`pages/Home.jsx`):** builds the list of chapters, leaving out hidden ones (specials when none run, `SignatureBake` when `SIGNATURE_SLUG` is deleted) so the numbers have no gaps. Each section gets `chapter={n}` and shows `<ChapterNo n>`; each is wrapped in `<div id="chapter-…" className="chapter">`. `home/ChapterNav` is the progress indicator: numbered dots down the left at 1300px and wider (with the chapter's heading on hover, an IntersectionObserver for the active one), and a thin rose line under the navbar on smaller screens. `FreshFromOven` has a sticky title column and only the first 2 best sellers, as numbered cards in two staggered columns (the offset is on a wrapper, because `Reveal` moves the card itself), with a huge "FRESH" along the bottom of the section, like "BROWNIE" in `SignatureBake`.

**Hero slider:**
- All the slides share one grid cell, and inactive slides are `inert`.
- It is chapter `01`. Behind each photo is the item's category name as a huge `.bg-word` (`bigWord()`; "Pastries & Cupcakes" becomes "PASTRIES"), sized from its length (`--len`): a solid copy behind the photo and an outline copy in front. Both have parallax (scroll and mouse) at different speeds. Each word has its own `initial`/`animate`, because it can mount after its slide (when the menu arrives).
- The photo is a cream-framed print on a rose card, with a `.sticker` price tag and a spinning `LogoStamp` (`SITE.name` + the first part of `SITE.tagline` on an SVG `textPath`, each with its own `useId`).
- The 3D tilt comes from the section's mouse position, turned into `rotateX`/`rotateY` springs. The price sticker uses `translateZ` to float in front of the photo.
- It auto-plays every 6 seconds.
