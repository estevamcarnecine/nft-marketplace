import { expect, test } from '../fixtures'

test.describe('keyboard, dialog focus and form validation', () => {
  test('catalog card actions are reachable and usable from the keyboard', async ({ app, page }) => {
    await app.goto('/')
    await app.catalogSettled()
    const card = page.locator('ul[aria-label="NFTs"] > li').first()
    const name = (await app.cardNames())[0] ?? ''
    await card.locator('a').first().focus()

    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toHaveAttribute('aria-label', new RegExp(name.replace('#', '\\#')))
    // Tab until the quick-add action of the same card, then activate it with Enter.
    for (let step = 0; step < 3; step += 1) {
      if ((await focused.getAttribute('aria-label'))?.startsWith('Adicionar')) break
      await page.keyboard.press('Tab')
    }
    await expect(focused).toHaveAttribute('aria-label', `Adicionar ${name} ao carrinho`)
    await page.keyboard.press('Enter')
    await expect(page.getByText(`${name} adicionado ao carrinho.`)).toBeVisible()
  })

  test('the login dialog takes focus, traps it and closes with Escape', async ({ app, page }) => {
    await app.goto('/')
    await app.header.getByRole('link', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.locator('#login-email')).toBeFocused()

    // Focus never leaves the dialog while it is open.
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }

    // Escape closes the innermost layer first: an "em breve" tooltip opened by tabbing stays on
    // top until its exit animation ends, so go back to a plain field and let it close.
    await page.locator('#login-email').focus()
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('login validation is announced and focuses the first invalid field', async ({ app, page }) => {
    await app.goto('/login')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = page.locator('#login-email')
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy?.split(' ')[0]}`)).toBeVisible()
  })

  test('checkout validation errors are linked to their fields @main', async ({ app, page }) => {
    await app.login('demo', '/checkout')
    await expect(page.locator('#displayName')).toHaveValue('Demo Collector')
    await page.locator('#username').fill('a')
    await page.locator('#walletAddress').fill('0x123')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // The first invalid field in reading order takes focus.
    await expect(page.locator('#walletAddress')).toBeFocused()
    for (const field of ['username', 'walletAddress']) {
      await expect(page.locator(`#${field}`)).toHaveAttribute('aria-invalid', 'true')
      await expect(page.locator(`#${field}`)).toHaveAttribute('aria-describedby', new RegExp(`${field}-error`))
      await expect(page.locator(`#${field}-error`)).toBeVisible()
    }
    // Invalid data never reaches the review step.
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('the account menu works from the keyboard', async ({ app, page }) => {
    await app.login('demo', '/')
    const trigger = app.header.getByRole('button', { name: 'Conta de Demo Collector' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeVisible()
    // Opening from the keyboard focuses the first item; arrows move through the rest.
    await expect(page.getByRole('menuitem', { name: 'Dados do perfil' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: 'Carteiras' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})
