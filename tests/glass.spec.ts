import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pane = (page: Page) => page.locator('[data-glass-panel]')
const handle = (page: Page) => page.getByRole('button', { name: 'Sposta il vetro', exact: true })
const coordinates = (page: Page) => pane(page).evaluate(e => ({ x: Number((e as HTMLElement).dataset.x), y: Number((e as HTMLElement).dataset.y) }))
async function controls(page: Page) {
  const panel = page.locator('#regolazioni')
  if (!await panel.evaluate(e => (e as HTMLDetailsElement).open)) await panel.locator('summary').first().click()
}
async function enter(page: Page) {
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await expect.poll(() => pane(page).getAttribute('data-x')).not.toBeNull()
}
async function valid(page: Page) {
  await expect.poll(() => pane(page).evaluate(e => {
    const r = e.getBoundingClientRect(), s = document.querySelector('[data-glass-stage]')!.getBoundingClientRect()
    return r.left >= s.left + 11 && r.right <= s.right - 11 && r.top >= s.top + 11 && r.bottom <= s.bottom - 11
      && document.documentElement.scrollWidth <= innerWidth
  })).toBe(true)
}
async function begin(page: Page) {
  await handle(page).scrollIntoViewIfNeeded()
  const r = (await handle(page).boundingBox())!
  const at = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  await page.mouse.move(at.x, at.y); await page.mouse.down()
  await expect(pane(page)).toHaveAttribute('data-dragging', 'true')
  return at
}

test('vetro: trascinamento preciso, lento/rapido, rilascio stabile e limiti', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('link', { name: /05. Vetro satinato/ }).click()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vetro satinato.')
  await enter(page); await valid(page)
  const original = (await pane(page).boundingBox())!
  const at = await begin(page)
  await page.mouse.move(at.x + 40, at.y + 24, { steps: 12 })
  const moved = (await pane(page).boundingBox())!
  expect(moved.x - original.x).toBeCloseTo(40, 0)
  expect(moved.y - original.y).toBeCloseTo(24, 0)
  await page.mouse.up()
  const stopped = await coordinates(page)
  await page.mouse.move(at.x - 20, at.y - 10); await page.waitForTimeout(650)
  expect(await coordinates(page)).toEqual(stopped)
  for (const target of [{ x: -1000, y: -1000 }, { x: 4000, y: 3000 }]) {
    await begin(page); await page.mouse.move(target.x, target.y); await page.mouse.up(); await valid(page)
  }
  expect(await coordinates(page)).toEqual({ x: 1, y: 1 })
  await page.screenshot({ path: `verification/${info.project.name}-vetro-limiti.png` })
  expect(errors).toEqual([])
})

test('vetro: cancellazione, capture persa, Esc, blur e resize ai bordi', async ({ page }) => {
  await page.goto('/vetro'); await enter(page)
  await handle(page).evaluate(e => e.addEventListener('pointerdown', event => { (e as HTMLElement).dataset.testPointer = String((event as PointerEvent).pointerId) }))
  for (const cause of ['cancel', 'capture', 'escape', 'blur', 'focus', 'resize']) {
    const before = await coordinates(page), at = await begin(page)
    await page.mouse.move(at.x + 30, at.y + 20)
    const moved = await coordinates(page)
    if (cause === 'escape') await page.keyboard.press('Escape')
    if (cause === 'cancel') await handle(page).dispatchEvent('pointercancel', { pointerId: Number(await handle(page).getAttribute('data-test-pointer')) })
    if (cause === 'capture') {
      await handle(page).evaluate(e => e.releasePointerCapture(Number((e as HTMLElement).dataset.testPointer)))
      // The browser processes pending capture loss before the next pointer input.
      await page.mouse.move(at.x + 30, at.y + 20)
    }
    if (cause === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    if (cause === 'focus') await page.keyboard.press('Tab')
    if (cause === 'resize') await page.setViewportSize({ width: 844, height: 390 })
    await expect(pane(page), cause).toHaveAttribute('data-dragging', 'false')
    await page.mouse.move(at.x - 30, at.y - 20); await page.mouse.up()
    expect(await coordinates(page)).toEqual(cause === 'escape' ? before : moved)
    await valid(page)
  }
  await page.getByRole('button', { name: 'Zona chiara', exact: true }).click()
  const beforeResize = await coordinates(page)
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport); await valid(page)
    expect(await coordinates(page)).toEqual(beforeResize)
  }
})

test('vetro: tastiera, posizioni significative e focus senza trappole', async ({ page }, info) => {
  await page.goto('/vetro'); await enter(page)
  for (const [name, image] of [['Zona scura', 'scuro'], ['Zona chiara', 'chiaro'], ['Sul testo', 'testo'], ['Al centro', 'centro']]) {
    await page.getByRole('button', { name: new RegExp(name) }).click()
    await valid(page)
    await page.locator('[data-glass-stage]').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `verification/${info.project.name}-vetro-${image}.png` })
  }
  await handle(page).focus()
  const box = (await pane(page).boundingBox())!
  const scroll = await page.evaluate(() => scrollY)
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Shift+ArrowUp')
  const moved = (await pane(page).boundingBox())!
  expect(moved.x - box.x).toBeCloseTo(-8, 0)
  expect(moved.y - box.y).toBeCloseTo(-32, 0)
  expect(await page.evaluate(() => scrollY)).toBe(scroll)
  await expect(handle(page)).toBeFocused()
  expect(await handle(page).evaluate(e => getComputedStyle(e).outlineStyle)).toBe('solid')
  await page.keyboard.press('Home'); expect(await coordinates(page)).toEqual({ x: .5, y: .5 })
  for (let i = 0; i < 45; i++) await page.keyboard.press('Shift+ArrowLeft')
  expect((await coordinates(page)).x).toBe(0); await valid(page)
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Torna alle regolazioni' })).toBeFocused()
  await page.keyboard.press('Shift+Tab'); await expect(handle(page)).toBeFocused()
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
  expect(await page.locator('#scena').ariaSnapshot()).not.toContain('La luce')
})

test('vetro: otto combinazioni, filtro reale, confronto geometrico e reset', async ({ page }, info) => {
  await page.goto('/vetro'); await controls(page)
  const surface = pane(page).locator('div').first()
  for (let combination = 0; combination < 8; combination++) {
    for (const [i, id] of ['glass-blur', 'glass-tint', 'glass-edge'].entries()) {
      await page.locator(`#${id}`).focus(); await page.keyboard.press(combination & (1 << i) ? 'End' : 'Home')
    }
    const computed = await surface.evaluate(e => { const s = getComputedStyle(e); return { filter: s.backdropFilter, color: s.backgroundColor, border: s.borderTopColor } })
    expect(computed.filter).toBe(`blur(${combination & 1 ? (info.project.name === 'mobile' ? 12 : 28) : 0}px) saturate(1.15)`)
    expect(computed.color).toBe(`rgba(231, 241, 217, ${combination & 2 ? '0.65' : '0.08'})`)
    expect(computed.border).toBe(combination & 4 ? 'rgba(255, 255, 247, 0.85)' : 'rgba(255, 255, 247, 0)')
    await valid(page)
  }
  await page.getByRole('button', { name: 'Sul testo', exact: true }).click()
  const position = await coordinates(page)
  const dimensions = await pane(page).evaluate(e => ({ w: e.clientWidth, h: e.clientHeight }))
  await page.getByRole('radio', { name: 'Superficie opaca', exact: true }).check()
  expect(await coordinates(page)).toEqual(position)
  expect(await pane(page).evaluate(e => ({ w: e.clientWidth, h: e.clientHeight }))).toEqual(dimensions)
  expect(await surface.evaluate(e => getComputedStyle(e).backdropFilter)).toBe('none')
  expect(await surface.evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(231, 239, 219)')
  await enter(page); await page.screenshot({ path: `verification/${info.project.name}-vetro-opaco.png` })
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  expect(await coordinates(page)).toEqual({ x: .5, y: .5 })
  await expect(page.locator('#glass-blur')).toHaveValue('16')
  await expect(page.locator('#glass-tint')).toHaveValue('22')
  await expect(page.locator('#glass-edge')).toHaveValue('60')
  await expect(page.getByRole('radio', { name: 'Vetro satinato', exact: true })).toBeChecked()
})

test('vetro: movimento ridotto prioritario e fallback dichiarato senza filtro', async ({ page }, info) => {
  await page.goto('/vetro'); await controls(page)
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await expect(page.locator('#scena')).toHaveAttribute('data-reduced', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#scena')).toHaveAttribute('data-reduced', 'true')
  await page.getByRole('button', { name: 'Zona chiara', exact: true }).click()
  await valid(page)
  expect(await pane(page).locator('div').first().evaluate(e => getComputedStyle(e).backdropFilter)).toContain('blur(')
  expect(await pane(page).evaluate(e => [e, ...e.querySelectorAll('*')].every(n => getComputedStyle(n).animationName === 'none' && getComputedStyle(n).transitionDuration === '0s'))).toBe(true)
  // Simulate capability absence before React mounts, including prefixed support.
  await page.addInitScript(() => {
    const original = CSS.supports.bind(CSS)
    CSS.supports = ((property: string, value?: string) => property.includes('backdrop-filter') ? false : value === undefined ? original(property) : original(property, value)) as typeof CSS.supports
  })
  await page.reload(); await enter(page)
  await expect(page.locator('#scena')).toHaveAttribute('data-supported', 'false')
  await expect(page.getByText('Backdrop-filter non disponibile: superficie piena alternativa.')).toBeVisible()
  const surface = pane(page).locator('div').first()
  expect(await surface.evaluate(e => getComputedStyle(e).backdropFilter)).toBe('none')
  expect(await surface.evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgb(231, 239, 219)')
  const at = await begin(page); await page.mouse.move(at.x + 20, at.y + 15); await page.mouse.up()
  await valid(page)
  await page.screenshot({ path: `verification/${info.project.name}-vetro-fallback.png` })
})

test('vetro: gesto touch locale e scroll libero sul corpo del pannello', async ({ page, context }, info) => {
  await page.goto('/vetro'); await enter(page)
  expect(await handle(page).evaluate(e => getComputedStyle(e).touchAction)).toBe('none')
  expect(await page.locator('[data-glass-stage]').evaluate(e => getComputedStyle(e).touchAction)).toBe('auto')
  expect(await page.locator('#scena').evaluate(e => getComputedStyle(e).touchAction)).toBe('auto')
  if (info.project.name === 'mobile') {
    const cdp = await context.newCDPSession(page)
    const h = (await handle(page).boundingBox())!, x = h.x + h.width / 2, y = h.y + h.height / 2
    const before = await coordinates(page), scroll = await page.evaluate(() => scrollY)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * 4, y: y + i * 5 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    expect((await coordinates(page)).x).toBeGreaterThan(before.x)
    expect(await page.evaluate(() => scrollY)).toBe(scroll)
    const h2 = (await handle(page).boundingBox())!, tx = h2.x + h2.width / 2, ty = h2.y + h2.height / 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tx, y: ty }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tx - 15, y: ty - 15 }] })
    const cancelled = await coordinates(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await expect(pane(page)).toHaveAttribute('data-dragging', 'false')
    expect(await coordinates(page)).toEqual(cancelled)
    const stopped = await coordinates(page), r = (await pane(page).boundingBox())!
    const sx = r.x + r.width / 2, sy = r.y + r.height - 35
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] })
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx, y: sy - i * 14 }] }); await page.waitForTimeout(25) }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll + 60)
    expect(await coordinates(page)).toEqual(stopped)
  } else {
    const stopped = await coordinates(page), r = (await pane(page).boundingBox())!
    await page.mouse.move(r.x + 30, r.y + r.height - 30); await page.mouse.down()
    await page.mouse.move(r.x + 90, r.y + r.height - 90); await page.mouse.up()
    expect(await coordinates(page)).toEqual(stopped)
    const scroll = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 220)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll + 100)
  }
  await valid(page)
})
