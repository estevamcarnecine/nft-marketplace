import { expect, test } from '../fixtures'

const NFT_ID = 'nft-0009'

/** Same formatting as src/lib/eth.ts formatEth: at most 3 decimals, at least 2. */
function eth(price: string): string {
  const rounded = Math.round(Number(price) * 1000) / 1000
  const [whole, fraction = ''] = String(rounded).split('.')
  return `${whole}.${fraction.padEnd(2, '0')}`
}

test.describe('event ordering, duplicates and reconnection', () => {
  test.describe('duplicated and stale events', () => {
    // Every event is delivered twice, and each nft.updated is followed by an older version with
    // bogus data (price 0.01) that must be ignored.
    test.use({ scenario: 'latency:50,event:dup,event:stale' })

    test('apply once and never regress to an older version', async ({ app, page }) => {
      await app.login('demo', '/cart')
      await app.waitForSocket((list) => list[0]?.userId === 'user_demo')
      const line = (await app.cart()).items[0]
      if (!line) throw new Error('fixture cart is empty')

      await app.realtime.changePrice(line.nft.id, 20)
      await expect(page.getByRole('button', { name: 'Entendi' })).toHaveCount(1)
      // Past the stale copy's delivery (300 ms after the real one).
      await page.waitForTimeout(800)
      await expect(page.getByRole('button', { name: 'Entendi' })).toHaveCount(1)
      await expect(page.locator('main')).not.toContainText('0.01 ETH')
      const current = (await app.cart()).items[0]
      await expect(page.locator('section[aria-label="Itens do carrinho"]')).toContainText(eth(current?.nft.price ?? ''))
    })
  })

  test('the detail page is patched in place, without a REST refetch', async ({ app, page }) => {
    await app.goto(`/nft/${NFT_ID}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sage Nomad #009')
    await app.waitForSocket()
    let refetches = 0
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === `/api/nfts/${NFT_ID}`) refetches += 1
    })
    await app.realtime.changePrice(NFT_ID, 10)
    const price = await page.evaluate(
      async (id) => ((await (await fetch(`/api/nfts/${id}`)).json()) as { price: string }).price,
      NFT_ID,
    )
    await expect(page.locator('main')).toContainText(eth(price))
    // The only request is the test's own read above.
    expect(refetches).toBe(1)
  })

  test.describe('an event during the first load', () => {
    test.use({ scenario: 'latency:1200' })

    test('is not lost to the response that was already on its way', async ({ app, page }) => {
      await app.goto(`/nft/${NFT_ID}`)
      await app.waitForSocket()
      // The detail request is still in flight (1.2 s latency) when the change is pushed.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
      await app.realtime.changePrice(NFT_ID, 10)
      const price = (await app.api<{ price: string }>(`/nfts/${NFT_ID}`)).price
      await expect(page.locator('main')).toContainText(eth(price))
    })
  })

  test('after a disconnection the page catches up through REST', async ({ app, page }) => {
    await app.goto(`/nft/${NFT_ID}`)
    await app.waitForSocket()
    // The change happens while no socket is connected, so no event can deliver it.
    await page.evaluate((id) => {
      window.__mock.realtime.dropSockets()
      window.__mock.realtime.changePrice(id, -30)
    }, NFT_ID)
    expect(await app.realtime.sockets()).toHaveLength(0)
    await app.waitForSocket()
    const price = (await app.api<{ price: string }>(`/nfts/${NFT_ID}`)).price
    await expect(page.locator('main')).toContainText(eth(price))
  })

  test.describe('pending order', () => {
    test.use({ scenario: 'latency:50,orderdelay:4000' })

    test('resumes after a reload and is confirmed by order.updated', async ({ app, page }) => {
      await app.login('demo', '/checkout')
      await expect(page.locator('#displayName')).toHaveValue('Demo Collector')
      await page.getByRole('button', { name: 'Confirmar compra' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Confirmar pagamento' }).click()
      await expect(page).toHaveURL(/\/orders\/order_/)
      await expect(page.getByRole('heading', { name: 'Aguardando a confirmação da rede' })).toBeVisible()

      await page.reload()
      await expect(page.getByRole('heading', { name: 'Aguardando a confirmação da rede' })).toBeVisible()
      await app.waitForSocket((list) => list[0]?.userId === 'user_demo')

      // With the socket up the receipt does not poll: the result arrives as a push.
      let polls = 0
      page.on('request', (request) => {
        if (/^\/api\/orders\/[^/]+$/.test(new URL(request.url()).pathname)) polls += 1
      })
      await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({
        timeout: 10_000,
      })
      // One read after the push (for the settled fields), never a polling series.
      expect(polls).toBeLessThanOrEqual(1)
    })
  })
})
