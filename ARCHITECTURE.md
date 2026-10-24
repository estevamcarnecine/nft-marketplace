# Architecture

How the Kurio marketplace is put together: contracts, real-time events, session, cart, cache, how REST and Socket.IO are reconciled, and where the delivery departs from the Figma. Setup and commands are in [README.md](README.md).

## 1. Shape of the app

- **Routing** — TanStack Router, file-based (`src/routes`). Private screens (`/checkout`, `/orders/$orderId`, `/profile`, `/wallets`) live under `_authenticated`, whose `beforeLoad` asks the API for the session (`GET /auth/session`). A token in storage is not trusted on its own. On 401 the guard redirects to `/login?redirect=<path>`, and `safeRedirect` only accepts same-origin paths.
- **Catalog state in the URL** — `q`, `tab`, `collections`, `networks`, `minPrice`, `maxPrice`, `sort` and `page` are validated with zod (`features/catalog/search.ts`). Refresh, deep links and back/forward restore them. Any filter change drops `page`.
- **Server state** — TanStack Query, with Axios underneath (`lib/api.ts`: 10 s timeout, `Authorization` and `X-Cart-Id` headers, errors normalized to `ApiError {status, code, message, errors?, body}`).
- **Features** (`src/features/*`) own their `api.ts` (query options and mutations), components, schemas and shared hooks:
  - `useCheckoutFlow`, `useNftPurchase`, `useCartLineActions`, `useCouponForm`, `useCardFavorite`.
  - Desktop and mobile screens are different components on top of these same hooks, so behavior cannot drift between layouts.
- **Layouts** — a `(min-width: 1280px)` media query (`lib/use-media-query.ts`) picks the desktop frames. Below it the mobile frames are used, centered and wider on tablets (see § 10).
- **Contracts** — `src/types/index.ts` is shared by the app and the mocks.

## 2. REST contracts

Base `/api`, JSON. Every error is `{ code, message, errors?, ...details }`. `errors` maps field names to messages and is shown on the field.

| Area | Endpoint | Notes |
|---|---|---|
| Session | `POST /auth/signup` | 201 `{token, user, expiresAt}`. 409 `EMAIL_TAKEN` / `USERNAME_TAKEN`, 422 per field. `guestCartId` merges the visitor cart. |
| | `POST /auth/login` | Same response. 401 with "E-mail ou senha incorretos". Merges the visitor cart (clamped to stock). |
| | `GET /auth/session`, `GET /auth/me` | 401 `SESSION_EXPIRED` (expired) or `UNAUTHORIZED` (missing, revoked, forged) |
| | `POST /auth/logout` | Revokes the token |
| Catalog | `GET /nfts?q&tab&collections&networks&minPrice&maxPrice&sort&page&pageSize` | `Paginated<Nft>`; each NFT carries `version` |
| | `GET /nfts/featured`, `GET /nfts/:id`, `GET /nfts/:id/related`, `GET /catalog/facets` | 404 `NFT_NOT_FOUND` |
| Favorites | `GET /favorites` | The signed-in user's favorite NFTs; private |
| | `PUT /nfts/:id/favorite {favorited}` | Adds (`true`) or removes (`false`); idempotent; private |
| Cart | `GET /cart` | Owner = signed-in user, else the visitor named by `X-Cart-Id` |
| | `POST /cart/items {nftId, editionId?, quantity}`, `PATCH /cart/items/:lineId {quantity}`, `DELETE /cart/items/:lineId` | Always answer the full cart. 409 `INSUFFICIENT_SUPPLY {available}`. At most 99 per line. |
| | `PUT /cart/coupon {code}`, `DELETE /cart/coupon` | 422 `COUPON_INVALID` / `COUPON_EXPIRED` |
| Checkout | `POST /wallet-sessions`, `DELETE /wallet-sessions/:id` | Simulated wallet connection and disconnection. 409 `WALLET_REJECTED` under `walletreject`; 403 `FORBIDDEN` for another account's session. |
| | `POST /quotes {promoCode?}` | Snapshot of lines, subtotal, discount, network fee (0.016 ETH), total; expires in 5 min |
| | `POST /orders` + `Idempotency-Key` | Details in the list below |
| | `GET /orders`, `GET /orders/:id` | 404 `ORDER_NOT_FOUND`; 403 `FORBIDDEN` for another account's order |
| Account | `GET/PUT/PATCH /profile`, `PUT/DELETE /profile/avatar`, `POST /profile/password`, `PUT /profile/delivery` | 409 for e-mail/username taken. 422 `WRONG_PASSWORD` on the current-password field. |
| | `GET/POST /wallets`, `PATCH/DELETE /wallets/:id`, `POST /wallets/:id/default` | A single primary wallet; 409 for duplicate addresses |
| Explorer | `GET /explorer/tx/:hash` | Simulated block explorer for receipts |

**`POST /orders` responses:**
- 201: the new order (`pending`).
- 200 `Idempotent-Replayed`: the same key with the same body.
- 409 `IDEMPOTENCY_CONFLICT`: the same key with a different body.
- 409 `QUOTE_CHANGED {quote}`: price, stock, coupon or fee changed, or the quote expired.
- 409 `INSUFFICIENT_SUPPLY`, `WALLET_DISCONNECTED`, `WALLET_MISMATCH`.
- 422 per field.

**Client policy:**
- **GET retries:** transient failures (network or 5xx) are retried twice by queries; 4xx are never retried.
- **Mutation retries:** mutations don't retry, except order creation, which retries transient failures with the same Idempotency-Key.
- **Cancellation:** every query passes TanStack Query's `AbortSignal`, so a filter change cancels the previous catalog request. A late answer lands in its own cache entry, never the current one.

## 3. Real-time events (Socket.IO)

Transport: socket.io-client, websocket transport only, to `wss://realtime.nft-marketplace.mock`, answered by MSW `ws.link` + `@mswjs/socket.io-binding` (`src/mocks/socket.ts`). Every event uses one envelope:

```ts
{ eventId: string, type, resource: { kind: 'nft' | 'order', id }, version: number, occurredAt: string, data }
```

| Event | `data` | Delivered to | Client effect |
|---|---|---|---|
| `nft.updated` | `{ price, available, editions: [{id, available}] }` | every socket | Patches catalog pages, featured, detail and related caches in place. When the NFT is in the cart, the cart is re-read and a notice is announced (`aria-live`). An open checkout review is marked stale. |
| `order.updated` | `{ status, txHash, rejectionReason }` | only sockets bound to the order's owner | Updates the receipt, then re-reads the order from REST. On `confirmed`, the cart is re-read (the server removed the purchased quantities). |

Client → server: `session.subscribe {token}` binds the socket to a user (the server answers `session.ready`); `session.unsubscribe` unbinds it.

**Ordering and duplicates** (`features/realtime/gate.ts`):
- An event is dropped if its `eventId` was already seen (bounded set of 500).
- It is also dropped if its version is not newer than the last one applied to that resource.
- Cache patches additionally require `event.version > cached.version`, so data fetched over REST after the event is never rolled back.
- Terminal order statuses are never overwritten.

**Requests already in flight:** an event that arrives while an NFT or cart query is still loading restarts that request. The response on its way was computed before the change. A query loading for the first time ignores a refetch, so it is cancelled explicitly. A regression test covers this.

**Lifecycle:**
- There is one socket per app, created in `RealtimeProvider` and loaded on first use. socket.io-client reads `WebSocket` at import time, which must happen after MSW patches it.
- The socket is bound to the session at connect, rebound on login, logout, expiry and changes in another tab.
- Its listeners are removed on unmount.
- Events are delivered per session, so a previous user's order events cannot reach the next user in the same tab.

## 4. Reconciliation between REST and Socket.IO

- REST is the source of truth; events are hints that carry a version.
- **On every reconnect**, the app invalidates the `nfts`, `cart` and `orders` queries, so anything missed while disconnected is re-read.
- **The receipt** polls `GET /orders/:id` every 1.5 s only while the socket is down and the order is pending. Otherwise the result arrives as a push.
- **The checkout review** compares pushed changes against its quote and blocks confirmation until the user re-quotes. The server enforces the same rule anyway: a changed quote returns `QUOTE_CHANGED`.
- **The cart** never patches totals locally: discount, fees and line limits come from the server, so a pushed change triggers a re-read.

## 5. Session policy

- **Token:** login and signup return a random token (`kurio_<uuid>`), kept in `localStorage` (`nft.token`).
- **Expiry:** sessions slide, so every authenticated request extends them by 30 minutes. A bearer token that is expired, revoked or forged gets 401 on every endpoint, public ones included. Only login, signup and logout accept a stale token.
- **401 handling:** only a 401 for the current token ends the session, so a late answer to a previous user's request cannot log out whoever is signed in. When it does:
  - the token is cleared and every cached query dropped;
  - on a private screen, the user goes to `/login?redirect=<path>` and comes back. Checkout keeps its draft in sessionStorage.
- **Logout** revokes the token on the server, clears it locally, drops the cache, rotates the visitor cart id and unbinds the socket.
- **Another tab:** logging in or out there is mirrored here (`storage` event). The cache is dropped and private screens redirect.

## 6. Cart state

- **Owner:** a visitor cart is identified by a random id in `localStorage` (`kurio.cartId`), sent as `X-Cart-Id`. A signed-in request always uses the user's cart; the header is ignored then.
- **Merge:** at login or signup the visitor cart is merged into the account cart, clamped to the available stock. The visitor id is then rotated, so the next visitor starts empty.
- **Lines and coupon:** lines are `nftId~editionId`. Quantity is limited by the edition's stock and 99 per line. A line asking for more than the stock now available is shown as unavailable and blocks checkout. The coupon belongs to the cart and is re-validated on every read.
- **After an order:** stock decreases only when an order is confirmed, and only the purchased quantities leave the cart. A rejected order keeps the cart as it was.

## 7. Cache strategy (TanStack Query)

| Data | Key | Freshness / updates |
|---|---|---|
| Catalog pages | `['nfts','list',params]` | `staleTime` 30 s; `placeholderData: keepPreviousData` (the grid dims instead of blanking) |
| Facets | `['nfts','facets']` | 5 min |
| Detail, related, featured | `['nfts','detail',id]`, `['nfts','related',id]`, `['nfts','featured']` | Patched by `nft.updated` |
| Cart | `['cart']` | Replaced by every cart mutation's response. Invalidated after orders and pushed changes. |
| Session | `['session']` | 30 s; never retried |
| Profile, wallets, orders | `['profile']`, `['wallets']`, `['orders',id]` | Replaced by mutation responses |

- **Optimistic updates:** favorites (list and detail), rolled back on failure.
- **User switch:** login, logout and expiry clear the entire cache, so nothing private outlives a session.
- **Window focus:** refetch on focus is off. Freshness comes from events, reconnection and mutations.

## 8. Checkout and orders

1. The form is prefilled from the profile, and the draft is saved to sessionStorage (`kurio.checkout.draft`) on every change.
2. The wallet is connected, then a quote is created and shown for review.
3. Confirmation sends `POST /orders` with an Idempotency-Key stored for that attempt (`kurio.checkout.attempt`, key plus a body fingerprint). A double click, a retry after a timeout or a reload reuse the same key, so the same order comes back.
4. The order is `pending` until the simulation settles it (`orderdelay`). The receipt only says "confirmed" when the server says so, never optimistically.
5. Pending orders keep settling after a reload (`resumePendingOrders`).

## 9. Mock layer

- **Location:** `src/mocks`. MSW handlers wrapped by `withScenario` (latency, offline, timeout, failures, session check, persistence), a Socket.IO server, a scenario engine and persistence to `localStorage`.
- **Fixtures:** deterministic seed and epoch, with 239 NFTs whose artwork is cycled from the Figma images.
- **Scenarios and reset:** documented in the README. `window.__mock` exposes the controls the E2E suite uses.
- **Enabled by config:** `VITE_ENABLE_MOCKS`, on by default and on in the demo build.

**Boot order:** the mocks start first, then the app chunk loads and renders. Every request and the socket also wait on `apiReady` (`lib/api-ready.ts`). Rendering before the mocks were up was tried and measured worse on the Lighthouse mobile profile, so it was dropped.

**Limitations of the simulated environment:**
- **Same tab only:** MSW runs inside the page, so other tabs and devices don't receive its events. Each tab has its own server state. The mock database is shared through `localStorage`, but events are not.
- **Websocket only:** Socket.IO long-polling isn't simulated.
- **Live sockets:** MSW's own client registry misreported reconnected sockets, so the server keeps its own set, updated on `close` events.
- **Explorer:** the block explorer is in-app; no real chain is touched.
- **Cookies:** none are used; auth is a bearer header.

## 10. UX decisions and deviations from the Figma

Approved decisions:
- **Copy and routes:** the UI copy is pt-BR as in the frames. Login, signup and the order receipt are real routes, shown as dialogs on desktop (as in the frames) and as full screens on mobile.
- **Out-of-scope items:** "Criadores", "Aprenda", blog and footer links, social login and "Esqueceu a senha?" are rendered but marked unavailable (`aria-disabled`, "Em breve" tooltip). They never pretend to work.
- **Breakpoints:** no tablet frames exist, so 768–1279 px uses the mobile frames, centered and wider (catalog grid 3–4 columns, forms capped at 560 px). From 1280 px the desktop frames are used unchanged.
- **Mobile checkout:** the "Mobile / Pagamento" frame only shows wallets. The collector data the order needs is prefilled from the profile in a collapsible "Dados do colecionador" section, which opens on any validation error.
- **Mobile tab bar:** the raised center button focuses search; the favorites tab is "Em breve" (no favorites screen in scope).
- **Saved wallets in checkout:** on desktop, a wallet icon inside the address field ("Usar carteira cadastrada") fills address, network and type from a registered wallet. Mobile lists them as the frame's cards. Both show the connected wallet with "Desconectar".

Deviations and additions (no frame shows them):
- **Signed-in header:** the "Entrar" slot becomes an account menu (Dados do perfil, Carteiras, Sair), same size and style.
- **States without frames:** cart notices for pushed price and stock changes, the stale-quote alert in the review dialog, toasts, skeletons, and empty/error/retry states use the existing tokens and components.
- **Mobile screens without frames:**
  - Profile and wallets: back button, section tabs and "Sair" replace the sidebar; the forms stack.
  - Order receipt: a small-screen layout below 640 px.
  - Explorer and 404: a compact header.
- **Mobile cart:** the trash icon sits in the card's top-right corner. In the frame it overlaps the "+" button.
- **Mobile sign-up:** the username placeholder is left-aligned like the other fields; the frame centers it.
- **Mobile catalog cards:** no "RARO" badge, because the list API carries no rarity. A favorite badge is on every card; the frame shows it only on the first, with the others hidden behind the art.
- **Mobile hero:** grows past 190 px when a phone narrower than the 414 px frame wraps its copy.
- **Mobile home "NFT em destaque":** the mobile frame has no featured NFT, which the brief requires on Início; a compact card between the hero and the tabs shows it.
- **Mobile detail gallery:** the frame shows one image; the art is a swipeable carousel of all images, with its dots where the frame places a 56×7 dots group (y = 365).
- **Related carousel dots:** 12 px apart instead of 8, which puts dot centers 24 px apart (WCAG target spacing).
- **Text widths:** they can differ by a few pixels from Figma, because Windows rasterizes Roboto Mono advances to whole pixels. Visual baselines are therefore per platform.
- **Artwork files:** served as AVIF/WebP derived from the Figma PNGs, with the PNG as the fallback. The pixels are the same artwork.

## 11. Accessibility

- **Semantics:** landmarks, one `h1` per screen, labelled tab lists and radio groups, `aria-current` in navigation, and `aria-live` regions for catalog results, cart notices and order status.
- **Forms:** errors are linked with `aria-describedby`, and the first invalid field takes focus. Server errors (409/422) land on their fields.
- **Dialogs** (Radix) take and trap focus, close with Escape and return focus. Card actions are reachable by keyboard and visible on focus.
- **Touch targets** are at least 44 px on mobile.
- **Motion:** shimmer and spinners respect `prefers-reduced-motion`.
- **Lighthouse:** accessibility scores 100 on all four audited combinations.

## 12. Performance

Audit (`lighthouse/`): production build served by `vite preview` with the default mock scenario. Home and NFT detail, Lighthouse mobile (Moto G Power, slow 4G, 4× CPU) and desktop presets, 3 runs each, medians reported. Latest report: `lighthouse/reports/2026-10-24T01-25-31/`.

| Page | Profile | Perf. | A11y | Best pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | mobile | 82 | 100 | 100 | 100 | 4.00 s | 0 | 27 ms |
| Home | desktop | 98 | 100 | 100 | 100 | 1.08 s | 0 | 0 ms |
| NFT detail | mobile | 84 | 100 | 100 | 100 | 3.79 s | 0 | 10 ms |
| NFT detail | desktop | 98 | 100 | 100 | 100 | 1.02 s | 0 | 0 ms |

**What was done:**
- **Artwork:** about 2 MB per PNG reduced to responsive AVIF/WebP (20–35 KB at common sizes), with per-slot `sizes`, `fetchpriority="high"` on the hero and detail art, and lazy loading below the fold.
- **CLS on detail:** 0.08 → 0, by reserving the tabs' space and the carousel dots row while loading.
- **Critical path:** socket.io-client moved off it, onto first connect.
- **SEO:** 83 → 100 (description, `lang`, `robots.txt`).
- **Accessibility:** 96–97 → 100 (rating role, target spacing).

**Why mobile performance is below 90:** LCP is client-rendered and waits for JavaScript on a throttled link.
- **The mock layer** must load and start before any data exists: MSW plus fixtures is about 171 KB gzipped, including MSW's cookie libraries.
- **The app's own critical path** is about 200 KB gzipped: the React entry, router and query, Radix and sonner, zod and the route chunk.
- **A diagnostic run with mocks disabled** reached 84 (home) and 89 (detail), with LCP 3.7 s and 3.2 s. So about 1.2 s of mobile LCP is the simulation itself; the rest is client rendering.

**Tried and measured, then dropped:**
- Rendering before the mocks were ready, and turning off route code splitting: both shared bandwidth with the mock bundle on the throttled profile and scored lower.

**What would close the gap:**
- Prerender the static shell (header, hero, skeletons) at build time.
- Move zod out of the first route.
- Split sonner and Radix menus out of the first paint.
- Serve the demo's fixtures from the worker instead of the page bundle.

Desktop meets every target.

## 13. Testing

Playwright, two projects:
- **desktop** (1440 × 900): every spec, plus a responsive check that no main screen overflows horizontally at 390, 768 or 1440 px.
- **mobile** (390 × 844, Pixel 7 profile): specs tagged `@main` and `@visual`.

How the suite is built:
- **Environment:** runs against the production build on port 4173.
- **Isolation:** each test has a fresh context (storage and mock database from the fixtures).
- **Scenarios:** injected through an init script.
- **Clock:** controlled with `page.clock` for settlement.
- **Real time:** tests change data through `window.__mock.realtime`, so the page only sees it via socket.io-client.
- **Crashes:** uncaught page errors fail the test.
- **Layouts:** layout-aware helpers (`e2e/fixtures.ts`) let the same spec drive both layouts while asserting what each one shows.
