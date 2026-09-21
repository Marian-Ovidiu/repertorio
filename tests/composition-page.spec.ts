import { test, expect, type Page, type Locator } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function scroll(page: Page, y: number) {
  await page.evaluate(y => window.scrollTo(0, y), y)
  await page.waitForTimeout(100)
}
async function documentTop(locator: Locator) { return locator.evaluate(e => e.getBoundingClientRect().top + scrollY) }
async function visibleHit(locator: Locator) {
  await expect(locator).toBeInViewport()
  expect(await locator.evaluate(e => {
    const r = e.getBoundingClientRect()
    return r.top >= 0 && r.bottom <= innerHeight && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
  })).toBe(true)
}
test.beforeEach(async ({ page }) => {
  await page.goto('/composizione')
  await expect(page.locator('[data-project-content]')).toHaveCount(3)
  await page.waitForTimeout(150)
})

test('pagina: primo schermo, ancore dirette e passaggi liberi', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  if (page.viewportSize()!.height >= 700) await expect(page.getByRole('link', { name: 'Guarda i tre studi' })).toBeInViewport()
  await expect(page.locator('#opzioni')).not.toHaveAttribute('open')
  for (const id of ['progetti', 'servizi', 'chiusura']) {
    await page.goto(`/composizione#${id}`)
    await page.waitForTimeout(350)
    const box = await page.locator(`#${id}`).boundingBox()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeLessThan(page.viewportSize()!.height - 100)
    if (id !== 'chiusura') expect(box!.y).toBeCloseTo(24, 0)
    if (id === 'progetti') expect((await page.locator('#introduzione').boundingBox())!.y + (await page.locator('#introduzione').boundingBox())!.height).toBeLessThanOrEqual(25)
    if (id === 'servizi') {
      const last = await page.locator('[data-project-content]').last().boundingBox()
      expect(last!.y + last!.height).toBeLessThan(24)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('pagina: lettura delle tre card, sosta, reversibilità e uscita', async ({ page }, info) => {
  const intro = page.locator('#introduzione')
  if (await intro.getAttribute('data-animated') === 'true') {
    const y = await documentTop(intro)
    await scroll(page, y + 70)
    const lit = await intro.getAttribute('data-lit')
    await scroll(page, y + 160)
    expect(Number(await intro.getAttribute('data-lit'))).toBeGreaterThan(Number(lit))
    await scroll(page, y + 70)
    await expect(intro).toHaveAttribute('data-lit', lit!)
  }
  const stack = page.locator('[data-project-slot]').first().locator('..')
  const start = await documentTop(stack)
  const gap = await stack.evaluate(e => parseFloat(getComputedStyle(e).gap))
  const animated = await stack.getAttribute('data-animated') === 'true'
  let y = start
  const readings: number[] = []
  for (let i = 0; i < 3; i++) {
    const slot = page.locator('[data-project-slot]').nth(i)
    const top = animated ? await slot.evaluate(e => parseFloat(getComputedStyle(e).top)) : 24
    const reading = y - top
    await scroll(page, reading)
    if (!animated) await slot.getByRole('link').scrollIntoViewIfNeeded()
    await visibleHit(slot.getByRole('link'))
    const title = slot.getByRole('heading', { level: 3 })
    if (!animated) await title.scrollIntoViewIfNeeded()
    await visibleHit(title)
    const transform = await slot.locator(':scope > div').evaluate(e => getComputedStyle(e).transform)
    await page.waitForTimeout(180)
    expect(await slot.locator(':scope > div').evaluate(e => getComputedStyle(e).transform)).toBe(transform)
    readings.push(reading)
    await page.screenshot({ path: `verification/${info.project.name}-pagina-card-${i + 1}.png` })
    y += await slot.evaluate(e => (e as HTMLElement).offsetHeight) + gap
  }
  await scroll(page, readings[1])
  const before = await page.locator('[data-project-slot]').nth(1).getAttribute('style')
  await scroll(page, await documentTop(page.locator('#servizi')))
  await scroll(page, readings[1])
  expect(await page.locator('[data-project-slot]').nth(1).getAttribute('style')).toBe(before)
  for (const boundary of ['progetti', 'servizi', 'chiusura']) {
    const y = await documentTop(page.locator(`#${boundary}`))
    for (let dy = -160; dy <= 160; dy += 40) await scroll(page, y + dy)
    await page.screenshot({ path: `verification/${info.project.name}-pagina-passaggio-${boundary}.png` })
  }
})

test('pagina: focus della pila e passaggio da tastiera ai servizi', async ({ page }) => {
  const links = page.locator('[data-project-slot] a')
  await scroll(page, await documentTop(page.locator('#servizi')) - 150)
  await links.first().focus()
  for (let i = 0; i < 3; i++) {
    await expect(links.nth(i)).toBeFocused(); await visibleHit(links.nth(i))
    await page.keyboard.press('Tab')
  }
  await expect(page.getByRole('radio', { name: 'Identità', exact: true })).toBeFocused()
  await visibleHit(page.getByRole('radio', { name: 'Identità', exact: true }))
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Siti', exact: true })).toBeChecked()
  await expect(page.getByText('Struttura dei contenuti', { exact: true })).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(links.last()).toBeFocused(); await visibleHit(links.last())
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#servizi$/)
  await page.waitForTimeout(100)
  expect((await page.locator('#servizi').boundingBox())!.y).toBeCloseTo(24, 0)
})

test('pagina: input rapidi, confronto globale, reset e ridotto prioritario', async ({ page }, info) => {
  const choices = ['Interazioni', 'Identità', 'Siti', 'Interazioni']
  for (const name of choices) {
    const option = page.getByRole('radio', { name, exact: true })
    if (info.project.use.hasTouch) await option.tap()
    else await option.check()
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await page.waitForTimeout(90)
  }
  await page.waitForTimeout(1100)
  await expect(page.locator('[data-material]')).toHaveAttribute('data-moving', 'false')
  await page.locator('#opzioni summary').click()
  await page.getByRole('radio', { name: 'Flusso normale', exact: true }).check()
  await expect(page.locator('#introduzione')).toHaveAttribute('data-animated', 'false')
  await expect(page.locator('[data-project-slot]').first().locator('..')).toHaveAttribute('data-animated', 'false')
  await expect(page.getByRole('radio', { name: 'Interazioni', exact: true })).toBeChecked()
  const boxes = await page.locator('[data-project-slot]').evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom } }))
  expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom)
  expect(boxes[2].top).toBeGreaterThan(boxes[1].bottom)
  await page.getByRole('radio', { name: 'Siti', exact: true }).check()
  await expect(page.locator('[data-material]')).toHaveAttribute('data-moving', 'false')
  await page.getByRole('radio', { name: 'Animata', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await expect(page.locator('#introduzione')).toHaveAttribute('data-animated', 'false')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Ripristina la pagina' }).click()
  await expect(page.locator('#introduzione')).toHaveAttribute('data-animated', 'false')
  await expect(page.getByRole('radio', { name: 'Identità', exact: true })).toBeChecked()
  await page.getByRole('radio', { name: 'Interazioni', exact: true }).check()
  await expect(page.locator('[data-material]')).toHaveAttribute('data-moving', 'false')
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
})

test('pagina: resize a metà pila e contenuti lunghi senza collisioni', async ({ page }) => {
  await scroll(page, (await documentTop(page.locator('[data-project-slot]').first().locator('..'))) + 450)
  for (const [width, height] of [[390, 844], [1440, 500], [1440, 900]]) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(160)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.locator('#intro-title > [aria-hidden]').evaluate(e => { e.textContent = 'Progettiamo identità comprensibili e siti accessibili. '.repeat(45) })
  await page.locator('[data-project-content]').nth(1).locator('p').evaluate(e => { e.textContent = 'Ogni contenuto ha bisogno di spazio per essere letto completamente, anche quando cambia la composizione. '.repeat(35) })
  await expect(page.locator('#introduzione')).toHaveAttribute('data-animated', 'false')
  await expect(page.locator('[data-project-slot]').first().locator('..')).toHaveAttribute('data-animated', 'false')
  const link = page.locator('[data-project-slot]').nth(1).getByRole('link')
  await link.focus(); await visibleHit(link)
  await page.locator('[data-service-copy]').first().locator('p').evaluate(e => { e.textContent = 'Descrizione estesa del servizio e delle attività incluse. '.repeat(50) })
  await page.getByRole('radio', { name: 'Identità', exact: true }).check()
  const response = await page.locator('[data-service-copy]').first().boundingBox()
  const closing = await page.locator('#chiusura').boundingBox()
  expect(response!.y + response!.height).toBeLessThan(closing!.y)
  await page.locator('#chiusura a').focus(); await visibleHit(page.locator('#chiusura a'))
})
