import { expect, test } from '../fixtures'

const SETTLE_MS = 30_000

test.describe('full purchase', () => {
  test.use({ scenario: `latency:50,orderdelay:${SETTLE_MS}` })

  test('from the catalog to a confirmed receipt @main', async ({ app, page }) => {
    // The payment result is simulated after SETTLE_MS; the test moves the page clock instead of waiting.
    await page.clock.install()
    await app.login('demo', '/')
    await app.catalogSettled()

    await page.locator('ul[aria-label="NFTs"] > li > a').filter({ hasText: 'Sage Nomad #009' }).click()
    await expect(page).toHaveURL(/\/nft\/nft-0009$/)
    await app.buyButton().click()
    await expect(page).toHaveURL(/\/cart$/)
    const cart = await app.cart()
    expect(cart.items.some((line) => line.nft.id === 'nft-0009')).toBe(true)

    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('#displayName')).toHaveValue('Demo Collector')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
    await expect(review).toBeVisible()
    await expect(review).toContainText(cart.total)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page).toHaveURL(/\/orders\/order_/)
    const receipt = page.getByRole('dialog')
    // Not confirmed until the simulation answers.
    await expect(receipt.getByRole('heading', { name: 'Aguardando a confirmação da rede' })).toBeVisible()
    const orderId = new URL(page.url()).pathname.split('/').at(-1)
    expect((await app.orders()).find((order) => order.id === orderId)?.status).toBe('pending')

    await page.clock.fastForward(SETTLE_MS)
    await expect(receipt.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    expect((await app.orders()).find((order) => order.id === orderId)?.status).toBe('confirmed')

    // Only the purchased quantities leave the cart.
    expect((await app.cart()).count).toBe(0)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/$/)
    await expect(app.cartBadge()).toHaveAttribute('aria-label', 'Carrinho, 0 itens')
  })
})
