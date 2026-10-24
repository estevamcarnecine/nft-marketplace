import { expect, test, type App } from '../fixtures'

const NFT = 'Emerald Ape #042'

async function favoriteButton(app: App) {
  const card = app.page.locator('ul[aria-label="NFTs"] > li').filter({ hasText: NFT })
  await card.hover()
  return card.getByRole('button', { name: new RegExp(`${NFT} (aos|dos) favoritos|Favoritar ${NFT}`) })
}

test.describe('favorites', () => {
  test('a visitor is sent to sign in and comes back', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    await (await favoriteButton(app)).click()
    await expect(page).toHaveURL(/\/login\?redirect=/)
  })

  test('favoriting is optimistic and persists after a reload', async ({ app, page }) => {
    await app.login('demo', '/')
    await app.catalogSettled()
    const button = await favoriteButton(app)
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Adicionado aos favoritos.')).toBeVisible()

    await page.reload()
    await app.catalogSettled()
    await expect(await favoriteButton(app)).toHaveAttribute('aria-pressed', 'true')
  })

  test.describe('when the API fails once', () => {
    test.use({ scenario: 'latency:50,fail:favorite.set:500:1' })

    test('the optimistic change is rolled back, then a retry succeeds', async ({ app, page }) => {
      await app.login('demo', '/')
      await app.catalogSettled()
      const button = await favoriteButton(app)
      await button.click()
      await expect(page.getByText('Não foi possível atualizar seus favoritos. Tente novamente.')).toBeVisible()
      await expect(button).toHaveAttribute('aria-pressed', 'false')

      await button.click()
      await expect(page.getByText('Adicionado aos favoritos.')).toBeVisible()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      expect((await app.api<{ favorited: boolean }>('/nfts/nft-0042')).favorited).toBe(true)
    })
  })

  test('the detail page shares the same favorite state', async ({ app, page }) => {
    await app.login('demo', '/nft/nft-0042')
    const toggle = page.getByRole('button', { name: /^Favorit/ }).first()
    const before = await toggle.getAttribute('aria-pressed')
    await toggle.click()
    await expect(toggle).not.toHaveAttribute('aria-pressed', before ?? 'false')
    await expect(page.getByText(/(Adicionado aos|Removido dos) favoritos\./)).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: /^Favorit/ }).first()).not.toHaveAttribute(
      'aria-pressed',
      before ?? 'false',
    )
  })
})
