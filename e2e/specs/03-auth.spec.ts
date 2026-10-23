import { PASSWORD, USERS, expect, test } from '../fixtures'

test.describe('sign up, login, session expiry, logout and user switch', () => {
  test('sign up validates, reports conflicts and signs the new user in @main', async ({ app, page }) => {
    await app.goto('/login?redirect=/cart')
    await page.getByRole('link', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/signup\?redirect=/)

    const submit = () => page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    const fill = async (username: string, email: string, password: string, confirm: string) => {
      await page.locator('#signup-username').fill(username)
      await page.locator('#signup-email').fill(email)
      await page.locator('#signup-password').fill(password)
      await page.locator('#signup-confirm-password').fill(confirm)
    }

    await fill('a b', 'x', 'curta', 'outra')
    await submit()
    await expect(page.locator('#signup-username-error')).toBeVisible()
    await expect(page.locator('#signup-email-error')).toBeVisible()
    await expect(page.locator('#signup-password-error')).toBeVisible()
    await expect(page.locator('#signup-confirm-password-error')).toBeVisible()

    // The e-mail belongs to a fixture user: the API answers 409 and the field says so.
    await fill('nova_conta', USERS.demo.email, 'Senha1234', 'Senha1234')
    await submit()
    await expect(page.locator('#signup-email-error')).toBeVisible()
    await expect(page.locator('#signup-email')).toBeFocused()

    await fill('nova_conta', 'nova@kurio.io', 'Senha1234', 'Senha1234')
    await submit()
    await expect(page).toHaveURL(/\/cart$/)
    await expect(app.header.getByRole('button', { name: /^Conta de/ })).toBeVisible()
  })

  test('wrong credentials keep the user signed out', async ({ app, page }) => {
    await app.goto('/login')
    await page.locator('#login-email').fill(USERS.demo.email)
    await page.locator('#login-password').fill('senha-errada')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('an expired session mid-checkout returns to the same draft after login @main', async ({ app, page }) => {
    await app.login('demo', '/checkout')
    await expect(page.locator('#displayName')).toHaveValue(USERS.demo.name)
    await page.locator('#displayName').fill('Rascunho Mantido')

    await app.expireSessions()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/)
    await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeVisible()

    await page.locator('#login-email').fill(USERS.demo.email)
    await page.locator('#login-password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('#displayName')).toHaveValue('Rascunho Mantido')
  })

  test('logout clears the session and private routes ask to sign in again', async ({ app, page }) => {
    await app.login('demo', '/profile')
    await app.header.getByRole('button', { name: `Conta de ${USERS.demo.name}` }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(app.header.getByRole('link', { name: 'Entrar' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('nft.token'))).toBeNull()

    await app.goto('/profile')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/)
  })

  test('switching users shows only the new user data @main', async ({ app, page }) => {
    await app.login('demo', '/profile')
    await expect(page.locator('#displayName')).toHaveValue(USERS.demo.name)
    await expect(app.cartBadge()).not.toHaveAttribute('aria-label', 'Carrinho, 0 itens')

    await app.header.getByRole('button', { name: `Conta de ${USERS.demo.name}` }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(app.header.getByRole('link', { name: 'Entrar' })).toBeVisible()

    await app.login('ana', '/profile')
    await expect(page.locator('#displayName')).toHaveValue(USERS.ana.name)
    const anaCart = await app.cart()
    await expect(app.cartBadge()).toHaveAttribute('aria-label', `Carrinho, ${anaCart.count} itens`)
    await app.waitForSocket((list) => list.length === 1 && list[0]?.userId === 'user_ana')
  })

  test('logging out in another tab ends the session here too', async ({ app, page, context }) => {
    await app.login('demo', '/profile')
    const other = await context.newPage()
    await other.goto('/wallets')
    await other.getByRole('button', { name: 'Sair' }).last().click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/)
    await expect(page.getByText('Você saiu da sua conta em outra aba.')).toBeVisible()
  })
})
