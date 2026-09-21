// On a running preview: PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-ribbon.mjs
/* global scrollY, scrollTo, console */
import { chromium } from 'playwright'

const browser = await chromium.launch()
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['desktop-basso', 1440, 500]]) {
  const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: 'verification/recordings', size: { width, height } } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/nastro-orizzontale')
  const scene = page.locator('#scena')
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.waitForTimeout(150)
  const g = await scene.evaluate(e => ({ top: e.getBoundingClientRect().top + scrollY, height: e.getBoundingClientRect().height,
    run: Number(e.dataset.run), travel: Number(e.dataset.travel), required: Number(e.dataset.required), animated: e.dataset.animated === 'true' }))
  const span = g.animated ? g.run : g.height - height
  await page.evaluate(y => scrollTo(0, y), g.top - 180)
  await page.waitForTimeout(150)
  await page.screenshot({ path: `verification/final-${name}-nastro-contesto.png` })
  await page.mouse.wheel(0, 180)
  await page.waitForTimeout(300)
  for (let i = 0; i <= 40; i++) {
    if (i) await page.mouse.wheel(0, span / 40)
    await page.waitForTimeout(75)
    if ([0, 20, 40].includes(i)) {
      await page.waitForTimeout(500)
      await page.screenshot({ path: `verification/final-${name}-nastro-${i}.png` })
    }
  }
  await page.mouse.wheel(0, 220)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `verification/final-${name}-nastro-uscita.png` })
  await page.mouse.wheel(0, -220)
  await page.waitForTimeout(250)
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, -span / 40); await page.waitForTimeout(75) }
  await page.waitForTimeout(400)
  await page.screenshot({ path: `verification/final-${name}-nastro-ritorno.png` })
  await page.mouse.wheel(0, 6000)
  await page.waitForTimeout(900)
  const panel = page.locator('#regolazioni')
  if (!await panel.evaluate(e => e.open)) await panel.locator('summary').first().click()
  await page.getByRole('radio', { name: 'Flusso normale' }).check()
  await page.waitForTimeout(150)
  const staticHeight = (await scene.boundingBox()).height
  console.log(name, { ...g, staticHeight, extra: g.height - staticHeight })
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.screenshot({ path: `verification/final-${name}-nastro-statico.png` })
  const video = page.video()
  await context.close()
  await video.saveAs(`verification/${name}-nastro-sequenza.webm`)
}
await browser.close()
