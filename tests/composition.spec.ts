import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.use({ video: { mode: 'on', size: { width: 1440, height: 900 } } })

async function controls(page: Page) {
  const panel = page.locator('#regolazioni')
  if (!await panel.evaluate(e => (e as HTMLDetailsElement).open)) await panel.locator('summary').first().click()
}
async function start(page: Page, route: string) {
  await page.goto(route)
  await controls(page)
  await page.getByRole('radio', { name: 'Composta', exact: true }).check()
}
async function jump(page: Page, y: number) {
  await page.evaluate(value => scrollTo(0, value), y)
  await page.waitForTimeout(100)
}
async function connected(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const points = [...document.querySelectorAll('[data-thread-point]')].map(e => {
      const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
    const boxes = [...document.querySelectorAll('[data-phase-copy]')].map(e => e.getBoundingClientRect())
    const paths = [...document.querySelectorAll<SVGPathElement>('[data-thread-segment]')]
    return paths.length === 2 && paths.every((path, index) => {
      const length = path.getTotalLength(), matrix = path.getScreenCTM()!
      const endsMatch = [0, length].every((at, end) => {
        const p = path.getPointAtLength(at).matrixTransform(matrix), target = points[index + end]
        return Math.hypot(p.x - target.x, p.y - target.y) < 1
      })
      const radius = Number(path.getAttribute('stroke-width')) / 2
      return endsMatch && Array.from({ length: 201 }, (_, i) => path.getPointAtLength(length * i / 200).matrixTransform(matrix)).every(p => boxes.every(b => p.x + radius < b.left || p.x - radius > b.right || p.y + radius < b.top || p.y - radius > b.bottom))
    }) && document.documentElement.scrollWidth <= innerWidth
  })).toBe(true)
}

test('card composta: traiettorie, lettura, sosta, ritorno, uscita e focus', async ({ page }, info) => {
  await start(page, '/card-impilate')
  const stack = page.locator('[data-composed="true"]')
  const cards = stack.locator('article')
  const animated = info.project.name !== 'desktop-basso'
  await expect(stack).toHaveAttribute('data-animated', String(animated))
  const entries = await cards.evaluateAll(es => es.map(e => ({ y: e.getBoundingClientRect().top + scrollY, top: parseFloat(getComputedStyle(e).top) || 48 })))
  const transforms = () => cards.locator(':scope > div').evaluateAll(es => es.map(e => getComputedStyle(e).transform))
  await jump(page, entries[0].y - entries[0].top)
  await page.screenshot({ path: `verification/${info.project.name}-composta-card-inizio.png` })
  // Each card gets an unobstructed reading interval, not just its heading.
  for (let i = 0; i < 4; i++) {
    await jump(page, entries[i].y - entries[i].top)
    if (animated) {
      expect(await cards.nth(i).locator('[data-card-content]').evaluate(element => {
        const r = element.getBoundingClientRect()
        return r.top >= 0 && r.bottom <= innerHeight && element.contains(document.elementFromPoint(r.x + r.width / 2, r.bottom - 12))
      })).toBe(true)
    }
  }
  const middleY = (entries[1].y + entries[2].y) / 2 - entries[1].top
  await jump(page, middleY - 240)
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 40); await page.waitForTimeout(70) }
  await jump(page, middleY)
  const middle = await transforms()
  await page.waitForTimeout(650)
  expect(await transforms()).toEqual(middle)
  await page.screenshot({ path: `verification/${info.project.name}-composta-card-meta.png` })
  await page.mouse.wheel(0, -400); await page.waitForTimeout(150)
  if (animated) expect(await transforms()).not.toEqual(middle)
  await jump(page, middleY)
  expect(await transforms()).toEqual(middle)
  await page.mouse.wheel(0, 4000); await page.waitForTimeout(800)
  await jump(page, entries[3].y - entries[3].top + 40)
  await page.screenshot({ path: `verification/${info.project.name}-composta-card-fine.png` })
  await cards.last().getByRole('link').focus()
  for (let i = 3; i >= 0; i--) {
    if (i < 3) await page.keyboard.press('Shift+Tab')
    const link = cards.nth(i).getByRole('link')
    await expect(link).toBeFocused()
    await expect(link).toBeInViewport({ ratio: 1 })
    expect(await link.evaluate(e => {
      const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
    })).toBe(true)
  }
  await page.screenshot({ path: `verification/${info.project.name}-composta-card-focus.png` })
  for (let i = 1; i < 4; i++) { await page.keyboard.press('Tab'); await expect(cards.nth(i).getByRole('link')).toBeFocused() }
  await page.keyboard.press('Enter')
  await expect(page.locator('#note')).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('card composta: regolazioni, contenuti condivisi, fallback, resize e movimento ridotto', async ({ page }, info) => {
  await start(page, '/card-impilate')
  for (const id of ['card-offset', 'card-rotation', 'step', 'top', 'space']) {
    await page.locator(`#${id}`).focus(); await page.keyboard.press('End')
  }
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.mouse.wheel(0, 650); await page.waitForTimeout(150)
  await page.screenshot({ path: `verification/${info.project.name}-composta-card-regolate.png` })
  await controls(page)
  await page.getByText('Modifica le quattro card').click()
  const text = 'Verifichiamo insieme misure, passaggi e attrezzi prima di costruire. '.repeat(32)
  await page.getByLabel('Descrizione 3', { exact: true }).fill(text)
  await expect(page.locator('[data-composed]')).toHaveAttribute('data-animated', 'false')
  await page.getByRole('radio', { name: 'Essenziale', exact: true }).check()
  await expect(page.getByLabel('Descrizione 3', { exact: true })).toHaveValue(text)
  await page.getByRole('radio', { name: 'Composta', exact: true }).check()
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await expect(page.locator('[data-composed]')).toHaveAttribute('data-animated', 'false')
    await page.locator('article').nth(2).getByRole('link').focus()
    await expect(page.locator('article').nth(2).getByRole('link')).toBeInViewport({ ratio: 1 })
  }
  await page.screenshot({ path: `verification/${info.project.name}-composta-card-lunga.png` })
  await controls(page)
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#card-offset')).toHaveValue('70')
  await expect(page.locator('#card-rotation')).toHaveValue('60')
  await expect(page.locator('[data-composed]')).toHaveAttribute('data-animated', 'true')
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await expect(page.locator('[data-composed]')).toHaveAttribute('data-animated', String(viewport.height !== 500))
  }
  await controls(page)
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  const noOverlap = () => page.locator('article').evaluateAll(es => es.every((e, i) => !i || es[i - 1].getBoundingClientRect().bottom <= e.getBoundingClientRect().top))
  expect(await noOverlap()).toBe(true)
  await page.getByRole('radio', { name: 'Animata', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await expect(page.locator('[data-composed]')).toHaveAttribute('data-animated', 'false')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('[data-composed]')).toHaveAttribute('data-animated', 'false')
  expect(await noOverlap()).toBe(true)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
})

test('filo composto: tre sezioni, geometria, scroll lento/veloce, sosta e ritorno', async ({ page }, info) => {
  await start(page, '/filo-che-si-disegna')
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'true')
  await connected(page)
  const positions = await page.locator('[data-thread-point]').evaluateAll(es => es.map(e => e.getBoundingClientRect().top + scrollY + 21 - innerHeight * .62))
  await jump(page, positions[0] - 20)
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '0')
  await page.screenshot({ path: `verification/${info.project.name}-composta-filo-inizio.png` })
  const progress = async () => Number(await page.locator('#scena').getAttribute('data-progress'))
  const readings: number[] = []
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, (positions[1] - positions[0]) / 8); await page.waitForTimeout(75); readings.push(await progress()) }
  expect(readings.every((n, i) => !i || n >= readings[i - 1])).toBe(true)
  await jump(page, positions[1] + 10)
  await expect(page.locator('[data-reached="true"]')).toHaveCount(2)
  const middle = await progress()
  await page.waitForTimeout(650)
  expect(await progress()).toBe(middle)
  await connected(page)
  await page.screenshot({ path: `verification/${info.project.name}-composta-filo-meta.png` })
  await page.mouse.wheel(0, -300); await page.waitForTimeout(150)
  expect(await progress()).toBeLessThan(middle)
  await connected(page)
  await jump(page, positions[1] + 10)
  expect(await progress()).toBe(middle)
  await page.mouse.wheel(0, 6000)
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  // Chromium may still be draining native wheel input at the page boundary.
  await page.waitForTimeout(800)
  await jump(page, positions[2] + 20)
  await expect(page.locator('[data-reached="true"]')).toHaveCount(3)
  await connected(page)
  await page.screenshot({ path: `verification/${info.project.name}-composta-filo-fine.png` })
  await jump(page, positions[0] - 30)
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '0')
})

test('filo composto: regolazioni, testi lunghi, resize, confronto e accessibilità', async ({ page }, info) => {
  await start(page, '/filo-che-si-disegna')
  for (const id of ['thread-distance', 'thread-thickness', 'thread-curvature']) {
    await page.locator(`#${id}`).focus(); await page.keyboard.press('End')
  }
  await connected(page)
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.mouse.wheel(0, 800); await page.waitForTimeout(100)
  await connected(page)
  await page.screenshot({ path: `verification/${info.project.name}-composta-filo-regolato.png` })
  await controls(page)
  await page.locator('#thread-distance').focus(); await page.keyboard.press('Home')
  await page.locator('#thread-curvature').focus(); await page.keyboard.press('Home')
  await connected(page)
  await page.getByText('Modifica le tre fasi').click()
  const text = 'Raccogliamo tutti gli ordini e verifichiamo con il gruppo ogni passaggio. '.repeat(24)
  await page.getByLabel('Descrizione 2', { exact: true }).fill(text)
  await page.getByLabel('Titolo 1', { exact: true }).fill('Capire insieme un problema che cambia ogni giorno.')
  await connected(page)
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'true')
  await page.getByRole('radio', { name: 'Essenziale', exact: true }).check()
  await expect(page.getByLabel('Descrizione 2', { exact: true })).toHaveValue(text)
  await page.getByRole('radio', { name: 'Composta', exact: true }).check()
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport); await connected(page)
    await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'true')
    await page.locator('figcaption').scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 200); await page.waitForTimeout(80)
    await connected(page)
  }
  await page.screenshot({ path: `verification/${info.project.name}-composta-filo-lungo.png` })
  await controls(page)
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#thread-distance')).toHaveValue('32')
  await connected(page)
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  await expect(page.locator('[data-thread-segment]').first()).toHaveAttribute('stroke-dashoffset', '0')
  await page.getByRole('radio', { name: 'Animata', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  await connected(page)
  const snapshot = await page.getByRole('list', { name: 'Fasi del progetto' }).ariaSnapshot()
  expect(snapshot.match(/Capire il problema/g)).toHaveLength(1)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
})
