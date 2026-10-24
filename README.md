# Kurio — NFT Marketplace

A front-end delivery of an NFT marketplace, built from a Figma file with a fully simulated back end: REST through MSW, real-time events through a mock Socket.IO server. It runs end to end from a clean checkout, with no private service or real API.

- **Design:** [Figma file](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) (15 frames: 9 desktop, 6 mobile)
- **Live demo:** https://nft-marketplace-pearl-eight.vercel.app (Vercel; mocks and real time included, every route works on direct access and refresh)
- **Architecture, contracts and Figma deviations:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Author:** Estevam Carnecine Silva ([@estevamcarnecine](https://github.com/estevamcarnecine))

## Stack

React 19 · TypeScript (strict) · Vite · TanStack Router (file-based, typed search params) · TanStack Query · Axios · Tailwind CSS v4 · shadcn/ui (Radix) · react-hook-form + zod · Socket.IO client · MSW + `@mswjs/socket.io-binding` · Playwright · Lighthouse.

## Setup

Requirements: **Node 20.19+** and npm. Google Chrome is only needed for the Lighthouse audit.

```bash
git clone https://github.com/estevamcarnecine/nft-marketplace.git
cd nft-marketplace
npm install                       # .npmrc sets legacy-peer-deps=true
npx playwright install chromium   # browser for the E2E suite
npm run dev                       # http://localhost:5173, mocks on
```

### Environment variables

| Variable | Default | Effect |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | MSW (REST + Socket.IO) runs in the page. The demo build ships with it on. `false` sends requests to a real `/api` (none is provided). |
| `CHROME_PATH` | auto-detected | Chrome used by `npm run lighthouse` (read by chrome-launcher). |

Copy `.env.example` to `.env.local` to change them. No secret is needed.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with mocks |
| `npm run build` | Type-check (app, tooling and E2E projects) and production build |
| `npm run preview` | Serve the production build (mocks included) |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint (no `any`, no `@ts-ignore`) |
| `npm run e2e` | Full Playwright suite: desktop (1440) and mobile (390) projects; builds and serves the app on port 4173 |
| `npm run e2e:desktop` / `npm run e2e:mobile` | One project |
| `npm run e2e:update` | Re-record visual baselines (see below) |
| `PLAYWRIGHT_BASE_URL=<url> npm run e2e` | Run the suite against a deployed copy instead of a local build (e.g. the live demo) |
| `npm run e2e:report` | Open the HTML report (traces and videos of failures are attached) |
| `npm run lighthouse` | Build, serve and audit home and NFT detail (mobile + desktop, 3 runs each); reports in `lighthouse/reports/<date>/` |
| `npm run images` | Regenerate the AVIF/WebP artwork variants in `public/nft/opt/` |

## Fictitious accounts

| E-mail | Password | Notes |
|---|---|---|
| `demo@kurio.io` | `Kurio@2026` | Demo Collector: cart with items, one wallet |
| `colecionador@kurio.io` | `Kurio@2026` | Ana Colecionadora: empty cart, favorites, other wallets |

Sign-up creates more accounts. Passwords are stored as salted SHA-256 hashes, never in plain text.

**Promo codes:** `KURIO10` (10%), `BEMVINDO5` (5%), `NATAL2025` (expired). Any other code is invalid.

## Mock data, scenarios and reset

The mock database lives in the browser (`localStorage` key `kurio.mockdb`), so confirmed changes survive a refresh. Every fixture is deterministic: fixed seed and epoch, 239 NFTs in 9 collections and 3 networks.

**Scenarios** are chosen with `?mock=` in any URL, as comma-separated tokens. They stay active for that tab, across reloads (sessionStorage `kurio.mock.scenario`).

- `?mock=reset` restores the fixtures and clears the scenario.
- `?mock=none` clears the scenario and keeps the data.
- In the browser console, `window.__mock` exposes:
  - `set({...})` to change the scenario,
  - `reset()` to restore the fixtures,
  - `realtime.changePrice(id, percent)`, `realtime.setStock(id, edition, n)`, `realtime.dropSockets()` and `realtime.connectedSockets()`.

| Token | Effect |
|---|---|
| `latency:<ms>` | Base latency of every response (default 250) |
| `jitter:<min>-<max>` | Seeded extra latency |
| `outoforder` | Alternate catalog requests are slow, so older answers arrive after newer ones |
| `offline[:<key>]` | Network error for one handler key, or all (`*`) |
| `timeout:<key>` | The response arrives after the client's 10 s timeout |
| `fail:<key>:<status>[:<times>]` | HTTP error from one handler, `times` times (default 1) |
| `empty` | Empty catalog |
| `pricechange` | Prices change when the next order is submitted (quote becomes stale) |
| `soldout` | The first cart edition sells out when the next order is submitted |
| `ordertimeout` | The next order is created but its response arrives after the timeout |
| `orderfail` | Payments are rejected |
| `orderdelay:<ms>` | Time until a pending order settles (default 3000) |
| `walletreject` | Wallet connection is refused |
| `session:expire[:<ms>]` | Every current session expires now, or after `ms` |
| `ticks` | Random price changes every 6 s over Socket.IO |
| `socket:drop[:<ms>]` | The server drops every socket after `ms` (default 4000); the client reconnects |
| `event:dup` | Every event is delivered twice (same `eventId`) |
| `event:stale` | Every `nft.updated` is followed by an older version with wrong data |

Handler keys for `offline`, `timeout` and `fail`:
- **Auth:** `auth.login`, `auth.signup`, `auth.session`, `auth.logout`
- **Catalog:** `catalog.list`, `catalog.detail`, `catalog.featured`, `catalog.related`, `catalog.facets`, `favorite.list`, `favorite.set`
- **Cart:** `cart.get`, `cart.add`, `cart.update`, `cart.remove`, `cart.coupon.apply`
- **Checkout:** `quote.create`, `orders.create`, `orders.get`, `wallet.connect`
- **Account:** `profile.get`, `profile.patch`, `profile.avatar`, `profile.password`, `wallets.create`, `wallets.update`, `wallets.delete`

### Reproducing the failure flows

| Flow | How |
|---|---|
| Catalog failure and retry | `/?mock=fail:catalog.list:503:3`. Queries retry twice, so the third failure shows the error and its retry button. |
| Slow loading (skeletons) | `/?mock=latency:1500` |
| Out-of-order responses | `/?mock=outoforder`, then toggle two filters quickly |
| Favorite failure (rollback) | `/?mock=fail:favorite.set:500:1`, then sign in and favorite a card |
| Session expiry mid-checkout | Sign in, open `/checkout`, run `window.__mock.set({ sessionDeadline: Date.now() })`, then submit. You return to login, then to the same draft. |
| Wallet refused | `/checkout?mock=walletreject` |
| Price change at confirmation | `/checkout?mock=pricechange`: the order is refused with the new values to re-confirm |
| Price change during review (real time) | With the review dialog open: `window.__mock.realtime.changePrice('nft-0042', 15)` |
| Sold out | `/checkout?mock=soldout` |
| Payment rejected | `/checkout?mock=orderfail`: the cart is kept |
| Timeout, same order recovered | `/checkout?mock=ordertimeout`: the client retries with the same Idempotency-Key and lands on the order already created |
| Repeated click | Click "Confirmar pagamento" several times: one order |
| Duplicate and old events | `/cart?mock=event:dup,event:stale`, then `window.__mock.realtime.changePrice(<id>, 20)` |
| Disconnection and catch-up | `window.__mock.realtime.dropSockets()`, then change a price before it reconnects |
| Pending order after reload | `/checkout?mock=orderdelay:8000`, confirm, then reload the receipt |

## Tests

`npm run e2e` runs 82 tests:
- the 12 flows from the brief on desktop;
- the main flows (`@main`) on mobile;
- visual regression (`@visual`) for home, detail, cart and payment on both;
- a responsive check that no main screen overflows horizontally at 390, 768 or 1440 px.
- **Isolation:** every test gets a fresh browser context, so storage and the mock database start from the fixtures.
- **Scenarios and clock:** scenarios are injected per test, and the page clock drives order settlement.
- **Real-time tests** change data on the mock server; the page only learns of it through socket.io-client.

**Visual baselines** are versioned per platform under `e2e/specs/__screenshots__/<platform>/` (text rasterization differs between operating systems). The committed set is `win32`. On another OS the first run records the missing baselines (`updateSnapshots: 'missing'`) and later runs compare against them. `npm run e2e:update` re-records them on purpose.

## Performance

Latest audit: `lighthouse/reports/2026-10-24T01-25-31/summary.md` (median of 3 runs).

| Page | Profile | Perf. | A11y | Best pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | mobile | 82 | 100 | 100 | 100 | 4.00 s | 0 | 27 ms |
| Home | desktop | 98 | 100 | 100 | 100 | 1.08 s | 0 | 0 ms |
| NFT detail | mobile | 84 | 100 | 100 | 100 | 3.79 s | 0 | 10 ms |
| NFT detail | desktop | 98 | 100 | 100 | 100 | 1.02 s | 0 | 0 ms |

Mobile performance is below the 90 target. The causes, what was done about them and what would close the gap are in [ARCHITECTURE.md § Performance](ARCHITECTURE.md#performance).

## Project structure

```
src/
  routes/          file-based routes (TanStack Router); private ones under _authenticated/
  features/        account, auth, cart, catalog, checkout, home, nft, orders, realtime, wallets
                   (api.ts = queries/mutations, components/, schemas, shared hooks)
  components/      layout (headers, shells, tab bar), common, form fields, ui (shadcn/Radix)
  lib/             api client, session/token, socket, formatting, ETH math, media query
  mocks/           MSW handlers, Socket.IO server, fixtures, scenarios, persistence
  types/           contracts shared by the app and the mocks
e2e/               Playwright fixtures, specs and visual baselines
lighthouse/        audit configuration, runner and reports
scripts/           image optimization
public/nft/        Figma artwork (PNG) and its AVIF/WebP variants
```
