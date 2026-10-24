# Architecture

## Overview

- `src/routes` — TanStack Router (file-based). Private routes live under `_authenticated`, whose `beforeLoad` checks `GET /auth/session` and redirects to `/login?redirect=…`.
- `src/features/*` — one folder per domain: `api.ts` (query options and mutations), components, schemas and hooks shared by the desktop and mobile screens.
- `src/lib` — Axios client (10 s timeout, `Authorization` and `X-Cart-Id` headers, `ApiError`), session token, socket, ETH math (bigint over decimal strings), formatting.
- `src/mocks` — MSW handlers, Socket.IO server, fixtures, scenarios and persistence.
- `src/types` — contracts shared by the app and the mocks.
- Layout switches at 1280 px: desktop frames above, mobile frames below (centered and wider on tablets).

## REST contracts

Base `/api`. Errors: `{ code, message, errors?, ...details }`, where `errors` maps fields to messages.

| Resource | Endpoints | Errors |
|---|---|---|
| Session | `POST /auth/signup`, `POST /auth/login`, `GET /auth/session`, `GET /auth/me`, `POST /auth/logout` | 401 `SESSION_EXPIRED` / `UNAUTHORIZED`, 409 `EMAIL_TAKEN` / `USERNAME_TAKEN`, 422 |
| NFTs | `GET /nfts?q&tab&collections&networks&minPrice&maxPrice&sort&page&pageSize`, `GET /nfts/:id`, `GET /nfts/:id/related`, `GET /nfts/featured`, `GET /catalog/facets` | 404 `NFT_NOT_FOUND` |
| Favorites | `GET /favorites`, `PUT /nfts/:id/favorite {favorited}` | 401 |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:lineId`, `DELETE /cart/items/:lineId`, `PUT /cart/coupon`, `DELETE /cart/coupon` | 409 `INSUFFICIENT_SUPPLY {available}`, 422 `COUPON_INVALID` / `COUPON_EXPIRED` |
| Quote | `POST /quotes {promoCode?}` (lines, subtotal, discount, network fee, total; 5 min TTL) | 422 `EMPTY_CART` |
| Orders | `POST /orders` + `Idempotency-Key`, `GET /orders`, `GET /orders/:id` | see below, 403 `FORBIDDEN`, 404 |
| Wallet sessions | `POST /wallet-sessions`, `DELETE /wallet-sessions/:id` | 409 `WALLET_REJECTED`, 403 |
| Profile | `GET/PUT/PATCH /profile`, `PUT/DELETE /profile/avatar`, `POST /profile/password`, `PUT /profile/delivery` | 409, 422 `WRONG_PASSWORD` |
| Wallets | `GET/POST /wallets`, `PATCH/DELETE /wallets/:id`, `POST /wallets/:id/default` | 409 duplicate address |

`POST /orders` answers:
- 201: new order (`pending`).
- 200 with `Idempotent-Replayed`: same key, same body.
- 409 `IDEMPOTENCY_CONFLICT`: same key, different body.
- 409 `QUOTE_CHANGED {quote}`: price, stock, coupon, fee or expiry changed.
- 409 `INSUFFICIENT_SUPPLY`, `WALLET_DISCONNECTED`, `WALLET_MISMATCH`.

Transient failures (network, 5xx) are retried twice for queries; 4xx are not. Order creation retries with the same key.

## Socket.IO events

Envelope: `{ eventId, type, resource: { kind, id }, version, occurredAt, data }`.

| Event | Data | Sent to | Client |
|---|---|---|---|
| `nft.updated` | `price`, `available`, `editions[]` | all sockets | patches catalog, featured, detail and related; re-reads the cart and announces the change; marks an open checkout quote stale |
| `order.updated` | `status`, `txHash`, `rejectionReason` | owner's sockets only | updates the receipt, re-reads the order; on `confirmed` re-reads the cart |

- `session.subscribe {token}` binds a socket to a user; `session.unsubscribe` releases it. Both are sent on login, logout, expiry and changes in another tab.
- An event is ignored if its `eventId` was seen or its version isn't newer than the last applied. Cached data is only patched when `event.version > cached.version`. Confirmed and rejected orders are terminal.
- An event that arrives while a matching query is still loading cancels and restarts that request.
- On reconnect the `nfts`, `cart` and `orders` queries are invalidated. The receipt polls only while the socket is down and the order is pending.

## Session

- Random bearer token in `localStorage`, sliding 30 min expiry.
- An expired, revoked or forged token gets 401 on every endpoint except login, signup and logout.
- Only a 401 for the current token ends the session. The cache is cleared; private screens go to login and back, and checkout keeps its draft in `sessionStorage`.
- Logout revokes the token, clears the cache, rotates the visitor cart id and unbinds the socket. Another tab's login or logout is applied through the `storage` event.

## Cart

- Owner: the signed-in user, or the visitor named by `X-Cart-Id`. The visitor cart merges into the account on login or signup, clamped to stock.
- Lines are `nftId~editionId`, limited by edition stock and 99 per line. Lines over the current stock block checkout.
- Totals always come from the API. Stock decreases only on confirmation, and only the purchased quantities leave the cart.

## Cache

| Data | Key | Policy |
|---|---|---|
| Catalog | `['nfts','list',params]` | 30 s, keeps the previous page while loading, `AbortSignal` cancels superseded requests |
| Detail / related / featured | `['nfts','detail',id]` … | patched by events |
| Cart | `['cart']` | replaced by mutation responses, invalidated after orders and events |
| Session | `['session']` | 30 s, no retry |
| Profile, wallets, orders | `['profile']`, `['wallets']`, `['orders',id]` | replaced by mutation responses |

Favorites are optimistic, with rollback on failure. Login, logout and expiry clear the whole cache. Refetch on focus is off.

## Checkout

The profile prefills the form; the draft is kept in `sessionStorage`. The flow is wallet connection, then quote, then review, then `POST /orders` with an Idempotency-Key stored per attempt (key plus body fingerprint). The receipt is the order snapshot; it shows "confirmed" only after the server settles the order, and pending orders resume after a reload.

## Mocks

- MSW in the page, enabled by `VITE_ENABLE_MOCKS` (on in the demo build). The data persists in `localStorage`; `?mock=reset` restores the fixtures.
- Scenarios are listed in the README.
- Limitations:
  - Events only reach the tab that runs the mock.
  - No Socket.IO long-polling.
  - The block explorer is simulated in-app.
  - MSW's client registry misreported reconnected sockets, so the server tracks them itself.

## UX decisions and Figma deviations

- Login, signup and the receipt are routes: dialogs on desktop, full screens on mobile.
- Out-of-scope links and social login are rendered but marked "Em breve" and never pretend to work.
- Tablet (768–1279 px) uses the mobile frames, centered and wider.
- Mobile checkout keeps the collector data in a collapsible section prefilled from the profile; it opens on validation errors.
- Mobile tab bar: the center button focuses search; favorites is "Em breve".
- Added without a frame:
  - signed-in account menu in the header;
  - live cart notices and the stale-quote alert;
  - skeletons, empty, error and retry states;
  - saved-wallet picker on desktop checkout;
  - featured NFT card and swipeable gallery on mobile;
  - mobile layouts for profile, wallets, receipt, explorer and 404.
- Changed from the frame:
  - mobile cart trash moved to the card corner (it overlapped "+");
  - signup username placeholder left-aligned;
  - no "RARO" badge (the list API has no rarity);
  - the mobile hero grows when narrow phones wrap its copy;
  - related-carousel dots 12 px apart (24 px target spacing).
- Artwork is served as AVIF/WebP generated from the Figma PNGs, with the PNG as fallback.
- Visual baselines are per OS, because text rasterization differs.

## Performance

Median of 3 runs, production build, default mocks (`lighthouse/reports/2026-10-24T01-25-31`):

| Page | Profile | Perf. | A11y | Best pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | mobile | 82 | 100 | 100 | 100 | 4.00 s | 0 | 27 ms |
| Home | desktop | 98 | 100 | 100 | 100 | 1.08 s | 0 | 0 ms |
| Detail | mobile | 84 | 100 | 100 | 100 | 3.79 s | 0 | 10 ms |
| Detail | desktop | 98 | 100 | 100 | 100 | 1.02 s | 0 | 0 ms |

Mobile performance is below 90 because LCP is client-rendered and waits for JavaScript on the throttled profile:
- the mock layer adds about 171 KB gzipped (MSW and fixtures) before any data exists;
- the app's own critical path is about 200 KB gzipped;
- with mocks disabled, the same pages score 84 and 89.

Rendering before the mocks were up, and disabling route code splitting, both measured worse and were reverted. Prerendering the shell and trimming zod, Radix and sonner from the first route would close the gap.
