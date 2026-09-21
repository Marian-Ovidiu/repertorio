import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.use({ video: { mode: 'on', size: { width: 1440, height: 900 } } })

async function controls(page: Page) {
  const panel = page.locator('#regolazioni')
  if (!await panel.evaluate(e => (e as HTMLDetailsElement).open)) await panel.locator('summary').first().click()
}
async function geometry(page: Page) {
  return page.locator('#scena').evaluate(e => ({ top: e.getBoundingClientRect().top + scrollY, height: e.getBoundingClientRect().height,
    run: Number((e as HTMLElement).dataset.run), travel: Number((e as HTMLElement).dataset.travel), animated: (e as HTMLElement).dataset.animated === 'true' }))
}
async function jump(page: Page, top: number) {
  await page.evaluate(y => scrollTo(0, y), top)
  await page.waitForTimeout(100)
}
async function validGeometry(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const scene = document.querySelector<HTMLElement>('#scena')!
    const rail = document.querySelector<HTMLElement>('[aria-label="Progetti dimostrativi"]')!
    const window = document.querySelector<HTMLElement>('[data-ribbon-window]')!
    const panels = [...document.querySelectorAll<HTMLElement>('[data-project]')]
    const s = getComputedStyle(rail)
    const expected = panels.reduce((n, e) => n + e.getBoundingClientRect().width, 0)
      + parseFloat(getComputedStyle(scene).getPropertyValue('--gap')) * 2 + parseFloat(s.paddingLeft) + parseFloat(s.paddingRight) - window.clientWidth
    const ratio = Number((document.querySelector('#ribbon-distance') as HTMLInputElement).value) / 100
    return Math.abs(Number(scene.dataset.travel) - expected) < 1 && Math.abs(Number(scene.dataset.run) - expected * ratio) < 1
      && (scene.dataset.animated !== 'true' || Math.abs(rail.getBoundingClientRect().width - window.clientWidth - expected) < 1)
      && document.documentElement.scrollWidth <= innerWidth
      && panels.every(p => p.scrollHeight <= p.clientHeight + 1 && p.scrollWidth <= p.clientWidth + 1)
  })).toBe(true)
}
async function entirePanel(page: Page, index: number) {
  await expect.poll(() => page.locator('[data-project]').nth(index).evaluate(e => {
    const r = e.getBoundingClientRect()
    return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight
  })).toBe(true)
}

test('nastro: accesso, ingresso, sosta, inversione, salto rapido e rilascio continuo', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('link', { name: /04. Nastro orizzontale/ }).click()
  await expect(page).toHaveURL(/nastro-orizzontale/)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nastro orizzontale.')
  const scene = page.locator('#scena')
  await expect(scene).toHaveAttribute('data-animated', String(info.project.name !== 'desktop-basso'))
  await validGeometry(page)
  const g = await geometry(page)
  await jump(page, g.top)
  await page.screenshot({ path: `verification/${info.project.name}-nastro-ingresso.png` })
  if (g.animated) {
    await entirePanel(page, 0)
    const titleTop = (await scene.getByRole('heading', { name: 'Idee che prendono spazio.' }).boundingBox())!.y
    const values: number[] = []
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, g.run / 12); await page.waitForTimeout(80); values.push(Number(await scene.getAttribute('data-progress'))) }
    expect(values.every((n, i) => !i || n > values[i - 1])).toBe(true)
    const matrix = await page.getByRole('list', { name: 'Progetti dimostrativi' }).evaluate(e => getComputedStyle(e).transform)
    await page.waitForTimeout(650)
    expect(await page.getByRole('list', { name: 'Progetti dimostrativi' }).evaluate(e => getComputedStyle(e).transform)).toBe(matrix)
    expect((await scene.getByRole('heading', { name: 'Idee che prendono spazio.' }).boundingBox())!.y).toBeCloseTo(titleTop, 0)
    await page.screenshot({ path: `verification/${info.project.name}-nastro-meta.png` })
    await page.mouse.wheel(0, -g.run / 4); await page.waitForTimeout(150)
    expect(Number(await scene.getAttribute('data-progress'))).toBeLessThan(values.at(-1)!)
    await page.screenshot({ path: `verification/${info.project.name}-nastro-ritorno.png` })
    await page.mouse.wheel(0, 6000)
    await expect(scene).toHaveAttribute('data-progress', '1')
    await page.waitForTimeout(800)
    await jump(page, g.top + g.run)
    await entirePanel(page, 2)
    await page.screenshot({ path: `verification/${info.project.name}-nastro-fine.png` })
    const stage = page.locator('[data-ribbon-stage]')
    const before = (await stage.boundingBox())!.y
    await jump(page, g.top + g.run + 100)
    expect(before - (await stage.boundingBox())!.y).toBeCloseTo(100, 0)
    await expect(scene).toHaveAttribute('data-progress', '1')
    await page.screenshot({ path: `verification/${info.project.name}-nastro-uscita.png` })
    await jump(page, g.top - 10)
    await expect(scene).toHaveAttribute('data-progress', '0')
  } else {
    await expect(page.getByRole('status', { name: 'Stato della scena' })).toContainText('senza tagli')
    await page.locator('[data-project]').nth(1).getByRole('heading').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `verification/${info.project.name}-nastro-meta.png` })
    await page.locator('[data-project]').last().getByRole('link').scrollIntoViewIfNeeded()
    await expect(page.locator('[data-project]').last().getByRole('link')).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: `verification/${info.project.name}-nastro-fine.png` })
    await page.locator('#dopo-nastro').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `verification/${info.project.name}-nastro-uscita.png` })
  }
  expect(errors).toEqual([])
})

test('nastro: cursori combinati, geometria reale, ultimo studio e reset', async ({ page }, info) => {
  await page.goto('/nastro-orizzontale')
  await controls(page)
  // All eight combinations of the three sliders' endpoints, not only one preset.
  for (let combination = 0; combination < 8; combination++) {
    for (const [i, id] of ['ribbon-distance', 'ribbon-width', 'ribbon-gap'].entries()) {
      await page.locator(`#${id}`).focus(); await page.keyboard.press(combination & (1 << i) ? 'End' : 'Home')
    }
    await validGeometry(page)
    let g = await geometry(page)
    await jump(page, g.top + (g.animated ? g.run / 2 : 100))
    await page.mouse.wheel(0, 60); await page.waitForTimeout(100)
    await validGeometry(page)
    g = await geometry(page)
    if (g.animated) { await jump(page, g.top + g.run); await entirePanel(page, 2) }
    else { await page.locator('[data-project]').last().getByRole('link').scrollIntoViewIfNeeded(); await expect(page.locator('[data-project]').last().getByRole('link')).toBeInViewport({ ratio: 1 }) }
    if ([0, 7].includes(combination)) await page.screenshot({ path: `verification/${info.project.name}-nastro-cursori-${combination}.png` })
  }
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#ribbon-distance')).toHaveValue('100')
  await expect(page.locator('#ribbon-width')).toHaveValue('84')
  await expect(page.locator('#ribbon-gap')).toHaveValue('48')
  await validGeometry(page)
})

test('nastro: testi lunghi, fallback completo, resize a metà e font', async ({ page }, info) => {
  await page.goto('/nastro-orizzontale')
  await controls(page)
  await page.getByText('Modifica i tre progetti').click()
  const text = 'La raccolta viene organizzata per rendere leggibile ogni dettaglio, anche quando il contenuto cambia. '.repeat(28)
  await page.getByLabel('Descrizione 2', { exact: true }).fill(text)
  await page.getByLabel('Titolo 3', { exact: true }).fill('La materia e i suoi dettagli, un quaderno da consultare prima di scegliere.')
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  await validGeometry(page)
  await page.locator('[data-project]').nth(1).getByRole('link').scrollIntoViewIfNeeded()
  await expect(page.locator('[data-project]').nth(1).getByRole('link')).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: `verification/${info.project.name}-nastro-lungo.png` })
  await controls(page)
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    const old = await geometry(page)
    if (old.animated) await jump(page, old.top + old.run / 2)
    await page.setViewportSize(viewport)
    await expect(page.locator('#scena')).toHaveAttribute('data-animated', String(viewport.height !== 500))
    await validGeometry(page)
    const g = await geometry(page)
    if (g.animated) { await jump(page, g.top + g.run); await entirePanel(page, 2) }
  }
  // Font metrics may change without a viewport event. ResizeObserver must update fit.
  await page.locator('[data-project]').nth(1).locator('p').evaluate(e => { (e as HTMLElement).style.fontSize = '80px' })
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  await validGeometry(page)
  await page.locator('[data-project]').nth(1).locator('p').evaluate(e => { (e as HTMLElement).style.removeProperty('font-size') })
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'true')
  await validGeometry(page)
})

test('nastro: Tab raggiunge ogni studio fuori campo e i link funzionano', async ({ page }, info) => {
  await page.goto('/nastro-orizzontale')
  const links = page.locator('[data-project]').getByRole('link')
  const g = await geometry(page)
  await jump(page, g.top)
  await links.first().focus()
  for (let i = 0; i < 3; i++) {
    if (i) await page.keyboard.press('Tab')
    await expect(links.nth(i)).toBeFocused()
    await expect(links.nth(i)).toBeInViewport({ ratio: 1 })
    expect(await links.nth(i).evaluate(e => {
      const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
    })).toBe(true)
    if (g.animated) await entirePanel(page, i)
  }
  await page.screenshot({ path: `verification/${info.project.name}-nastro-focus.png` })
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 500 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    await validGeometry(page)
    await expect(links.last()).toBeFocused()
    await expect(links.last()).toBeInViewport({ ratio: 1 })
  }
  for (let i = 1; i >= 0; i--) {
    await page.keyboard.press('Shift+Tab'); await expect(links.nth(i)).toBeFocused(); await expect(links.nth(i)).toBeInViewport({ ratio: 1 })
  }
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#studio-1$/)
  await expect(page.locator('#studio-1')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Torna alle regolazioni' })).toBeFocused()
  await validGeometry(page)
})

test('nastro: confronto, ridotto prioritario, ordine accessibile e nessuna duplicazione', async ({ page }, info) => {
  await page.goto('/nastro-orizzontale')
  await controls(page)
  const list = page.getByRole('list', { name: 'Progetti dimostrativi' })
  await expect(list.getByRole('listitem')).toHaveCount(3)
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  const staticHeight = (await page.locator('#scena').boundingBox())!.height
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  expect(await list.evaluate(e => getComputedStyle(e).transform)).toBe('none')
  expect(await list.locator('[data-project]').evaluateAll(es => es.every((e, i) => !i || e.getBoundingClientRect().top >= es[i - 1].getBoundingClientRect().bottom))).toBe(true)
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.screenshot({ path: `verification/${info.project.name}-nastro-statico.png` })
  await page.getByRole('radio', { name: 'Animata', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).uncheck()
  await page.getByRole('button', { name: 'Ripristina valori iniziali' }).click()
  await expect(page.locator('#scena')).toHaveAttribute('data-animated', 'false')
  expect((await page.locator('#scena').boundingBox())!.height).toBeCloseTo(staticHeight, 0)
  await validGeometry(page)
  const snapshot = await list.ariaSnapshot()
  expect(snapshot.match(/Un quartiere, a passo lento/g)).toHaveLength(1)
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.screenshot({ path: `verification/${info.project.name}-nastro-ridotto.png` })
})
