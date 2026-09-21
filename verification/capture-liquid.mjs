// Production preview: PLAYWRIGHT_BROWSERS_PATH=0 node verification/capture-liquid.mjs
/* global console */
import { chromium } from 'playwright'

const browser = await chromium.launch()
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['desktop-basso', 1440, 500]]) {
  const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: 'verification/recordings', size: { width, height } } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/liquido')
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  const screenshot = async label => page.screenshot({ path: `verification/final-${name}-liquido-${label}.png` })
  await page.waitForTimeout(450); await screenshot('partenza')
  await page.getByRole('radio', { name: 'Siti', exact: true }).click()
  await page.waitForTimeout(420); await screenshot('ponte')
  await page.waitForTimeout(330); await screenshot('separazione')
  await page.waitForTimeout(550); await screenshot('finale')
  await page.getByRole('radio', { name: 'Identità', exact: true }).click(); await page.waitForTimeout(1100)
  await page.getByRole('radio', { name: 'Interazioni', exact: true }).click(); await page.waitForTimeout(450); await screenshot('diretto')
  await page.getByRole('radio', { name: 'Identità', exact: true }).click(); await page.waitForTimeout(130)
  await page.getByRole('radio', { name: 'Siti', exact: true }).click(); await page.waitForTimeout(130)
  await page.getByRole('radio', { name: 'Interazioni', exact: true }).click(); await page.waitForTimeout(1150); await screenshot('interruzioni')
  const controls = page.locator('#regolazioni')
  if (!await controls.evaluate(e => e.open)) await controls.locator('summary').first().click()
  await page.getByRole('radio', { name: 'Senza fusione', exact: true }).check()
  await page.getByRole('link', { name: 'Entra nella prova' }).click()
  await page.getByRole('radio', { name: 'Siti', exact: true }).click(); await page.waitForTimeout(430); await screenshot('senza-fusione')
  await page.waitForTimeout(750)
  console.log(name, { scene: await page.locator('#scena').boundingBox(), filteredArea: await page.locator('[data-material]').boundingBox() })
  const video = page.video(); await context.close()
  await video.saveAs(`verification/${name}-liquido-sequenza.webm`)
}
await browser.close()
