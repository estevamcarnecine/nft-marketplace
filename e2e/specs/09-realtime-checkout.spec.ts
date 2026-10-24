import { expect, test } from '../fixtures'

test.describe('price and availability changes over Socket.IO', () => {
  test('the cart reports a price change and updates the summary @main', async ({ app, page }) => {
    await app.login('demo', '/cart')
    await app.waitForSocket((list) => list[0]?.userId === 'user_demo')
    const before = await app.cart()
    const line = before.items[0]
    expect(line).toBeDefined()
    if (!line) return

    await app.realtime.changePrice(line.nft.id, 20)
    const notice = page.getByRole('status').filter({ hasText: `O preço de ${line.nft.name} mudou` })
    await expect(notice).toBeVisible()

    const after = await app.cart()
    expect(after.total).not.toBe(before.total)
    await expect(page.locator('[aria-labelledby="summary-heading"]')).toContainText(after.total)

    await notice.getByRole('button', { name: 'Entendi' }).click()
    await expect(notice).toHaveCount(0)
  })

  test('the cart reports a sold-out edition and blocks checkout', async ({ app, page }) => {
    await app.login('demo', '/cart')
    await app.waitForSocket((list) => list[0]?.userId === 'user_demo')
    const line = (await app.cart()).items[0]
    if (!line) throw new Error('fixture cart is empty')

    await app.realtime.setStock(line.nft.id, line.edition.id, 0)
    await expect(page.getByRole('status').filter({ hasText: 'esgotou' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
  })

  test('checkout blocks a quote made outdated during review @main', async ({ app, page }) => {
    await app.login('demo', '/checkout')
    await expect(page.locator('#displayName')).toHaveValue('Demo Collector')
    await app.waitForSocket((list) => list[0]?.userId === 'user_demo')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
    await expect(review.getByRole('button', { name: 'Confirmar pagamento' })).toBeVisible()

    const line = (await app.cart()).items[0]
    if (!line) throw new Error('fixture cart is empty')
    await app.realtime.changePrice(line.nft.id, 15)

    await expect(review.getByRole('alert')).toContainText(`O preço de ${line.nft.name} mudou`)
    await expect(review.getByRole('button', { name: 'Confirmar pagamento' })).toHaveCount(0)
    expect(await app.orders()).toHaveLength(0)

    await review.getByRole('button', { name: 'Atualizar valores' }).click()
    const fresh = await app.cart()
    await expect(review).toContainText(fresh.total)
    await review.getByRole('button', { name: 'Confirmar novos valores' }).click()
    await expect(page).toHaveURL(/\/orders\/order_/)
  })
})
