// With the production preview running: PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-glass.mjs
/* global console */
import { chromium } from 'playwright'

const browser = await chromium.launch()
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['desktop-basso', 1440, 500]]) {
  const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: 'verification/recordings', size: { width, height } } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/vetro')
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  const stage = page.locator('[data-glass-stage]'), panel = page.locator('[data-glass-panel]')
  console.log(name, { scene: await stage.boundingBox(), panel: await panel.boundingBox() })
  for (const [button, label] of [['Al centro', 'centro'], ['Zona scura', 'scuro'], ['Zona chiara', 'chiaro'], ['Sul testo', 'testo']]) {
    await page.getByRole('button', { name: new RegExp(button) }).click()
    await stage.scrollIntoViewIfNeeded()
    await page.waitForTimeout(550)
    await page.screenshot({ path: `verification/final-${name}-vetro-${label}.png` })
  }
  await page.getByRole('button', { name: /Al centro/ }).click()
  const handle = page.getByRole('button', { name: 'Sposta il vetro', exact: true })
  await handle.scrollIntoViewIfNeeded()
  const h = await handle.boundingBox(), s = await stage.boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2)
  await page.mouse.down()
  for (let i = 0; i <= 45; i++) {
    await page.mouse.move(h.x + h.width / 2 + Math.sin(i / 45 * Math.PI * 2) * s.width * .26, h.y + h.height / 2 + Math.sin(i / 45 * Math.PI) * 65)
    await page.waitForTimeout(40)
  }
  await page.mouse.up()
  await page.waitForTimeout(650)
  await page.screenshot({ path: `verification/final-${name}-vetro-rilascio.png` })
  const controls = page.locator('#regolazioni')
  if (!await controls.evaluate(e => e.open)) await controls.locator('summary').first().click()
  await page.getByRole('radio', { name: 'Superficie opaca', exact: true }).check()
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await stage.scrollIntoViewIfNeeded()
  await page.waitForTimeout(650)
  await page.screenshot({ path: `verification/final-${name}-vetro-opaco.png` })
  const video = page.video()
  await context.close()
  await video.saveAs(`verification/${name}-vetro-sequenza.webm`)
}
await browser.close()
