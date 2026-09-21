// Re-run on a built, running preview: PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-compositions.mjs
/* global scrollY, getComputedStyle, console */
import { chromium } from 'playwright'

const browser = await chromium.launch()
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['desktop-basso', 1440, 500]]) {
  for (const route of ['card-impilate', 'filo-che-si-disegna']) {
    const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: 'verification/recordings', size: { width, height } } })
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:4173/${route}`)
    if (width === 390) await page.locator('#regolazioni > summary').click()
    for (const variant of ['Essenziale', 'Composta']) {
      await page.getByRole('radio', { name: variant, exact: true }).check()
      await page.getByRole('link', { name: 'Entra nella prova' }).click()
      await page.waitForTimeout(120)
      const scene = page.locator('#scena')
      const start = await scene.evaluate(e => e.getBoundingClientRect().top + scrollY)
      const sceneHeight = (await scene.boundingBox()).height
      let end = start + sceneHeight - height
      if (route === 'card-impilate' && await page.locator('[data-animated]').getAttribute('data-animated') === 'true') {
        end = await page.locator('article').last().evaluate(e => e.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(e).top) + 40)
      }
      const step = (end - start) / 36
      for (let i = 0; i <= 36; i++) {
        if (i) await page.mouse.wheel(0, step)
        await page.waitForTimeout(65)
        if ([0, 18, 36].includes(i)) {
          await page.waitForTimeout(250)
          await page.screenshot({ path: `verification/final-${name}-${route}-${variant}-${i}.png` })
        }
      }
      await page.waitForTimeout(500)
      for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, -step); await page.waitForTimeout(65) }
      await page.waitForTimeout(300)
      await page.screenshot({ path: `verification/final-${name}-${route}-${variant}-ritorno.png` })
      await page.getByRole('radio', { name: 'Flusso normale' }).check()
      await page.getByRole('link', { name: 'Entra nella prova' }).click()
      await page.waitForTimeout(120)
      const staticHeight = (await scene.boundingBox()).height
      console.log(name, route, variant, { sceneHeight, staticHeight, extra: sceneHeight - staticHeight })
      await page.screenshot({ path: `verification/final-${name}-${route}-${variant}-statica.png` })
      await page.getByRole('radio', { name: 'Animata', exact: true }).check()
    }
    await page.getByRole('checkbox', { name: 'Simula movimento ridotto' }).check()
    await page.getByRole('link', { name: 'Entra nella prova' }).click()
    await page.screenshot({ path: `verification/final-${name}-${route}-ridotto.png` })
    const video = page.video()
    await context.close()
    await video.saveAs(`verification/${name}-${route}-sequenza.webm`)
  }
}
await browser.close()
