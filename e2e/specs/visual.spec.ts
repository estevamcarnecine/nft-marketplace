import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures'

// Fixtures are deterministic (fixed seed and epoch); the clock is pinned so nothing date-based moves.
const FIXED_NOW = new Date('2026-10-23T12:00:00-03:00')

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [...document.images].map((image) =>
        image.complete ? undefined : new Promise((resolve) => image.addEventListener('load', resolve, { once: true })),
      ),
    )
  })
  await page.mouse.move(0, 0)
}

// Desktop frames are full pages; the mobile frames are one viewport (414×896), with a fixed tab or buy bar.
test.describe('visual regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: FIXED_NOW })
  })

  test('home', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    await settle(page)
    await expect(page).toHaveScreenshot('home.png', { fullPage: app.isDesktop })
  })

  test('NFT detail', async ({ app, page }) => {
    await app.goto('/nft/nft-0042')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042')
    await settle(page)
    await expect(page).toHaveScreenshot('detail.png', { fullPage: app.isDesktop })
  })

  test('cart', async ({ app, page }) => {
    await app.login('demo', '/cart')
    await expect(page.locator('section[aria-label="Itens do carrinho"] li').first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('cart.png', { fullPage: app.isDesktop })
  })

  test('payment', async ({ app, page }) => {
    await app.login('demo', '/checkout')
    await expect(page.locator('#displayName')).toHaveValue('Demo Collector')
    await settle(page)
    await expect(page).toHaveScreenshot('payment.png', { fullPage: app.isDesktop })
  })
})
