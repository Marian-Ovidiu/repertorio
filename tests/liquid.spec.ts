import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const radio = (page: Page, name: string) => page.getByRole('radio', { name, exact: true })
const material = (page: Page) => page.locator('[data-material]')
async function open(page: Page) {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00Z') })
  await page.goto('/liquido')
  await page.clock.pauseAt(new Date('2026-09-21T12:00:02Z'))
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
}
async function controls(page: Page) {
  const panel = page.locator('#regolazioni')
  if (!await panel.evaluate(e => (e as HTMLDetailsElement).open)) await panel.locator('summary').first().click()
}
async function shape(page: Page) {
  return page.locator('[data-mass]').evaluate(e => ['cx', 'cy', 'rx', 'ry'].map(key => Number(e.getAttribute(key))))
}
async function settled(page: Page, index: number) {
  await expect(material(page)).toHaveAttribute('data-moving', 'false')
  await expect.poll(() => page.locator(`[data-choice="${index}"]`).evaluate(e => {
    const r = e.getBoundingClientRect(), a = e.closest('fieldset')!.parentElement!.getBoundingClientRect()
    const mass = document.querySelector('[data-mass]')!
    return Math.max(Math.abs(Number(mass.getAttribute('cx')) - (r.left - a.left + r.width / 2)), Math.abs(Number(mass.getAttribute('cy')) - (r.top - a.top + r.height / 2)))
  })).toBeLessThan(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}
// Rasterize the actual SVG in this browser and count connected alpha regions.
// This checks that a bridge really forms and disappears, not just that a filter exists.
async function pixels(page: Page) {
  return material(page).evaluate(async svg => {
    const copy = svg.cloneNode(true) as SVGSVGElement
    const r = svg.getBoundingClientRect(), w = Math.ceil(r.width), h = Math.ceil(r.height)
    copy.setAttribute('width', String(w)); copy.setAttribute('height', String(h))
    const image = new Image()
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy))
    await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0, w, h)
    const data = context.getImageData(0, 0, w, h).data, seen = new Uint8Array(w * h), stack: number[] = []
    let components = 0, filled = 0, clipped = false, checksum = 0
    for (let i = 0; i < w * h; i++) {
      const alpha = data[i * 4 + 3]
      checksum = (checksum + alpha * (i % 997)) % 1e9
      if (alpha < 128) continue
      filled++
      if (i % w < 2 || i % w >= w - 2 || i < 2 * w || i >= w * (h - 2)) clipped = true
      if (seen[i]) continue
      let size = 0; stack.push(i); seen[i] = 1
      while (stack.length) {
        const at = stack.pop()!; size++
        for (const next of [at - w, at + w, ...(at % w ? [at - 1] : []), ...(at % w < w - 1 ? [at + 1] : [])]) {
          if (next >= 0 && next < w * h && !seen[next] && data[next * 4 + 3] >= 128) { seen[next] = 1; stack.push(next) }
        }
      }
      if (size > 200) components++
    }
    return { components, filled, clipped, checksum }
  })
}

test('liquido: scelta immediata, contenuto, tastiera e selezione già attiva', async ({ page }) => {
  await open(page)
  const response = page.locator('[data-active="true"]')
  const height = (await page.locator('#scena').boundingBox())!.height
  for (const [i, name] of ['Interazioni', 'Identità', 'Siti'].entries()) {
    await radio(page, name).click()
    await expect(radio(page, name)).toBeChecked()
    await expect(response.getByRole('heading', { level: 3 })).toHaveText(name)
    expect((await page.locator('#scena').boundingBox())!.height).toBe(height)
    await page.clock.runFor(1100); await settled(page, [2, 0, 1][i])
  }
  const before = await shape(page)
  await radio(page, 'Siti').click(); await page.clock.runFor(300)
  expect(await shape(page)).toEqual(before)
  await radio(page, 'Siti').hover(); await expect(radio(page, 'Siti')).toBeChecked()
  await radio(page, 'Identità').hover(); await expect(radio(page, 'Siti')).toBeChecked()
  await radio(page, 'Siti').focus(); await page.keyboard.press('ArrowRight')
  await expect(radio(page, 'Interazioni')).toBeChecked(); await expect(radio(page, 'Interazioni')).toBeFocused()
  await page.clock.runFor(1100); await settled(page, 2)
  await page.keyboard.press('ArrowLeft'); await expect(radio(page, 'Siti')).toBeChecked()
  expect(await page.locator('[data-choice="1"]').evaluate(e => getComputedStyle(e).outlineStyle)).toBe('solid')
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Torna alle regolazioni' })).toBeFocused()
})

test('liquido: ponte reale, separazione, nessun bordo tagliato e confronto isolato', async ({ page }, info) => {
  await open(page)
  const start = await pixels(page)
  expect(start.components).toBe(3); expect(start.clipped).toBe(false)
  await page.screenshot({ path: `verification/${info.project.name}-liquido-partenza.png` })
  const boxes = await page.locator('[data-choice]').evaluateAll(es => es.map(e => e.getBoundingClientRect().toJSON()))
  await radio(page, 'Siti').click(); await page.clock.runFor(450)
  const bridge = await pixels(page)
  expect(bridge.components).toBe(2); expect(bridge.clipped).toBe(false)
  expect(await page.locator('[data-choice]').evaluateAll(es => es.map(e => e.getBoundingClientRect().toJSON()))).toEqual(boxes)
  expect(await page.locator('[data-choice]').evaluateAll(es => es.every(e => getComputedStyle(e).filter === 'none'))).toBe(true)
  await page.screenshot({ path: `verification/${info.project.name}-liquido-ponte.png` })
  const halfway = await shape(page)
  await controls(page); await radio(page, 'Senza fusione').check()
  expect(await shape(page)).toEqual(halfway)
  expect(await page.locator('[data-goo-layer]').getAttribute('filter')).toBeNull()
  expect((await pixels(page)).checksum).not.toBe(bridge.checksum)
  await radio(page, 'Con fusione').check()
  expect(await shape(page)).toEqual(halfway)
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.clock.runFor(330)
  const separated = await pixels(page)
  expect(separated.components).toBe(3); expect(separated.clipped).toBe(false)
  await page.screenshot({ path: `verification/${info.project.name}-liquido-separazione.png` })
  await page.clock.runFor(300); await settled(page, 1)
  const stopped = await shape(page); await page.clock.runFor(3000)
  expect(await shape(page)).toEqual(stopped)
  await page.screenshot({ path: `verification/${info.project.name}-liquido-finale.png` })
})

test('liquido: input durante la transizione, ritorno immediato e nessuna coda', async ({ page }) => {
  await open(page)
  for (const name of ['Interazioni', 'Identità', 'Siti', 'Interazioni', 'Siti', 'Identità']) {
    const before = await shape(page)
    await radio(page, name).click()
    expect(await shape(page)).toEqual(before)
    await expect(radio(page, name)).toBeChecked()
    await expect(page.locator('[data-active="true"] h3')).toHaveText(name)
    await page.clock.runFor(160)
  }
  await page.clock.runFor(1100); await settled(page, 0)
  await page.clock.runFor(4000); await settled(page, 0)
  await radio(page, 'Interazioni').click(); await page.clock.runFor(170)
  const current = await shape(page)
  await radio(page, 'Interazioni').click()
  expect(await shape(page)).toEqual(current)
  await page.clock.runFor(800); await settled(page, 2)
})

test('liquido: estremi combinati, descrizioni lunghe, font e resize durante il moto', async ({ page }, info) => {
  await open(page); await controls(page)
  for (let combination = 0; combination < 8; combination++) {
    for (const [i, id] of ['liquid-gap', 'liquid-softness', 'liquid-duration'].entries()) {
      await page.locator(`#${id}`).focus(); await page.keyboard.press(combination & (1 << i) ? 'End' : 'Home')
    }
    const name = combination % 2 ? 'Identità' : 'Interazioni'
    await radio(page, name).click(); await page.clock.runFor(1600)
    await settled(page, combination % 2 ? 0 : 2)
    const result = await pixels(page); expect(result.components).toBe(3); expect(result.clipped).toBe(false)
  }
  await controls(page); await page.getByText('Modifica le descrizioni').click()
  const copy = 'Un sistema chiaro mette in relazione contenuti, persone e azioni possibili. '.repeat(28)
  await page.getByRole('textbox', { name: 'Siti', exact: true }).fill(copy)
  const height = (await page.locator('#scena').boundingBox())!.height
  await radio(page, 'Siti').click(); await expect(page.locator('[data-active="true"] p')).toHaveText(copy.trim())
  expect((await page.locator('#scena').boundingBox())!.height).toBe(height)
  expect(await page.locator('[data-active="true"] p').evaluate(e => e.scrollHeight <= e.clientHeight + 1 && e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  await page.screenshot({ path: `verification/${info.project.name}-liquido-testo-lungo.png` })
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await radio(page, 'Identità').click(); await page.clock.runFor(100)
    await radio(page, 'Interazioni').click(); await page.clock.runFor(120)
    if (page.viewportSize()?.width === viewport.width && page.viewportSize()?.height === viewport.height) {
      await page.setViewportSize({ width: viewport.width + 1, height: viewport.height })
    }
    await page.setViewportSize(viewport)
    await expect(material(page)).toHaveAttribute('data-moving', 'false')
    await settled(page, 2)
  }
  // Font metrics change without a resize event; the measured targets must follow.
  await page.locator('[data-choice] span').evaluateAll(es => es.forEach(e => { (e as HTMLElement).style.fontSize = '42px' }))
  await page.clock.runFor(100); await settled(page, 2)
  await page.locator('[data-active="true"] p').evaluate(e => { (e as HTMLElement).style.fontSize = '36px' })
  expect(await page.locator('[data-active="true"] p').evaluate(e => e.scrollHeight <= e.clientHeight + 1 && e.scrollWidth <= e.clientWidth + 1)).toBe(true)
  expect((await pixels(page)).clipped).toBe(false)
  await controls(page); await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#liquid-gap')).toHaveValue('48')
  await expect(page.locator('#liquid-softness')).toHaveValue('12')
  await expect(page.locator('#liquid-duration')).toHaveValue('900')
  await expect(radio(page, 'Identità')).toBeChecked(); await settled(page, 0)
})

test('liquido: ridotto prioritario, fallback senza filtro e ordine accessibile', async ({ page }) => {
  await open(page); await controls(page)
  await radio(page, 'Interazioni').click(); await page.clock.runFor(250)
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await settled(page, 2)
  await radio(page, 'Siti').click(); await settled(page, 1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#scena')).toHaveAttribute('data-reduced', 'true')
  await radio(page, 'Interazioni').click(); await settled(page, 2)
  await page.clock.resume()
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
  const ids = await page.locator('filter').evaluateAll(es => es.map(e => e.id))
  expect(new Set(ids).size).toBe(ids.length); expect(ids).toHaveLength(1)
  expect(await material(page).getAttribute('aria-hidden')).toBe('true')
  await page.addInitScript(() => {
    const original = CSS.supports.bind(CSS)
    CSS.supports = ((property: string, value?: string) => property === 'filter' ? false : value === undefined ? original(property) : original(property, value)) as typeof CSS.supports
  })
  await page.reload()
  await expect(page.locator('#scena')).toHaveAttribute('data-supported', 'false')
  await expect(page.getByText('Filtro SVG non disponibile: forme nitide, selezione completa.')).toBeVisible()
  expect(await page.locator('[data-goo-layer]').getAttribute('filter')).toBeNull()
  for (const [i, name] of ['Identità', 'Siti', 'Interazioni'].entries()) {
    await radio(page, name).click(); await settled(page, i)
    await expect(page.locator('[data-active="true"] h3')).toHaveText(name)
  }
})

test('liquido: tap e scroll mobile, controlli separati anche durante il ponte', async ({ page }, info) => {
  await open(page)
  const first = page.locator('[data-choice="0"]'), third = page.locator('[data-choice="2"]')
  if (info.project.name === 'mobile') {
    await third.tap(); await page.clock.runFor(400); await first.tap()
  } else { await third.click(); await page.clock.runFor(400); await first.click() }
  await expect(radio(page, 'Identità')).toBeChecked()
  for (const label of [first, third]) {
    expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect(await label.evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) })).toBe(true)
  }
  expect(await material(page).evaluate(e => getComputedStyle(e).pointerEvents)).toBe('none')
  expect(await page.locator('#scena').evaluate(e => getComputedStyle(e).touchAction)).toBe('auto')
  await page.clock.runFor(1100); await settled(page, 0)
  await page.clock.resume()
  const before = await page.evaluate(() => scrollY)
  if (info.project.name === 'mobile') {
    const cdp = await page.context().newCDPSession(page), r = (await first.boundingBox())!
    const x = r.x + r.width / 2, y = r.y + r.height / 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 16 }] })
      await page.waitForTimeout(25)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else await page.mouse.wheel(0, 220)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 80)
  await expect(radio(page, 'Identità')).toBeChecked()
})
