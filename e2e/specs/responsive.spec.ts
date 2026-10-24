import { expect, test } from '../fixtures'

const PUBLIC_ROUTES = ['/', '/nft/nft-0042', '/cart', '/login', '/signup', '/rota/inexistente']
const PRIVATE_ROUTES = ['/checkout', '/profile', '/wallets']

for (const width of [390, 768, 1440]) {
  test.describe(`no horizontal overflow at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('public screens', async ({ app, page }) => {
      for (const route of PUBLIC_ROUTES) {
        await app.goto(route)
        await app.ready()
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0)
      }
    })

    test('private screens', async ({ app, page }) => {
      await app.login('demo', '/checkout')
      for (const route of PRIVATE_ROUTES) {
        await app.goto(route)
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0)
      }
    })
  })
}
