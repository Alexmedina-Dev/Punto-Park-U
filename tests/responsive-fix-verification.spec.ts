import { test, expect } from '@playwright/test'

const VANILLA_URL = 'http://localhost:3000'
const REACT_URL = 'http://localhost:5173'

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

const SECTIONS = [
  { id: 'why-us-section', name: 'why' },
  { id: 'pricing-section', name: 'pricing' },
  { id: 'availability-section', name: 'availability' },
  { id: 'flux-ai-section', name: 'fluxai' },
  { id: 'location-section', name: 'location' },
  { id: 'footer', name: 'footer' },
] as const

// Grid column count expectations per section per breakpoint
// Based on vanilla CSS: 768px=tablet, 1024px+=desktop
const GRID_EXPECTATIONS = {
  why: {
    // Vanilla: 1 col mobile, 2 cols at 768+, 4 cols at 1024+
    mobile: 1,
    tablet: 2,
    desktop: 4,
    desktopWide: 4,
  },
  pricing: {
    // Vanilla: 1 col mobile, 2 cols at 768+, 4 cols at 1024+
    mobile: 1,
    tablet: 2,
    desktop: 4,
    desktopWide: 4,
  },
  availability: {
    // Vanilla: 1 col mobile, 3 cols at 768+
    mobile: 1,
    tablet: 3,
    desktop: 3,
    desktopWide: 3,
  },
  fluxai: {
    // Vanilla: 1 col mobile, 2 cols at 1024+ (lg:grid-cols-2 stays correct)
    mobile: 1,
    tablet: 1,
    desktop: 2,
    desktopWide: 2,
  },
  location: {
    // Vanilla: 1 col mobile, 5fr 7fr at 1024+ (lg:grid-cols-[5fr_7fr])
    mobile: 1,
    tablet: 1,
    desktop: 2,
    desktopWide: 2,
  },
  footer: {
    // Vanilla: 1 col mobile, 2 cols at 768+
    mobile: 1,
    tablet: 2,
    desktop: 2,
    desktopWide: 2,
  },
} as const

test.describe('Responsive Fix Verification — React vs Vanilla', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      for (const section of SECTIONS) {
        test(`${section.name} — grid columns match vanilla`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height })
          await page.goto(REACT_URL, { waitUntil: 'networkidle' })

          const sectionEl = page.locator(`[data-testid="${section.id}"]`)
          await expect(sectionEl).toBeVisible({ timeout: 10000 })

          // Scroll into view
          await sectionEl.scrollIntoViewIfNeeded()
          await page.waitForTimeout(300)

          // Determine expected column count
          let breakpoint: keyof typeof GRID_EXPECTATIONS.why
          if (viewport.width < 768) breakpoint = 'mobile'
          else if (viewport.width < 1024) breakpoint = 'tablet'
          else if (viewport.width < 1440) breakpoint = 'desktop'
          else breakpoint = 'desktopWide'

          const expected = GRID_EXPECTATIONS[section.name][breakpoint]

          // Count visible grid children in the first grid descendant
          const gridChildren = await sectionEl.evaluate((el, bw) => {
            // Find the grid container (first element with display: grid)
            const grids = el.querySelectorAll('[class*="grid"]')
            for (const grid of grids) {
              const style = window.getComputedStyle(grid)
              if (style.display === 'grid') {
                const cols = style.gridTemplateColumns
                  .split(' ')
                  .filter((c) => c !== '0px').length
                return cols
              }
            }
            return -1
          }, breakpoint)

          console.log(
            `[${viewport.name}] ${section.name}: expected=${expected}, actual=${gridChildren}`
          )
          expect(gridChildren).toBe(expected)

          // Screenshot for visual comparison
          await sectionEl.screenshot({
            path: `tests/screenshots/react-${section.name}-${viewport.name}.png`,
          })
        })
      }

      test(`flux-badge — hidden below 1024, visible at 1024+`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(REACT_URL, { waitUntil: 'networkidle' })

        const badge = page.locator('[data-testid="flux-badge"]')
        await expect(badge).toBeAttached({ timeout: 10000 })

        const isVisible = await badge.isVisible()

        if (viewport.width >= 1024) {
          expect(isVisible).toBe(true)
        } else {
          expect(isVisible).toBe(false)
        }
      })

      test(`availability-header — flex row at 768+`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(REACT_URL, { waitUntil: 'networkidle' })

        const header = page.locator('[data-testid="availability-section"]').locator('.flex').first()
        await expect(header).toBeVisible({ timeout: 10000 })

        const flexDir = await header.evaluate((el) =>
          window.getComputedStyle(el).flexDirection
        )

        if (viewport.width >= 768) {
          expect(flexDir).toBe('row')
        } else {
          expect(flexDir).toBe('column')
        }
      })
    })
  }
})
