import { expect, test, type App } from '../fixtures'

async function openReview(app: App) {
  await app.login('demo', '/checkout')
  await expect(app.page.locator('#displayName')).toHaveValue('Demo Collector')
  await app.page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = app.page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(review.getByRole('button', { name: 'Confirmar pagamento' })).toBeEnabled()
  return review
}

test.describe('payment failures', () => {
  test.describe('rejected payment', () => {
    test.use({ scenario: 'latency:50,orderfail,orderdelay:500' })

    test('shows the rejection and keeps the cart', async ({ app, page }) => {
      const review = await openReview(app)
      const before = await app.cart()
      await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

      await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
      await expect(page.getByRole('dialog').getByRole('alert')).toContainText('recusado')
      const orders = await app.orders()
      expect(orders.map((order) => order.status)).toEqual(['rejected'])
      expect((await app.cart()).count).toBe(before.count)
    })
  })

  test.describe('repeated clicks', () => {
    test.use({ scenario: 'latency:300,orderdelay:500' })

    test('create a single order', async ({ app, page }) => {
      const review = await openReview(app)
      await review.getByRole('button', { name: 'Confirmar pagamento' }).click({ clickCount: 3, delay: 20 })
      await expect(page).toHaveURL(/\/orders\/order_/)
      await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
      expect(await app.orders()).toHaveLength(1)
    })
  })

  test.describe('timeout', () => {
    // The order is created, but its response arrives after the client's 10 s timeout. The client
    // retries with the same Idempotency-Key and must land on that same order.
    test.use({ scenario: 'latency:50,ordertimeout,orderdelay:500' })

    test('recovers the order created by the timed-out request', async ({ app, page }) => {
      test.slow()
      const review = await openReview(app)
      await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
      await expect(review.getByRole('button', { name: 'Enviando pedido…' })).toBeVisible()

      await expect(page).toHaveURL(/\/orders\/order_/, { timeout: 40_000 })
      const orders = await app.orders()
      expect(orders).toHaveLength(1)
      expect(new URL(page.url()).pathname).toBe(`/orders/${orders[0]?.id}`)
      await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    })
  })
})
