import { test as base, expect, type Page } from '@playwright/test'

/** Fixture accounts (src/mocks/db.ts); both use the same password. */
export const USERS = {
  demo: { email: 'demo@kurio.io', name: 'Demo Collector' },
  ana: { email: 'colecionador@kurio.io', name: 'Ana Colecionadora' },
} as const
export const PASSWORD = 'Kurio@2026'
export type UserKey = keyof typeof USERS

const SCENARIO_KEY = 'kurio.mock.scenario'

interface CartSnapshot {
  count: number
  total: string
  coupon: { code: string; percent: number } | null
  items: { id: string; quantity: number; nft: { id: string; name: string; price: string }; edition: { id: string } }[]
}

interface OrderSnapshot {
  id: string
  status: 'pending' | 'confirmed' | 'rejected'
}

export class App {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string) {
    await this.page.goto(path)
  }

  /** Signs in through the real form and waits for the redirect target. */
  async login(user: UserKey = 'demo', redirect = '/') {
    await this.page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
    await this.page.locator('#login-email').fill(USERS[user].email)
    await this.page.locator('#login-password').fill(PASSWORD)
    await this.page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await this.page.waitForURL((url) => url.pathname === redirect.split('?')[0])
    await expect(this.header.getByRole('button', { name: `Conta de ${USERS[user].name}` })).toBeVisible()
  }

  get header() {
    return this.page.locator('header').first()
  }

  cartBadge() {
    return this.header.getByRole('link', { name: /^Carrinho/ })
  }

  /** Waits for the catalog grid to finish its current request. */
  async catalogSettled() {
    await expect(this.page.locator('#catalog-results')).toHaveAttribute('aria-busy', 'false')
  }

  cardNames() {
    return this.page.locator('ul[aria-label="NFTs"] > li > a').evaluateAll((links) =>
      links.map((link) => link.querySelector('span:last-child > span:first-child')?.textContent ?? ''),
    )
  }

  /** The app mounts only after MSW starts; before that, fetch and window.__mock are not there. */
  async ready() {
    await this.page.waitForFunction(() => document.querySelector('#root > *') !== null)
  }

  /** Reads server state through the app's own MSW handlers (same headers as the app). */
  async api<T>(path: string): Promise<T> {
    await this.ready()
    return this.page.evaluate(async (url) => {
      const headers: Record<string, string> = { 'X-Cart-Id': localStorage.getItem('kurio.cartId') ?? '' }
      const token = localStorage.getItem('nft.token')
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`/api${url}`, { headers })
      return (await response.json()) as T
    }, path) as Promise<T>
  }

  cart() {
    return this.api<CartSnapshot>('/cart')
  }

  async orders() {
    return (await this.api<{ items: OrderSnapshot[] }>('/orders')).items
  }

  /** Server-side changes delivered to the page by the mock Socket.IO server. */
  get realtime() {
    const page = this.page
    return {
      changePrice: (nftId: string, percent: number) =>
        page.evaluate(([id, pct]) => window.__mock.realtime.changePrice(id, pct), [nftId, percent] as const),
      setStock: (nftId: string, editionId: string, available: number) =>
        page.evaluate(
          ([id, edition, units]) => window.__mock.realtime.setStock(id, edition, units),
          [nftId, editionId, available] as const,
        ),
      dropSockets: () => page.evaluate(() => window.__mock.realtime.dropSockets()),
      sockets: () => page.evaluate(() => window.__mock.realtime.connectedSockets()),
    }
  }

  /** Expires every session opened so far (the next authenticated request gets 401). */
  expireSessions() {
    return this.page.evaluate(() => window.__mock.set({ sessionDeadline: Date.now() }))
  }

  setScenario(patch: Record<string, unknown>) {
    return this.page.evaluate((value) => window.__mock.set(value), patch)
  }

  async waitForSocket(predicate: (sockets: { userId: string | null }[]) => boolean = (list) => list.length === 1) {
    await this.ready()
    await expect.poll(async () => predicate(await this.realtime.sockets())).toBe(true)
  }
}

interface Fixtures {
  /** `?mock=` tokens for this test (src/mocks/scenario.ts); kept across reloads like the app does. */
  scenario: string
  app: App
  pageErrors: string[]
}

export const test = base.extend<Fixtures>({
  scenario: ['latency:50', { option: true }],
  pageErrors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))
    await provide(errors)
    // An uncaught error in the page fails the test even when every assertion passed.
    expect(errors, 'uncaught page errors').toEqual([])
  },
  page: async ({ page, scenario }, provide) => {
    await page.addInitScript(
      ([key, value]) => {
        // Set once per tab, before the app boots; a test may change it later with window.__mock.set.
        if (!sessionStorage.getItem(`${key}:seeded`)) {
          sessionStorage.setItem(key, value)
          sessionStorage.setItem(`${key}:seeded`, '1')
        }
      },
      [SCENARIO_KEY, scenario] as const,
    )
    await provide(page)
  },
  app: async ({ page, pageErrors }, provide) => {
    void pageErrors
    await provide(new App(page))
  },
})

export { expect }
