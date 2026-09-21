import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function controls(page: Page) {
  const panel = page.locator('#regolazioni')
  if (!await panel.evaluate(element => (element as HTMLDetailsElement).open)) await panel.locator('summary').first().click()
}
async function enter(page: Page) {
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.waitForTimeout(100)
}
async function geometryIsConnected(page: Page) {
  await expect(page.locator('[data-thread-segment]')).toHaveCount(2)
  // Inspect real SVG geometry in screen coordinates, not the construction formula.
  await expect.poll(() => page.evaluate(() => {
    const points = [...document.querySelectorAll('[data-thread-point]')].map(element => {
      const r = element.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
    return [...document.querySelectorAll<SVGPathElement>('[data-thread-segment]')].every((path, index) => {
      const matrix = path.getScreenCTM()!
      return [0, path.getTotalLength()].every((length, end) => {
        const position = path.getPointAtLength(length).matrixTransform(matrix)
        return Math.hypot(position.x - points[index + end].x, position.y - points[index + end].y) < 1
      })
    })
  })).toBe(true)
  // Sample the curve, including its widest bends: no intersections with copy.
  expect(await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('[data-phase-copy]')].map(e => e.getBoundingClientRect())
    return [...document.querySelectorAll<SVGPathElement>('[data-thread-segment]')].every(path => {
      const matrix = path.getScreenCTM()!
      const halfStroke = Number(path.getAttribute('stroke-width')) / 2
      return Array.from({ length: 101 }, (_, i) => path.getPointAtLength(path.getTotalLength() * i / 100).matrixTransform(matrix))
        .every(p => boxes.every(b => p.x + halfStroke < b.left || p.x - halfStroke > b.right || p.y + halfStroke < b.top || p.y - halfStroke > b.bottom))
    })
  })).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('filo: ingresso dalla home, scroll reversibile, sosta e punti raggiunti', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('link', { name: /03. Il filo che si disegna/ }).click()
  await expect(page).toHaveURL(/filo-che-si-disegna/)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Il filo che si disegna.')
  const scene = page.locator('#scena')
  await expect(scene).toHaveAttribute('data-animated', info.project.name === 'desktop-basso' ? 'false' : 'true')
  await geometryIsConnected(page)
  await page.screenshot({ path: `verification/${info.project.name}-filo-inizio.png` })
  await enter(page)
  if (info.project.name !== 'desktop-basso') {
    const progress = async () => Number(await scene.getAttribute('data-progress'))
    const run = (await scene.boundingBox())!.height - page.viewportSize()!.height
    expect(await progress()).toBe(0)
    await expect(scene.locator('[data-reached="true"]')).toHaveCount(1)
    const values: number[] = []
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, run * .102)
      await page.waitForTimeout(80)
      values.push(await progress())
      await geometryIsConnected(page)
    }
    expect(values.every((v, i) => !i || v > values[i - 1])).toBe(true)
    await expect(scene.locator('[data-reached="true"]')).toHaveCount(2)
    const middle = await progress()
    const drawing = await scene.locator('[data-thread-segment]').evaluateAll(paths => paths.map(p => p.getAttribute('stroke-dashoffset')))
    await page.waitForTimeout(650)
    expect(await progress()).toBe(middle)
    expect(await scene.locator('[data-thread-segment]').evaluateAll(paths => paths.map(p => p.getAttribute('stroke-dashoffset')))).toEqual(drawing)
    await page.screenshot({ path: `verification/${info.project.name}-filo-meta.png` })
    await page.mouse.wheel(0, -run * .25)
    await page.waitForTimeout(100)
    expect(await progress()).toBeLessThan(middle)
    await expect(scene.locator('[data-reached="true"]')).toHaveCount(1)
    await geometryIsConnected(page)
    await page.screenshot({ path: `verification/${info.project.name}-filo-ritorno.png` })
    await page.mouse.wheel(0, run * 3)
    await expect(scene).toHaveAttribute('data-progress', '1')
    await expect(scene.locator('[data-reached="true"]')).toHaveCount(3)
    // Let the native wheel input finish before clicking an anchor in the other direction.
    // At the page boundary scrollY may be stable while wheel events are still draining.
    await page.waitForTimeout(800)
    await enter(page)
    await expect(scene).toHaveAttribute('data-progress', '0')
  } else {
    await expect(page.getByRole('status', { name: 'Stato della scena' })).toContainText('senza tagli')
    await expect(scene.locator('[data-reached="true"]')).toHaveCount(3)
    await page.screenshot({ path: `verification/${info.project.name}-filo-flusso.png` })
    await page.mouse.wheel(0, 320)
    await page.waitForTimeout(100)
    await geometryIsConnected(page)
    await page.mouse.wheel(0, -160)
    await page.waitForTimeout(100)
    await geometryIsConnected(page)
    await scene.locator('li').last().locator('p').scrollIntoViewIfNeeded()
    await expect(scene.locator('li').last().locator('p')).toBeInViewport({ ratio: 1 })
  }
  expect(errors).toEqual([])
})

test('filo: regolazioni da tastiera, testi lunghi, resize e agganci', async ({ page }, info) => {
  await page.goto('/filo-che-si-disegna')
  await controls(page)
  await page.locator('#thread-distance').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#thread-distance')).toHaveValue('130')
  await page.keyboard.press('Tab')
  await expect(page.locator('#thread-thickness')).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.locator('#thread-thickness')).toHaveValue('8')
  await page.keyboard.press('Tab')
  await expect(page.locator('#thread-curvature')).toBeFocused()
  await page.keyboard.press('End')
  await expect(page.locator('#thread-curvature')).toHaveValue('100')
  await geometryIsConnected(page)
  await enter(page)
  await page.mouse.wheel(0, 270)
  await page.waitForTimeout(100)
  await geometryIsConnected(page)
  await page.screenshot({ path: `verification/${info.project.name}-filo-regolato.png` })
  await controls(page)
  await page.locator('#thread-curvature').focus()
  await page.keyboard.press('Home')
  await expect(page.locator('#thread-curvature')).toHaveValue('0')
  await geometryIsConnected(page)
  await page.getByText('Modifica le tre fasi', { exact: false }).click()
  const longTitle = 'Progettare una soluzione che funzioni anche nei giorni di maggiore lavoro.'
  const longDescription = 'Raccogliamo gli ordini della settimana e controlliamo con il gruppo ogni passaggio, dalla richiesta alla consegna. '.repeat(16).trim()
  await page.getByLabel('Titolo 2', { exact: true }).fill(longTitle)
  await page.getByLabel('Descrizione 2', { exact: true }).fill(longDescription)
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  await geometryIsConnected(page)
  await page.getByRole('heading', { name: longTitle }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `verification/${info.project.name}-filo-lungo.png` })
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await geometryIsConnected(page)
    await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  }
  await page.locator('#scena li').last().locator('p').scrollIntoViewIfNeeded()
  await expect(page.locator('#scena li').last().locator('p')).toBeInViewport({ ratio: 1 })
  await controls(page)
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#thread-distance')).toHaveValue('120')
  await expect(page.locator('#thread-thickness')).toHaveValue('3')
  await expect(page.locator('#thread-curvature')).toHaveValue('60')
  await expect(page.getByLabel('Titolo 2', { exact: true })).toHaveValue('Progettare la soluzione.')
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'true')
  // Resize a pinned scene with default content too, including a breakpoint crossing.
  await enter(page)
  await page.mouse.wheel(0, 440)
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await geometryIsConnected(page)
    await expect(page.locator('#scena')).toHaveAttribute('data-animated', viewport.height === 500 ? 'false' : 'true')
  }
})

test('filo: confronto completo, movimento ridotto prioritario e ordine senza SVG', async ({ page }, info) => {
  await page.goto('/filo-che-si-disegna')
  await controls(page)
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  await geometryIsConnected(page)
  const list = page.getByRole('list', { name: 'Fasi del progetto' })
  await expect(list.getByRole('listitem')).toHaveCount(3)
  expect(await list.getByRole('heading').allTextContents()).toEqual(['Capire il problema.', 'Progettare la soluzione.', 'Costruire e verificare.'])
  await expect(page.locator('#scena svg')).toHaveAttribute('aria-hidden', 'true')
  const snapshot = await list.ariaSnapshot()
  expect(snapshot.match(/Capire il problema/g)).toHaveLength(1)
  await page.getByRole('radio', { name: 'Animata' }).check()
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await expect(page.locator('#scena')).toHaveAttribute('data-progress', '1')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  await expect(page.locator('[data-thread-point][data-reached="true"]')).toHaveCount(3)
  await geometryIsConnected(page)
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(axe.violations).toEqual([])
  await enter(page)
  await page.screenshot({ path: `verification/${info.project.name}-filo-ridotto.png` })
})
