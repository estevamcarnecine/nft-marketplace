let resolveReady: () => void = () => {}

/**
 * Resolves once the API can answer: the mock service worker has started (demo build), or right
 * away without mocks. The app renders before that, so the first paint does not wait for the mock
 * bundle; every request and the socket connection wait for it instead.
 */
export const apiReady = new Promise<void>((resolve) => {
  resolveReady = resolve
})

export function markApiReady(): void {
  resolveReady()
  // Lets the E2E suite know when the page can talk to the API (see e2e/fixtures.ts).
  document.documentElement.dataset.apiReady = 'true'
}
