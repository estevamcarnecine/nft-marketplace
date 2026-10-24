import path from 'node:path'
import { PASSWORD, expect, test } from '../fixtures'

const ASSETS = path.join(import.meta.dirname, '..', 'assets')
const SOLANA_ADDRESS = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'

test.describe('profile', () => {
  test('client and server validation errors land on their fields', async ({ app, page }) => {
    await app.login('demo', '/profile')
    await expect(page.locator('#displayName')).toHaveValue('Demo Collector')

    await page.locator('#displayName').fill('')
    await page.locator('#username').fill('x')
    await page.locator('#newPassword').fill('abc')
    await page.getByRole('button', { name: 'Salvar' }).click()
    for (const field of ['displayName', 'username', 'currentPassword', 'newPassword']) {
      await expect(page.locator(`#${field}-error`)).toBeVisible()
    }

    await page.locator('#displayName').fill('Demo Collector')
    await page.locator('#username').fill('demo_collector')
    await page.locator('#newPassword').fill('')
    await page.locator('#email').fill('colecionador@kurio.io')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.locator('#email-error')).toBeVisible()
  })

  test('saves the profile and changes the password', async ({ app, page }) => {
    await app.login('demo', '/profile')
    await expect(page.locator('#displayName')).toHaveValue('Demo Collector')
    await page.locator('#displayName').fill('Demo Renomeado')

    await page.locator('#currentPassword').fill('senha-errada1')
    await page.locator('#newPassword').fill('NovaSenha1')
    await page.locator('#confirmPassword').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.locator('#currentPassword-error')).toBeVisible()

    await page.locator('#currentPassword').fill(PASSWORD)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()
    await expect(page.locator('#newPassword')).toHaveValue('')

    await page.reload()
    await expect(page.locator('#displayName')).toHaveValue('Demo Renomeado')
    const relogin = await page.evaluate(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@kurio.io', password: 'NovaSenha1' }),
      })
      return response.status
    })
    expect(relogin).toBe(200)
  })

  test('avatar: rejects a non-image, uploads and removes', async ({ app, page }) => {
    await app.login('demo', '/profile')
    const input = page.locator('input[type="file"]')
    await input.setInputFiles(path.join(ASSETS, 'not-an-image.txt'))
    await expect(page.locator('#avatar-error')).toBeVisible()

    await input.setInputFiles(path.join(ASSETS, 'avatar.png'))
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toHaveCount(0)
  })
})

test.describe('wallets', () => {
  test('primary wallet validation and save', async ({ app, page }) => {
    await app.login('demo', '/wallets')
    await expect(page.locator('#walletNickname')).toHaveValue('MetaMask principal')

    await page.locator('#walletAddress').fill('0x123')
    await page.locator('#walletNickname').fill('')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.locator('#walletAddress-error')).toBeVisible()
    await expect(page.locator('#walletNickname-error')).toBeVisible()

    await page.locator('#walletAddress').fill('0x1111111111111111111111111111111111111111')
    await page.locator('#walletNickname').fill('Cofre principal')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.')).toBeVisible()
    await page.reload()
    await expect(page.locator('#walletNickname')).toHaveValue('Cofre principal')
  })

  test('secondary wallet: validation, duplicate conflict, add and remove', async ({ app, page }) => {
    await app.login('demo', '/wallets')
    await expect(page.locator('#walletNickname')).toHaveValue('MetaMask principal')
    const primaryAddress = await page.locator('#walletAddress').inputValue()

    await page.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(dialog.locator('#wallet-label-error')).toBeVisible()

    await dialog.locator('#wallet-label').fill('Cópia')
    await dialog.locator('#wallet-type').click()
    await page.getByRole('option', { name: 'MetaMask' }).click()
    await dialog.locator('#wallet-network').click()
    await page.getByRole('option', { name: 'Ethereum' }).click()
    await dialog.locator('#wallet-address').fill(primaryAddress)
    await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(dialog.locator('#wallet-address-error')).toBeVisible()

    await dialog.locator('#wallet-label').fill('Phantom Solana')
    await dialog.locator('#wallet-network').click()
    await page.getByRole('option', { name: 'Solana' }).click()
    await dialog.locator('#wallet-address').fill(SOLANA_ADDRESS)
    await dialog.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Remover Phantom Solana' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover Phantom Solana' }).click()
    await expect(page.getByRole('button', { name: 'Remover Phantom Solana' })).toHaveCount(0)
  })
})
