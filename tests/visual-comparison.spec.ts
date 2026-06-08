import { test } from '@playwright/test'

const VANILLA_URL = 'file:///C:/Projects/Punto-Park-U-Web/index.html'
const REACT_URL = 'http://localhost:5173/'

test.describe('Visual Comparison: Vanilla vs React', () => {
  // Desktop
  test('01-Hero-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Hero Desktop')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/01-hero-react-desktop.png' })
    console.log('✅ React hero guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/01-hero-vanilla-desktop.png' })
    console.log('✅ Vanilla hero guardado')
  })

  test('02-Why-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Tu Aliado (Why) Desktop')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#why').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/02-why-react-desktop.png' })
    console.log('✅ React why guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#why').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/02-why-vanilla-desktop.png' })
    console.log('✅ Vanilla why guardado')
  })

  test('03-Pricing-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Tarifas Desktop')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/03-pricing-react-desktop.png' })
    console.log('✅ React pricing guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/03-pricing-vanilla-desktop.png' })
    console.log('✅ Vanilla pricing guardado')
  })

  test('04-Availability-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Disponibilidad Desktop')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#availability').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'tests/screenshots/04-availability-react-desktop.png' })
    console.log('✅ React availability guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#availability').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'tests/screenshots/04-availability-vanilla-desktop.png' })
    console.log('✅ Vanilla availability guardado')
  })

  test('05-FluxAI-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Flux AI Desktop')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#flux-AI').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/05-fluxai-react-desktop.png' })
    console.log('✅ React fluxai guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#flux-AI').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/05-fluxai-vanilla-desktop.png' })
    console.log('✅ Vanilla fluxai guardado')
  })

  test('06-Location-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Ubicación Desktop')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#locations').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/06-location-react-desktop.png' })
    console.log('✅ React location guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('#locations').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/06-location-vanilla-desktop.png' })
    console.log('✅ Vanilla location guardado')
  })

  // Mobile
  test('07-Hero-Mobile', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Hero Mobile')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/07-hero-react-mobile.png' })
    console.log('✅ React hero mobile guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/07-hero-vanilla-mobile.png' })
    console.log('✅ Vanilla hero mobile guardado')
  })

  test('08-Hamburger-Mobile', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Hamburguesa Mobile')
    
    // React - Cerrada
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/08-hamburger-react-closed.png' })
    console.log('✅ React hamburger cerrada guardada')

    // React - Abierta
    const reactHamburger = page.locator('button[aria-label*="menú"]').or(page.locator('button[aria-label*="Abrir"]')).first()
    await reactHamburger.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'tests/screenshots/08-hamburger-react-open.png' })
    console.log('✅ React hamburger abierta guardada')

    // Vanilla - Cerrada
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/08-hamburger-vanilla-closed.png' })
    console.log('✅ Vanilla hamburger cerrada guardada')

    // Vanilla - Abierta
    const vanillaHamburger = page.locator('button[class*="menu-toggle"]').first()
    await vanillaHamburger.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'tests/screenshots/08-hamburger-vanilla-open.png' })
    console.log('✅ Vanilla hamburger abierta guardada')
  })

  test('09-Pricing-Mobile', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Tarifas Mobile')
    
    // React
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/09-pricing-react-mobile.png' })
    console.log('✅ React pricing mobile guardado')

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: 'tests/screenshots/09-pricing-vanilla-mobile.png' })
    console.log('✅ Vanilla pricing mobile guardado')
  })

  test('10-Full-Scroll-Desktop', async ({ page }) => {
    console.log('\n🎯 CAPTURANDO: Full Page Desktop (scroll completo)')
    
    // React - Multiple screenshots durante scroll
    await page.goto(REACT_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    
    const bodyHandle = await page.$('body')
    const boundingBox = await bodyHandle?.boundingBox()
    const bodyHeight = boundingBox?.height || 0
    
    let currentY = 0
    let screenshotNum = 0
    while (currentY < bodyHeight) {
      await page.evaluate((y) => window.scrollTo(0, y), currentY)
      await page.waitForTimeout(300)
      await page.screenshot({ path: `tests/screenshots/10-scroll-react-${String(screenshotNum).padStart(2, '0')}.png` })
      screenshotNum++
      currentY += 1200
    }
    console.log(`✅ React scroll guardado (${screenshotNum} screenshots)`)

    // Vanilla
    await page.goto(VANILLA_URL)
    await page.setViewportSize({ width: 1440, height: 900 })
    
    const bodyHandleVanilla = await page.$('body')
    const boundingBoxVanilla = await bodyHandleVanilla?.boundingBox()
    const bodyHeightVanilla = boundingBoxVanilla?.height || 0
    
    currentY = 0
    screenshotNum = 0
    while (currentY < bodyHeightVanilla) {
      await page.evaluate((y) => window.scrollTo(0, y), currentY)
      await page.waitForTimeout(300)
      await page.screenshot({ path: `tests/screenshots/10-scroll-vanilla-${String(screenshotNum).padStart(2, '0')}.png` })
      screenshotNum++
      currentY += 1200
    }
    console.log(`✅ Vanilla scroll guardado (${screenshotNum} screenshots)`)
  })
})
