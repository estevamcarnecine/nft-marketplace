import { expect, test } from '../fixtures'

test.describe('NFT detail: direct access and missing resources', () => {
  test('direct access renders the NFT from the API @main', async ({ app, page }) => {
    await app.goto('/nft/nft-0042')
    const nft = await app.api<{ name: string }>('/nfts/nft-0042')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(nft.name)
    await expect(page.getByRole('radio', { name: '1/50', exact: true })).toBeVisible()

    await page.getByRole('radio', { name: '1/1', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
    await page.getByRole('radio', { name: '1/50', exact: true }).click()
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(page.locator('output').first()).toHaveText('2')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(nft.name)
  })

  test('an unknown NFT shows the not-found state @main', async ({ app, page }) => {
    await app.goto('/nft/nao-existe')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/não encontrado/i)
    await expect(page.getByRole('link', { name: /voltar/i }).first()).toBeVisible()
  })

  test('an unknown route shows the app not-found page', async ({ app, page }) => {
    await app.goto('/rota/inexistente')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada')
    await page.getByRole('link', { name: 'VOLTAR AO INÍCIO' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('the gallery switches images @main', async ({ app, page }) => {
    await app.goto('/nft/nft-0042')
    await page.getByRole('button', { name: 'Ver imagem 3 de 4' }).click()
    await expect(page.getByRole('button', { name: 'Ver imagem 3 de 4' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Ver imagem 1 de 4' })).toHaveAttribute('aria-pressed', 'false')
    if (!app.isDesktop) return
    await page.getByRole('button', { name: 'Ampliar imagem' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
