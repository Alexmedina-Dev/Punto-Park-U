import { test, expect } from '@playwright/test'

const REACT_URL = 'http://localhost:5173'

test.describe('Login Pages — Visual Match with Vanilla', () => {
  test.describe('User Login (/login)', () => {
    test('has split layout: form left, visual right on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${REACT_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      // Should NOT have the shared header (standalone page)
      const header = page.locator('header')
      await expect(header).toHaveCount(0)

      // Brand text (uses curly quotes from HTML entities)
      await expect(page.locator('h2')).toContainText('PUNTO PARK U')

      // Title
      await expect(page.locator('h1')).toContainText('Inicio de sesión usuario')

      // Form fields — data-testid is directly on the INPUT element
      await expect(page.locator('[data-testid="login-username"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-password"]')).toBeVisible()
      await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()

      // Register link
      await expect(page.locator('text=Regístrate aquí')).toBeVisible()

      // Visual column — avatar
      await expect(page.locator('text=person')).toBeVisible()

      // Shield badge
      await expect(page.locator('text=shield')).toBeVisible()

      // Online badge
      await expect(page.locator('text=System Online')).toBeVisible()

      // Screenshot
      await page.screenshot({ path: 'tests/screenshots/react-login-desktop.png', fullPage: true })
    })

    test('stacks vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`${REACT_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      // Visual column should be visible (stacked above form on mobile)
      await expect(page.locator('text=System Online')).toBeVisible()

      // Form should also be visible
      await expect(page.locator('[data-testid="login-username"]')).toBeVisible()

      await page.screenshot({ path: 'tests/screenshots/react-login-mobile.png', fullPage: true })
    })

    test('password toggle works', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${REACT_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const passwordInput = page.locator('[data-testid="login-password"]')
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle
      const toggle = page.locator('[aria-label="Mostrar contraseña"]')
      await toggle.click()

      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      const hideToggle = page.locator('[aria-label="Ocultar contraseña"]')
      await hideToggle.click()

      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('shows validation errors for short inputs', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${REACT_URL}/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      // Type short username and password
      await page.locator('[data-testid="login-username"]').fill('ab')
      await page.locator('[data-testid="login-password"]').fill('1234567')
      await page.locator('[data-testid="login-submit"]').click()

      // Should show validation errors
      await expect(page.locator('text=al menos 3 caracteres')).toBeVisible()
      await expect(page.locator('text=al menos 8 caracteres')).toBeVisible()
    })
  })

  test.describe('Admin Login (/admin/login)', () => {
    test('has split layout with admin title', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`${REACT_URL}/admin/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      // Should NOT have the shared header
      const header = page.locator('header')
      await expect(header).toHaveCount(0)

      // Brand text
      await expect(page.locator('h2')).toContainText('PUNTO PARK U')

      // Admin title (not user title)
      await expect(page.locator('h1')).toContainText('Inicio de sesión Administrador')

      // Form fields
      await expect(page.locator('[data-testid="admin-username"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-password"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-submit"]')).toBeVisible()

      // Visual column — avatar
      await expect(page.locator('text=person')).toBeVisible()

      // No register link (admin doesn't have it)
      await expect(page.locator('text=Regístrate aquí')).toHaveCount(0)

      await page.screenshot({ path: 'tests/screenshots/react-admin-login-desktop.png', fullPage: true })
    })

    test('stacks vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`${REACT_URL}/admin/login`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      await expect(page.locator('text=System Online')).toBeVisible()
      await expect(page.locator('[data-testid="admin-username"]')).toBeVisible()

      await page.screenshot({ path: 'tests/screenshots/react-admin-login-mobile.png', fullPage: true })
    })
  })
})
