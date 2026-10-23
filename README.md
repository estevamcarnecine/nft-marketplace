# NFT Marketplace

A frontend implementation of an NFT marketplace, built for a technical challenge with a 24-hour deadline. The goal is a production-grade app that follows the provided Figma file as closely as possible, with a fully mocked backend (REST and WebSocket) so it runs end to end without any real API.

**Design:** [Figma file](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1)
**Live demo:** _add the Vercel URL after deploy_
**Author:** Estevam Carnecine Silva ([@estevamcarnecine](https://github.com/estevamcarnecine))

---

## Status

The app is being built in phases. This table is the source of truth for what works today.

- [x] **Phase 1:** project setup, design tokens, routing with private route guard
- [ ] **Phase 2:** MSW mock layer (REST handlers and Socket.IO events)
- [ ] **Phase 3:** pages and interactive states (catalog, NFT detail, cart, checkout, profile, wallets)
- [ ] **Phase 4:** Playwright E2E tests and accessibility pass
- [ ] **Phase 5:** deploy, Lighthouse audit, architecture notes

## Tech stack

| Area | Choice |
|---|---|
| UI | React 18+ with TypeScript (strict mode) |
| Build | Vite |
| Routing | TanStack Router (file-based, typed search params) |
| Server state | TanStack Query |
| HTTP | Axios with typed interceptors and request cancellation |
| Styling | Tailwind CSS v4 and shadcn/ui, themed from the Figma tokens |
| Mocking | MSW for REST, `@mswjs/socket.io-binding` for real-time events |
| Real time | Socket.IO client (`nft.updated`, `order.updated`) |
| Tests | Playwright (desktop and mobile, including visual regression) |
| Audit | Lighthouse |

## Getting started

Requirements: Node 20.19 or newer and npm.

```bash
git clone https://github.com/estevamcarnecine/nft-marketplace.git
cd nft-marketplace
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

The repo includes an `.npmrc` with `legacy-peer-deps=true` so `npm install` does not fail on peer dependency conflicts.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

E2E scripts will be added in Phase 4.

## Routes

| Path | Access | Screen |
|---|---|---|
| `/` | Public | Catalog (search, filters, sorting and pagination will live in the URL) |
| `/nft/$id` | Public | NFT detail |
| `/cart` | Public | Cart |
| `/login` | Public | Sign in |
| `/checkout` | Private | Payment |
| `/profile` | Private | Collector profile |
| `/wallets` | Private | Wallets |

Private routes live under `src/routes/_authenticated/`. A single `beforeLoad` guard in `_authenticated.tsx` redirects unauthenticated users to `/login?redirect=<original path>` and sends them back after signing in.

The current login is a temporary stub that stores a token in `localStorage`. It will be replaced by the mocked auth endpoint in Phase 2.

## Project structure

```
src/
  routes/        file-based routes (TanStack Router)
    _authenticated/   private routes behind the auth guard
  features/      data hooks and logic grouped by domain
  components/    shared UI and feature components
  lib/           axios client, query client, auth helpers, ETH utils
  mocks/         MSW worker, handlers, socket binding, scenarios
  types/         domain types
e2e/             Playwright tests
```

## Design tokens

Tokens were read directly from the Figma file and live in `src/index.css` under Tailwind's `@theme`.

| Token | Value |
|---|---|
| Background | `#140D0A` |
| Card surface | `#241612` |
| Border | `#3F2319` |
| Primary (buttons) | `#D28A4C` |
| Accent (prices) | `#E89B55` |
| Text | `#F7F3EC`, secondary `#CFB28C` |
| Font | Roboto Mono (400, 500, 700) |
| Radius | 6px buttons, 15px artwork |

Layouts are built for the desktop frame (1440px, 1200px content width) and the mobile frame in the file (414px wide). Loading skeletons, empty states and validation errors are not drawn in the Figma file, so they reuse these same tokens.

## Engineering rules

These apply to everything added from here on:

- **ETH values are strings.** Amounts are never stored or computed as JavaScript numbers. Arithmetic goes through a `BigInt` wei helper to avoid floating-point loss.
- **No mocking inside components or hooks.** Every REST and socket response comes from MSW, so the app code looks the same as it would against a real backend.
- **URL is state.** Catalog search, filters, sorting and pagination are bound to TanStack Router search params, so any view can be shared or reloaded.
- **Mock scenarios are configurable.** Latency, 4xx and 5xx responses, price changes during checkout and idempotency keys can be toggled without touching app code.

## Testing and quality targets

- Playwright E2E for the core challenge scenarios, on desktop and mobile viewports
- Keyboard navigation, focus traps in dialogs and visible focus rings
- Lighthouse targets: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+

## Deployment

Planned on Vercel, with a rewrite to `index.html` for client-side routing and MSW enabled in production so the demo works without a backend.

## Commit convention

Atomic commits using Conventional Commits, for example `feat(catalog): add filters bound to url` or `test(e2e): cover checkout price change`.
