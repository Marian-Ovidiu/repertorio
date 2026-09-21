/* global console, Buffer, document, innerWidth, scrollTo */
import { chromium } from 'playwright'
import { readFile, writeFile } from 'node:fs/promises'

const browser = await chromium.launch()
const measurements = []
for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844], ['desktop-basso', 1440, 500]]) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: name === 'mobile', hasTouch: name === 'mobile', recordVideo: { dir: 'verification/recordings', size: { width, height } } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:4173/composizione')
  await page.waitForTimeout(300)
  const measure = () => page.evaluate(() => ({ total: document.documentElement.scrollHeight,
    sections: [...document.querySelectorAll('main > section')].map(e => ({ id: e.id, height: e.offsetHeight, top: e.offsetTop })),
    cards: [...document.querySelectorAll('[data-project-content]')].map(e => e.offsetHeight),
    overflow: document.documentElement.scrollWidth > innerWidth,
    textAnimated: document.querySelector('#introduzione').dataset.animated,
    cardsAnimated: document.querySelector('[data-project-slot]').parentElement.dataset.animated,
  }))
  const animated = await measure()
  const screenshot = label => page.screenshot({ path: `verification/final-${name}-pagina-${label}.png` })
  await screenshot('inizio')
  const boundaries = animated.sections.slice(1).map(e => ({ ...e, captured: false }))
  for (let y = 0; y <= animated.total - height + 80; y += 75) {
    await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(250)
    for (const boundary of boundaries) if (!boundary.captured && y + height * .55 >= boundary.top) {
      boundary.captured = true; await screenshot(`passaggio-${boundary.id}`); await page.waitForTimeout(500)
    }
  }
  await screenshot('fine')
  // Reverse through the pile, pause, jump rapidly back and then use the services.
  for (let y = animated.total - height; y > animated.sections[1].top; y -= 310) {
    await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(100)
  }
  await page.waitForTimeout(400); await screenshot('ritorno')
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300)
  await page.getByRole('navigation', { name: 'Pagina dimostrativa' }).getByRole('link', { name: 'Servizi', exact: true }).click()
  await page.getByRole('radio', { name: 'Siti', exact: true }).check()
  await page.waitForTimeout(430); await screenshot('ponte')
  await page.getByRole('radio', { name: 'Interazioni', exact: true }).check()
  await page.waitForTimeout(110)
  await page.getByRole('radio', { name: 'Identità', exact: true }).check()
  await page.waitForTimeout(1100); await screenshot('servizi')
  await page.locator('#opzioni summary').click()
  await page.getByRole('radio', { name: 'Flusso normale', exact: true }).check()
  await page.locator('#opzioni summary').click()
  await page.waitForTimeout(120)
  const normal = await measure()
  measurements.push({ profile: name, width, height, animated, normal, extra: animated.total - normal.total, errors })
  const video = page.video(); await context.close()
  const videoPath = `verification/${name}-pagina-intera.webm`
  await video.saveAs(videoPath)

  // Full-page screenshots temporarily expand the viewport in Chromium.
  // Keep those captures out of the recorded context to avoid spurious video frames.
  const overview = await browser.newPage({ viewport: { width, height }, isMobile: name === 'mobile' })
  await overview.goto('http://127.0.0.1:4173/composizione'); await overview.waitForTimeout(200)
  await overview.screenshot({ path: `verification/final-${name}-pagina-intera.png`, fullPage: true })
  await overview.locator('#opzioni summary').click()
  await overview.getByRole('radio', { name: 'Flusso normale', exact: true }).check()
  await overview.locator('#opzioni summary').click()
  await overview.screenshot({ path: `verification/final-${name}-pagina-flusso.png`, fullPage: true })
  await overview.close()

  // Inspectable temporal contact sheet from the actual recorded sequence.
  const viewer = await browser.newPage()
  const data = (await readFile(videoPath)).toString('base64')
  const filmstrip = await viewer.evaluate(async base64 => {
    const v = document.createElement('video'); v.muted = true
    v.src = `data:video/webm;base64,${base64}`
    await new Promise(resolve => { v.onloadeddata = resolve })
    if (!Number.isFinite(v.duration)) {
      v.currentTime = 1e7
      await new Promise(resolve => { v.onseeked = resolve })
    }
    const duration = v.duration
    const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 990
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f3f1e9'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < 12; i++) {
      const time = .3 + (duration - .6) * i / 11
      v.currentTime = time; await new Promise(resolve => { v.onseeked = resolve })
      const scale = Math.min(356 / v.videoWidth, 300 / v.videoHeight)
      const x = (i % 4) * 360, y = Math.floor(i / 4) * 330
      ctx.drawImage(v, x, y, v.videoWidth * scale, v.videoHeight * scale)
      ctx.fillStyle = '#242a28'; ctx.font = '14px monospace'; ctx.fillText(`${time.toFixed(1)}s`, x + 8, y + 320)
    }
    return { png: canvas.toDataURL('image/png').split(',')[1], duration }
  }, data)
  await writeFile(`verification/${name}-pagina-filmstrip.png`, Buffer.from(filmstrip.png, 'base64'))
  console.log(name, { ...measurements.at(-1), videoSeconds: filmstrip.duration })
  await viewer.close()
}
await writeFile('verification/composition-page-measurements.json', JSON.stringify(measurements, null, 2))
await browser.close()
