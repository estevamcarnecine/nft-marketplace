import { test as base, expect, type Page } from '@playwright/test'

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

  get isDesktop() {
    return (this.page.viewportSize()?.width ?? 0) >= 1280
  }

  async login(user: UserKey = 'demo', redirect = '/') {
    await this.page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
    await this.page.locator('#login-email').fill(USERS[user].email)
    await this.page.locator('#login-password').fill(PASSWORD)
    await this.page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await this.page.waitForURL((url) => url.pathname === redirect.split('?')[0])
    await this.expectSignedIn(user)
  }

  async expectSignedIn(user?: UserKey) {
    if (this.isDesktop) {
      const name = user ? `Conta de ${USERS[user].name}` : /^Conta de/
      await expect(this.header.getByRole('button', { name })).toBeVisible()
    } else {
      await expect.poll(() => this.page.evaluate(() => localStorage.getItem('nft.token'))).not.toBeNull()
    }
  }

  async logout() {
    if (this.isDesktop) {
      await this.header.getByRole('button', { name: /^Conta de/ }).click()
      await this.page.getByRole('menuitem', { name: 'Sair' }).click()
    } else {
      if (!/^\/(profile|wallets)$/.test(new URL(this.page.url()).pathname)) await this.page.goto('/profile')
      await this.page.getByRole('navigation', { name: 'Minha conta' }).getByRole('button', { name: 'Sair' }).click()
    }
    await expect.poll(() => this.page.evaluate(() => localStorage.getItem('nft.token'))).toBeNull()
  }

  get header() {
    return this.page.locator('header').first()
  }

  cartBadge() {
    return this.page.getByRole('link', { name: /^Carrinho, \d+ itens$/ }).first()
  }

  buyButton() {
    return this.page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })
  }

  async withFilters<T>(action: () => Promise<T>): Promise<T> {
    if (this.isDesktop) return action()
    await this.page.getByRole('button', { name: /^Filtros e ordenação/ }).click()
    const sheet = this.page.getByRole('dialog', { name: 'Filtros e ordenação' })
    await expect(sheet).toBeVisible()
    const result = await action()
    await this.page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    return result
  }

  toggleFilter(name: RegExp) {
    return this.withFilters(() => this.page.getByRole('checkbox', { name }).click())
  }

  filterChecked(name: RegExp) {
    return this.withFilters(() => this.page.getByRole('checkbox', { name }).getAttribute('aria-checked'))
  }

  async openCollectorDetails() {
    if (this.isDesktop) return
    const details = this.page.locator('details', { hasText: 'Dados do colecionador' })
    if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) {
      await details.locator('summary').click()
    }
  }

  async catalogSettled() {
    await expect(this.page.locator('#catalog-results')).toHaveAttribute('aria-busy', 'false')
  }

  cardNames() {
    return this.page.locator('ul[aria-label="NFTs"] > li > a').evaluateAll((links) =>
      links.map((link) => link.querySelector('span:last-child > span:first-child')?.textContent ?? ''),
    )
  }

  async ready() {
    await this.page.waitForFunction(() => document.documentElement.dataset.apiReady === 'true')
  }

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
    expect(errors, 'uncaught page errors').toEqual([])
  },
  page: async ({ page, scenario }, provide) => {
    await page.addInitScript(
      ([key, value]) => {
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
