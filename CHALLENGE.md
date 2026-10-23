# Frontend Challenge: NFT Marketplace

Implement the NFT Marketplace in React and TypeScript, following the Figma layout.

The challenge evaluates visual fidelity, quality of interactions, API integration, async state management, real time, accessibility and performance.

## 1. Scope

Deliver the discovery, purchase and collector account flows, with desktop and mobile versions. APIs, authentication, wallets and payments must work with simulated data. Real blockchain integrations, wallet extensions and payment gateways are out of scope.

The Figma defines the visual identity and screen composition. This brief defines behaviors and evaluation scenarios. States that are not designed must follow the same visual pattern.

## 2. Required stack

| Responsibility | Technology |
|---|---|
| Interface | React |
| Language | TypeScript |
| Routing | TanStack Router |
| Remote state | TanStack Query |
| HTTP client | Axios |
| Data integration | REST APIs |
| Real time | Socket.IO |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Mocking | MSW |
| E2E and visual regression tests | Playwright |
| Performance and quality audit | Lighthouse |

These technologies must play an effective part in the solution. Build tool, project organization and complementary libraries are up to the candidate.

## 3. Screens and flows

| Screen | Required features |
|---|---|
| Home | Highlights, catalog, search, filters, sorting and navigation to the NFT |
| NFT details | Gallery, information, edition, quantity, favorites and purchase |
| NFT cart | Quantity editing, removal, coupon and price summary |
| Payment | Collector data, wallet and network selection, review and order submission |
| Order confirmation | Result, transaction identifier, items, fees and total |
| Login | Authentication, validation and return to the previous flow |
| Sign up | Account creation, validation and conflict handling |
| Collector profile | Data editing, avatar and password change |
| Wallets | Creating and editing primary and secondary wallets |

Implement the available desktop and mobile frames. Profile, wallets and confirmation must also work on mobile, even without a specific frame.

Editorial pages, support, activity, offers and downloads are not part of the delivery. External links and auxiliary actions must behave coherently; out-of-scope actions must not appear to succeed functionally.

### Catalog and detail

- Search, filters, sorting and pagination must make up the URL state and survive refresh and history navigation.
- Filters must be combinable; changing a filter must reset pagination.
- Queries must reflect the parameters sent to the API, handling empty results, failures and out-of-order responses.
- The detail page must support direct access, nonexistent NFT, unavailable edition and quantity limit.
- Favorites must persist for the authenticated user.

### Cart

- Add, change and remove items, respecting availability per NFT and edition.
- Keep the cart after refresh and preserve the visitor's items when they authenticate.
- Apply and remove a coupon, handling invalid or expired codes.
- Show subtotal, discount, network fee and total consistent with the API response.
- Reflect price and availability changes received while the cart is open.

ETH values must travel as decimal strings and keep precision in calculations and display. Quantities are integers. The API quote is the reference for finalizing the order.

### Payment and confirmation

- Validate the fields in the layout and allow review before submission.
- Use the registered wallets, with network selection and simulated connection, rejection and disconnection.
- Revalidate price, availability, coupon and fees before confirming the purchase. Changes must require a new confirmation from the user.
- Prevent duplicate orders from repeated clicks or resubmissions after a timeout.
- Represent pending, confirmed and rejected orders, with recovery after refresh or reconnection.
- Show the confirmation only for an order actually confirmed in the simulation.
- Preserve items on failure; after confirmation, remove from the cart only the items and quantities purchased.

The receipt must reproduce the order snapshot. Later catalog changes cannot modify its values. Transaction references and explorer links are simulated.

### Account and session

Sign up, login, logout and session are required, integrated with the simulated API. Checkout, profile, wallets, favorites and orders require authentication.

The session must be recoverable after refresh. Handle expiration during navigation and during checkout, preserving context so the user can resume. Logout and user switching must clear private cached data and subscriptions from the previous session.

Validate the sign up, profile, password and wallet forms, including errors returned by the API. Confirmed changes must persist after refresh. Use fictitious credentials and do not store passwords in plain text.

## 4. Integration and state

Use TanStack Router for routes, search params and protection of private flows. Use TanStack Query for queries, mutations and cache synchronization. REST calls must go through Axios.

The solution must ensure:

- typed contracts between transport, state and interface;
- loading, empty, error, success and background update states;
- coherent invalidation after mutations and events;
- cancellation or discarding of stale responses;
- data isolation per user and per query parameters;
- failure recovery without duplicating operations;
- handling of nonexistent routes and direct access to any planned screen.

Apply an optimistic update in at least one interaction, with rollback on failure. The cache, retry and synchronization policy must be documented.

## 5. REST contracts

Define and document the contracts used. The minimum resources are:

| Resource | Operations |
|---|---|
| Session and account | Sign up, login, session lookup, logout and expiration |
| NFTs | Listing with search/filters/sorting/pagination and detail by identifier |
| Favorites | Lookup, add and remove |
| Cart | Lookup, add, change and remove items |
| Quote | Coupon validation, availability, discounts, fees and total |
| Orders | Idempotent creation and lookup of status and receipt |
| Profile | Lookup, update of data/avatar and password change |
| Wallets | Lookup, create and update |

Responses must represent validation errors, invalid session, missing permission, nonexistent resource, availability conflict and transient failure.

Order mutations must accept an idempotency key. In the simulation, the same attempt must recover the same order; reusing the key with different content must produce a conflict.

## 6. Mocking with MSW

Implement mocks at the network layer, reusing contracts and scenarios across development, demo and tests. Components, hooks and the Axios client must not contain fake responses or alternative business paths.

Mocks must keep consistent state across catalog, favorites, cart, profile, wallets and orders. Local persistence is allowed to support refresh; reset must fully restore a known scenario.

### Simulating network conditions and failures

Simulate network conditions and failures with MSW, including slowness, variable latency, timeouts, connection unavailability and HTTP error responses. Scenarios must be configurable and reproducible, so loading, error feedback and interface recovery can be evaluated.

Provide fixtures with enough variety to exercise filters and pagination, at least two users, and deterministic scenarios for:

- success and empty result;
- variable latency and out-of-order responses;
- connection failures and HTTP 4xx/5xx responses;
- expired session and unauthorized access;
- sign up conflict or form validation conflict;
- invalid or expired coupon;
- price changed or edition sold out during purchase;
- timeout after order creation, with recovery via idempotency;
- payment confirmed and payment rejected.

Also use MSW to simulate events, with an integration compatible with the Socket.IO protocol, such as `@mswjs/socket.io-binding`. Document the transport used and its limitations in the mock environment.

Scenarios must exercise `socket.io-client`. Replacing the socket with direct calls to setters, callbacks or the cache does not meet the requirement.

The mock layer must be enabled by configuration and available in the demo build. Changes to simulated data must be reflected both in REST responses and in the corresponding events.

## 7. Real time with Socket.IO

Implement at least the following events:

| Event | Expected behavior |
|---|---|
| `nft.updated` | Update price and availability in catalog, detail and cart |
| `order.updated` | Update order status and show confirmation or rejection |

Events must carry a stable identity, the affected resource and a version. The client must tolerate duplicates and old events, without regressing a newer state or reapplying effects.

After reconnection, reconcile active resources with the REST API. Events from a previous session cannot update another user's data. Listeners and subscriptions must be released when their lifecycle ends.

Implement this scenario:

1. An NFT is in the cart.
2. Its price or availability changes while the user navigates.
3. The interface reports the change and updates the summary.
4. Checkout prevents confirmation with an outdated quote.

A connection interruption while the order is pending must also work. After reconnecting or reloading the page, the user must recover their state without creating another purchase. Confirmed or rejected orders are terminal.

## 8. Interface, responsiveness and accessibility

Preserve the typography, colors, spacing, hierarchy, images, proportions and composition from the Figma. Adapt shadcn/ui components to the project's visual identity.

All screens must work on desktop, tablet and mobile, with attention to filters, navigation, forms, cart and checkout. Evaluate at least the 390, 768 and 1440 pixel widths.

Use skeletons with a shimmer effect in data-dependent components while loading, including catalog, detail and cart summary. Preserve content dimensions to avoid layout shifts and respect the reduced motion preference.

Required:

- keyboard navigation and visible focus;
- focus management in dialogs and drawers;
- proper semantics, labels and error messages associated with fields;
- text alternatives for relevant images;
- readable contrast and states that do not rely on color alone;
- accessible feedback for mutations and real-time changes;
- no unintended horizontal overflow and no content loss when zooming.

Use the file's assets when available and keep the images and fonts needed for local execution. Document any asset substitution or accessibility adjustment relative to the layout.

## 9. Playwright tests

Deliver E2E tests that run with the mocks, covering:

1. Search, combined filters, sorting, pagination and restoration through history.
2. Direct access to detail and handling of a nonexistent resource.
3. Sign up, login, session expiration, logout and user switching.
4. Favorites, including mutation failure and state recovery.
5. Cart, quantities, removal, coupon and persistence after refresh/login.
6. Full purchase, from catalog to confirmed receipt.
7. Payment failure, repeated click and timeout with recovery of the same order.
8. Editing profile, avatar, password and wallets, with validation errors.
9. Price/availability change via Socket.IO during checkout.
10. Duplicate or old events, disconnection and resumption of a pending order.
11. Keyboard navigation, dialog focus and form validation.
12. Skeletons during slow loading, failure feedback and recovery after retry.

Run the main flows in Chromium, on desktop and mobile viewports. Include visual regression for home, detail, cart and payment, with versioned baselines and stable data.

Each test must start from an isolated state. Control clock, latency and event triggering in time-sensitive scenarios. Deliver an HTML report and traces for failures.

Assertions must observe the interface and the results of operations. Real-time tests must go through the Socket.IO client and REST tests through the MSW handlers.

## 10. Performance and Lighthouse

Audit home and NFT detail with Lighthouse on mobile and desktop profiles, using an optimized build and the default mock scenario.

| Category | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

Run three measurements per page and profile and report the median of each category. Version the audit configuration and deliver HTML/JSON reports, tool versions, environment and execution conditions.

Record LCP, CLS and TBT. Justify results below target and identify the causes. The audit must load the delivery's images, fonts and features, with no simplifications made only to improve the score.

## 11. Evaluation criteria

| Criterion | Points | Expected evidence |
|---|---|---|
| Visual fidelity and responsiveness | 20 | Adherence to Figma and consistency across screen sizes |
| Flows and user experience | 20 | Complete purchase and account flows, validations and error recovery |
| Integration and state | 15 | Coherent Router, Query, Axios, contracts and cache |
| Real time | 10 | Events, reconnection, ordering and sync with REST |
| Mocking | 10 | MSW, deterministic scenarios, persistence and reset |
| Tests | 10 | Coverage of flows and failures with Playwright |
| Accessibility | 5 | Keyboard operation, semantics, focus and feedback |
| Performance | 5 | Lighthouse audit results and analysis |
| Architecture and documentation | 5 | Typing, responsibilities and reproducible execution |
| **Total** | **100** | |

Eliminatory: not effectively using the required stack, main flows that are only visual, a purchase confirmed without a response from the simulation, data exposed between users, events simulated directly in the UI, or no runnable E2E tests.

## 12. Delivery

Deliver source code, lockfile, assets, mocks, fixtures, tests and audit configurations.

Deployment is required. Send the repository link and a public URL of the application. Vercel is recommended; Netlify and Cloudflare Pages are also accepted.

The published version must match the delivered code and remain accessible during evaluation, with mocks and real-time flows working. Direct access and refresh of routes must work in the published environment.

The solution's README.md must contain setup, environment variables, fictitious credentials, scenario selection and reset, run commands and instructions to reproduce the failure flows.

Document the REST contracts and events, the session policy, the cart state, the cache strategy and the reconciliation between REST and Socket.IO. Record limitations, UX decisions and any deviations from the Figma in ARCHITECTURE.md.

Provide commands for development with mocks, build, preview, type checking, lint, Playwright tests and Lighthouse audit.

The delivery must run from a clean checkout, without depending on private services or the production backend.
