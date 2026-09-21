import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function openControls(page: Page) {
  const controls = page.locator('#regolazioni')
  if (!(await controls.evaluate(element => (element as HTMLDetailsElement).open))) {
    await controls.locator('summary').first().click()
  }
}

async function sceneTop(page: Page) {
  await page.locator('a[href="#scena"]').click()
  await page.waitForTimeout(100)
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

test('indice e accesso diretto a entrambe le prove', async ({ page }, info) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Prima di usarlo')
  await noHorizontalOverflow(page)
  await page.screenshot({ path: `verification/${info.project.name}-indice.png`, fullPage: true })
  await page.getByRole('link', { name: /01. Accensione del testo/ }).click()
  await expect(page).toHaveURL(/accensione-del-testo/)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accensione del testo.')
  await page.getByRole('link', { name: '02 — Card' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Card impilate.')
})

test('testo: scroll lento, fermata, inverso, salto rapido e regolazioni', async ({ page }, info) => {
  await page.goto('/accensione-del-testo')
  const scene = page.locator('#scena')
  await expect(scene).toHaveAttribute('data-animated', info.project.name === 'desktop-basso' ? 'false' : 'true')
  await page.screenshot({ path: `verification/${info.project.name}-testo-inizio.png`, fullPage: false })
  await sceneTop(page)
  if (await scene.getAttribute('data-animated') === 'true') {
    const read = async () => Number(await scene.getAttribute('data-active-words'))
    expect(await read()).toBe(0)
    const totalRun = (await scene.boundingBox())!.height - page.viewportSize()!.height
    const samples: number[] = []
    for (let step = 0; step < 6; step++) {
      await page.mouse.wheel(0, totalRun / 12)
      await page.waitForTimeout(80)
      samples.push(await read())
    }
    expect(samples.every((sample, index) => !index || sample >= samples[index - 1])).toBe(true)
    const middle = await read()
    expect(middle).toBeGreaterThan(0)
    await page.waitForTimeout(700)
    expect(await read()).toBe(middle)
    await page.screenshot({ path: `verification/${info.project.name}-testo-meta.png` })
    await page.mouse.wheel(0, -totalRun / 4)
    await page.waitForTimeout(120)
    expect(await read()).toBeLessThan(middle)
    await page.screenshot({ path: `verification/${info.project.name}-testo-ritorno.png` })
    await page.mouse.wheel(0, totalRun * 2)
    await page.waitForTimeout(150)
    const wordCount = await scene.locator('[data-accesa]').count()
    expect(await read()).toBe(wordCount)
    await sceneTop(page)
    expect(await read()).toBe(0)
  } else {
    await expect(page.getByRole('status', { name: 'Stato della scena' })).toContainText('senza tagli')
    const lastWord = scene.locator('[data-accesa]').last()
    await lastWord.scrollIntoViewIfNeeded()
    await expect(lastWord).toBeInViewport()
    await page.screenshot({ path: `verification/${info.project.name}-testo-flusso.png` })
  }
  await openControls(page)
  await page.locator('#distance').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#distance')).toHaveValue('130')
  await page.locator('#size').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('#size')).toHaveValue('46')
  await page.locator('#intensity').focus()
  await page.keyboard.press('End')
  await expect(page.locator('#intensity')).toHaveValue('100')
  await sceneTop(page)
  await page.mouse.wheel(0, 250)
  await page.waitForTimeout(120)
  await page.screenshot({ path: `verification/${info.project.name}-testo-regolato.png` })
  await openControls(page)
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  await expect(scene).toHaveAttribute('data-animated', 'false')
  await expect(scene.locator('[data-accesa="false"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#size')).toHaveValue('48')
  await expect(page.locator('#distance')).toHaveValue('120')
  await noHorizontalOverflow(page)
})

test('testo: frasi lunghe, copia e frase continua accessibile', async ({ page }, info) => {
  await page.goto('/accensione-del-testo')
  await openControls(page)
  await page.getByText('Modifica le tre frasi').click()
  const longText = 'Il laboratorio rimane aperto mentre misuriamo il legno e prepariamo il banco. '.repeat(18).trim()
  await page.getByLabel('Frase 3', { exact: true }).fill(longText)
  const scene = page.locator('#scena')
  await expect(scene).toHaveAttribute('data-animated', 'false')
  await expect(page.getByRole('status', { name: 'Stato della scena' })).toContainText('senza tagli')
  const snapshot = await scene.ariaSnapshot()
  expect(snapshot).toContain(longText)
  // Visual text preserves spaces for copying; its word spans are hidden from AT.
  const visibleText = await scene.locator('p').last().locator('span[aria-hidden="true"]').innerText()
  expect(visibleText).toBe(longText)
  const last = scene.locator('[data-accesa]').last()
  await last.scrollIntoViewIfNeeded()
  await expect(last).toBeInViewport()
  await page.screenshot({ path: `verification/${info.project.name}-testo-lungo-fine.png` })
  await noHorizontalOverflow(page)
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.getByLabel('Frase 3', { exact: true })).not.toHaveValue(longText)
})

test('card: scroll, pila, ritorno, regolazioni e focus non coperto', async ({ page }, info) => {
  await page.goto('/card-impilate')
  const stack = page.locator('[data-animated]')
  const cards = stack.locator('article')
  await expect(cards).toHaveCount(4)
  await page.waitForTimeout(100)
  const animated = await stack.getAttribute('data-animated') === 'true'
  expect(animated).toBe(info.project.name !== 'desktop-basso')
  const finalStackScroll = await cards.last().evaluate(element => element.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(element).top))
  await page.screenshot({ path: `verification/${info.project.name}-card-inizio.png` })
  await sceneTop(page)
  const firstTop = (await cards.first().boundingBox())!.y
  for (let step = 0; step < 8; step++) {
    await page.mouse.wheel(0, 80)
    await page.waitForTimeout(60)
  }
  const midPositions = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top))
  await page.waitForTimeout(500)
  expect(await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top))).toEqual(midPositions)
  await page.screenshot({ path: `verification/${info.project.name}-card-meta.png` })
  await page.mouse.wheel(0, -420)
  await page.waitForTimeout(120)
  await page.screenshot({ path: `verification/${info.project.name}-card-ritorno.png` })
  if (animated) expect((await cards.first().boundingBox())!.y).toBeLessThanOrEqual(firstTop)
  // Cross the remaining entries quickly; the end spacer keeps a complete stack visible.
  const jump = animated ? finalStackScroll + page.viewportSize()!.height * .15 - await page.evaluate(() => window.scrollY) : 1900
  await page.mouse.wheel(0, jump)
  await page.waitForTimeout(150)
  await page.screenshot({ path: `verification/${info.project.name}-card-pila.png` })
  if (animated) {
    const positions = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top))
    expect(positions[1]).toBeGreaterThan(positions[0])
    expect(positions[2]).toBeGreaterThan(positions[1])
    const bottoms = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().bottom))
    expect(Math.max(...bottoms.slice(0, 3))).toBeLessThanOrEqual(bottoms[3] + 1)
  }
  // Starting at the last link, navigate backwards through links in covered cards.
  const lastLink = cards.last().getByRole('link')
  await lastLink.focus()
  for (let index = 3; index >= 0; index--) {
    if (index < 3) await page.keyboard.press('Shift+Tab')
    const link = cards.nth(index).getByRole('link')
    await expect(link).toBeFocused()
    await expect(link).toBeInViewport({ ratio: 1 })
    const uncovered = await link.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
    })
    expect(uncovered).toBe(true)
  }
  await page.screenshot({ path: `verification/${info.project.name}-card-focus.png` })
  for (let index = 1; index < 4; index++) {
    await page.keyboard.press('Tab')
    await expect(cards.nth(index).getByRole('link')).toBeFocused()
    await expect(cards.nth(index).getByRole('link')).toBeInViewport({ ratio: 1 })
  }
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#note$/)
  await expect(page.locator('#note')).toBeFocused()
  await openControls(page)
  await page.locator('#step').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#step')).toHaveValue('36')
  await page.locator('#top').focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('#top')).toHaveValue('40')
  await page.locator('#space').focus()
  await page.keyboard.press('End')
  await expect(page.locator('#space')).toHaveValue('70')
  await sceneTop(page)
  await page.mouse.wheel(0, 1000)
  await page.waitForTimeout(150)
  await page.screenshot({ path: `verification/${info.project.name}-card-regolate.png` })
  await openControls(page)
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  await expect(stack).toHaveAttribute('data-animated', 'false')
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#step')).toHaveValue('32')
  await expect(page.locator('#top')).toHaveValue('48')
  await expect(page.locator('#space')).toHaveValue('35')
  await noHorizontalOverflow(page)
})

test('card più alta della finestra: leggibile fino al link', async ({ page }, info) => {
  await page.goto('/card-impilate')
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 390 : 1440, height: 360 })
  const stack = page.locator('[data-animated]')
  const longCard = stack.locator('article').nth(2)
  await expect(stack).toHaveAttribute('data-animated', 'false')
  expect((await longCard.boundingBox())!.height).toBeGreaterThan(360)
  await expect(page.getByRole('status', { name: 'Stato della scena' })).toContainText('leggibile fino in fondo')
  await longCard.getByRole('heading').scrollIntoViewIfNeeded()
  await expect(longCard.getByRole('heading')).toBeInViewport()
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(50) }
  await longCard.getByRole('link').scrollIntoViewIfNeeded()
  await expect(longCard.getByRole('link')).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: `verification/${info.project.name}-card-alta-fine.png` })
  await longCard.getByRole('link').click()
  await expect(page).toHaveURL(/#note$/)
  await noHorizontalOverflow(page)
})

test('movimento ridotto: simulazione, sistema prioritario e accessibilità automatica', async ({ page }, info) => {
  for (const path of ['/accensione-del-testo', '/card-impilate']) {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(path)
    await openControls(page)
    await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
    await expect(page.locator('[data-animated]')).toHaveAttribute('data-animated', 'false')
    await expect(page.getByRole('status', { name: 'Stato della scena' })).toContainText('Movimento ridotto')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
    await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
    await expect(page.locator('[data-animated]')).toHaveAttribute('data-animated', 'false')
    await expect(page.getByText('Movimento ridotto attivo nel sistema', { exact: false })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(results.violations).toEqual([])
    await sceneTop(page)
    await page.screenshot({ path: `verification/${info.project.name}-${path.slice(1)}-ridotto.png` })
  }
})
