import { expect, test, type App } from '../fixtures'

const APE = 'Emerald Ape #042'

/** Builds a visitor cart through the UI: quick add from the catalog, then "COMPRAR" on a detail page. */
async function fillGuestCart(app: App) {
  const { page } = app
  if (app.isDesktop) {
    await app.goto('/')
    await app.catalogSettled()
    const card = page.locator('ul[aria-label="NFTs"] > li').filter({ hasText: APE })
    await card.hover()
    await card.getByRole('button', { name: `Adicionar ${APE} ao carrinho` }).click()
  } else {
    await app.goto('/nft/nft-0042')
    await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
  }
  await expect(page.getByText(`${APE} adicionado ao carrinho.`)).toBeVisible()

  await app.goto('/nft/nft-0009')
  await app.buyButton().click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.locator('section[aria-label="Itens do carrinho"] li')).toHaveCount(2)
}

const total = (app: App) => app.page.locator('[aria-labelledby="summary-heading"]')

test.describe('cart', () => {
  test('quantities, removal and totals come from the API @main', async ({ app, page }) => {
    await fillGuestCart(app)
    await page.getByRole('button', { name: `Aumentar quantidade de ${APE}` }).click()
    await expect.poll(async () => (await app.cart()).items.find((line) => line.nft.name === APE)?.quantity).toBe(2)
    const cart = await app.cart()
    await expect(total(app)).toContainText(cart.total)
    // The mobile cart screen has no header badge; the lines and totals above are what it shows.
    if (app.isDesktop) await expect(app.cartBadge()).toHaveAttribute('aria-label', `Carrinho, ${cart.count} itens`)

    await page.getByRole('button', { name: new RegExp(`^Remover ${APE} .*do carrinho`) }).click()
    await expect(page.locator('section[aria-label="Itens do carrinho"] li')).toHaveCount(1)
    expect((await app.cart()).items.map((line) => line.nft.name)).not.toContain(APE)
  })

  test('coupons: invalid, expired and valid', async ({ app, page }) => {
    await fillGuestCart(app)
    const input = page.getByLabel('Código promocional')
    const apply = page.getByRole('button', { name: 'Aplicar' })

    await input.fill('cupom-falso')
    await apply.click()
    await expect(page.getByRole('alert')).toHaveText('Código promocional inválido')

    await input.fill('NATAL2025')
    await apply.click()
    await expect(page.getByRole('alert')).toHaveText('Este código promocional expirou')

    const before = (await app.cart()).total
    await input.fill('kurio10')
    await apply.click()
    await expect(page.getByText('10% de desconto aplicado')).toBeVisible()
    const after = await app.cart()
    expect(after.coupon?.code).toBe('KURIO10')
    expect(Number(after.total)).toBeLessThan(Number(before))
    await expect(total(app)).toContainText(after.total)
  })

  test('the visitor cart survives a refresh and merges into the account at login @main', async ({ app, page }) => {
    await fillGuestCart(app)
    const guest = await app.cart()
    await page.reload()
    await expect(page.locator('section[aria-label="Itens do carrinho"] li')).toHaveCount(2)

    await app.login('demo', '/cart')
    const merged = await app.cart()
    // The visitor lines were carried into the account cart, which already had its own items.
    for (const line of guest.items) expect(merged.items.map((item) => item.id)).toContain(line.id)
    expect(merged.count).toBeGreaterThan(guest.count)
    const lines = page.locator('section[aria-label="Itens do carrinho"] li')
    await expect(lines).toHaveCount(merged.items.length)

    // Signed-in cart persists after a refresh too.
    await page.reload()
    await expect(lines).toHaveCount(merged.items.length)
    if (app.isDesktop) await expect(app.cartBadge()).toHaveAttribute('aria-label', `Carrinho, ${merged.count} itens`)
  })
})
