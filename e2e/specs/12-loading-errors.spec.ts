import { expect, test } from '../fixtures'

// Queries retry transient failures twice, so three failures in a row reach the error state.
test.describe('loading states, failure feedback and retry', () => {
  test.describe('slow network', () => {
    test.use({ scenario: 'latency:1500' })

    test('skeletons hold the layout until the data arrives @main', async ({ app, page }) => {
      await app.goto('/')
      const results = page.locator('#catalog-results')
      await expect(results).toHaveAttribute('aria-busy', 'true')
      await expect(results.locator('[data-slot="skeleton"]').first()).toBeVisible()

      await app.catalogSettled()
      await expect(results.locator('[data-slot="skeleton"]')).toHaveCount(0)
      expect((await app.cardNames()).length).toBe(9)
    })

    test('the detail page shows its skeleton first', async ({ app, page }) => {
      await app.goto('/nft/nft-0042')
      await expect(page.locator('main [data-slot="skeleton"]').first()).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042', { timeout: 10_000 })
      await expect(page.locator('main [data-slot="skeleton"]')).toHaveCount(0)
    })
  })

  test.describe('catalog failure', () => {
    test.use({ scenario: 'latency:50,fail:catalog.list:503:3' })

    test('reports the failure and recovers on retry @main', async ({ app, page }) => {
      await app.goto('/')
      await expect(page.getByText('Não foi possível carregar os NFTs.')).toBeVisible({ timeout: 15_000 })
      await page.getByRole('button', { name: 'Tentar novamente' }).click()
      // The refetch may not have started yet when the click returns: wait for the cards themselves.
      await expect.poll(async () => (await app.cardNames()).length).toBe(9)
    })
  })

  test.describe('detail failure', () => {
    test.use({ scenario: 'latency:50,fail:catalog.detail:503:3' })

    test('reports the failure and recovers on retry', async ({ app, page }) => {
      await app.goto('/nft/nft-0042')
      await expect(page.getByRole('heading', { name: 'Não foi possível carregar este NFT' })).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByRole('alert')).toContainText('temporariamente indisponível')
      await page.getByRole('button', { name: 'TENTAR NOVAMENTE' }).click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042')
    })
  })

  test.describe('cart failure', () => {
    test.use({ scenario: 'latency:50,fail:cart.get:503:3' })

    test('reports the failure and recovers on retry', async ({ app, page }) => {
      await app.goto('/cart')
      await expect(page.getByText('Não foi possível carregar seu carrinho.')).toBeVisible({ timeout: 15_000 })
      await page.getByRole('button', { name: 'Tentar novamente' }).click()
      await expect(page.getByText('Não foi possível carregar seu carrinho.')).toHaveCount(0)
      await expect(page.getByText('Seu carrinho está vazio', { exact: false })).toBeVisible()
    })
  })

  test.describe('mutation failure', () => {
    test.use({ scenario: 'latency:50,fail:cart.update:503:1' })

    test('a failed quantity change is reported and the cart stays consistent', async ({ app, page }) => {
      await app.login('demo', '/cart')
      const before = await app.cart()
      const line = before.items[0]
      if (!line) throw new Error('fixture cart is empty')
      await page.getByRole('button', { name: `Aumentar quantidade de ${line.nft.name}` }).first().click()
      await expect(page.getByText('O serviço está temporariamente indisponível. Tente novamente.')).toBeVisible()
      expect((await app.cart()).count).toBe(before.count)

      await page.getByRole('button', { name: `Aumentar quantidade de ${line.nft.name}` }).first().click()
      await expect.poll(async () => (await app.cart()).count).toBe(before.count + 1)
    })
  })
})
