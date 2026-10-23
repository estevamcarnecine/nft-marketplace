import { expect, test } from '../fixtures'

test.describe('catalog: search, filters, sorting, pagination and history', () => {
  test('combined filters reset the page and live in the URL @main', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    const firstPage = await app.cardNames()

    await page.getByRole('button', { name: 'Página 3' }).click()
    await app.catalogSettled()
    await expect(page).toHaveURL(/page=3/)
    const third = await app.api<{ items: { name: string }[] }>('/nfts?page=3&pageSize=9')
    expect(await app.cardNames()).toEqual(third.items.map((item) => item.name))
    expect(third.items.map((item) => item.name)).not.toEqual(firstPage)

    await page.getByRole('checkbox', { name: /Música/ }).click()
    await app.catalogSettled()
    // Any filter change goes back to the first page.
    await expect(page).not.toHaveURL(/page=/)
    await page.getByRole('checkbox', { name: /Solana/ }).click()
    await app.catalogSettled()

    const search = new URL(page.url()).searchParams
    expect(search.get('collections')).toContain('musica')
    expect(search.get('networks')).toContain('solana')

    const names = await app.cardNames()
    expect(names.length).toBeGreaterThan(0)
    const filtered = await app.api<{ total: number }>('/nfts?collections=musica&networks=solana&page=1&pageSize=9')
    await expect(page.locator('#catalog-results')).toContainText(`${filtered.total}`)
  })

  test('sorting by price orders the cards and survives a refresh', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    await page.getByRole('combobox', { name: /Ordenar por/ }).click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await app.catalogSettled()
    await expect(page).toHaveURL(/sort=/)

    const prices = async () =>
      (await page.locator('ul[aria-label="NFTs"] li a span.font-bold').allTextContents()).map((text) =>
        Number.parseFloat(text),
      )
    const sorted = await prices()
    expect(sorted).toEqual([...sorted].sort((a, b) => a - b))

    await page.reload()
    await app.catalogSettled()
    expect(await prices()).toEqual(sorted)
    await expect(page.getByRole('combobox', { name: /Ordenar por/ })).toContainText('Menor preço')
  })

  test('search, empty state and clearing filters', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByLabel('Termo de busca').fill('Emerald')
    await page.keyboard.press('Enter')
    await app.catalogSettled()
    await expect(page).toHaveURL(/q=Emerald/)
    for (const name of await app.cardNames()) expect(name).toMatch(/Emerald/i)

    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByLabel('Termo de busca').fill('xyz-nada')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()

    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await app.catalogSettled()
    await expect(page).not.toHaveURL(/q=/)
    expect((await app.cardNames()).length).toBe(9)
  })

  test('back and forward restore filters, tab and page @main', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    const firstPage = await app.cardNames()

    await page.getByRole('checkbox', { name: /Música/ }).click()
    await app.catalogSettled()
    const musicNames = await app.cardNames()
    await page.getByRole('tab', { name: 'Em alta' }).click()
    await app.catalogSettled()
    await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'true')

    await page.goBack()
    await app.catalogSettled()
    await expect(page.getByRole('tab', { name: 'Em alta' })).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByRole('checkbox', { name: /Música/ })).toHaveAttribute('aria-checked', 'true')
    expect(await app.cardNames()).toEqual(musicNames)

    await page.goBack()
    await app.catalogSettled()
    await expect(page.getByRole('checkbox', { name: /Música/ })).toHaveAttribute('aria-checked', 'false')
    expect(await app.cardNames()).toEqual(firstPage)

    await page.goForward()
    await app.catalogSettled()
    await expect(page.getByRole('checkbox', { name: /Música/ })).toHaveAttribute('aria-checked', 'true')
  })

  test.describe('out-of-order responses', () => {
    test.use({ scenario: 'latency:50,outoforder' })

    test('a slow, older response never replaces the latest filters', async ({ app, page }) => {
      await app.goto('/')
      await app.catalogSettled()
      await page.getByRole('checkbox', { name: /Fotografia/ }).click()
      await page.getByRole('checkbox', { name: /Jogos/ }).click()
      await expect.poll(() => decodeURIComponent(page.url())).toMatch(/collections=.*fotografia.*jogos/)
      await app.catalogSettled()
      // Wait past the delayed (older) response; the grid must still show the latest request.
      await page.waitForTimeout(2_000)
      const expected = await app.api<{ items: { name: string }[] }>(
        '/nfts?collections=fotografia,jogos&page=1&pageSize=9',
      )
      expect(await app.cardNames()).toEqual(expected.items.map((item) => item.name))
    })
  })
})
