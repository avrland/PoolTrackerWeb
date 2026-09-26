import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.UI_BASE ?? 'http://retirement007-public-after'
const output = '/validation/results'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const results = []
try {
  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme })
      const page = await context.newPage()
      await page.clock.install()
      const errors = []
      const apiRequests = []
      let state = 'normal'
      const current = {
        lastdate: '25.09.2026 10:00', session_id: 'synthetic-session',
        lastsport: 12, lastfamily: 4, lastsmall: 1, lastice: 0,
        sport_percent: 12, family_percent: 3, small_percent: 3, ice_percent: 0,
        date: ['2026-09-25 10:00'], sport: [12], family: [4], small: [1], ice: [0],
      }
      page.on('pageerror', error => errors.push(error.message))
      await page.route('**/*', async route => {
        const url = new URL(route.request().url())
        if (url.origin !== new URL(base).origin) return route.abort()
        assert.ok(!url.pathname.startsWith('/chatbot'), 'No retired requests')
        let data
        if (url.pathname === '/api/current/') {
          if (state === 'error') return route.fulfill({ status: 503, body: '{}' })
          data = state === 'empty' ? { lastdate: null } : state === 'zero'
            ? { ...current, lastsport: 0, lastfamily: 0, lastsmall: 0 } : current
        } else if (url.pathname === '/api/available-dates/') data = { dates: ['2026-09-25'] }
        else if (url.pathname === '/api/weather/') data = { temp: 20, description: 'Pogodnie', icon: '01d' }
        else if (url.pathname.startsWith('/update_chart/')) data = {
          date_stat: ['10:00'], sport_stat: [12], family_stat: [4], small_stat: [1], ice_stat: [0],
        }
        else if (url.pathname === '/get_date_data/') {
          assert.equal(route.request().headers()['x-session-key'], 'synthetic-session')
          data = current
        }
        if (data) {
          apiRequests.push(url.pathname + url.search)
          return route.fulfill({ json: data })
        }
        return route.continue()
      })
      await page.goto(base)
      await page.getByRole('heading', { name: 'Stan zajętości obiektów BOSiR' }).waitFor()
      await page.getByText('20°C', { exact: true }).waitFor()
      await page.getByRole('heading', { name: 'Pytania i odpowiedzi' }).waitFor()
      await page.waitForFunction(() => document.querySelectorAll('.apexcharts-svg').length >= 2)
      for (const [name, value] of [['Pływalnia Sportowa', '12'], ['Pływalnia Rodzinna', '4'], ['Pływalnia Kameralna', '1']]) {
        await page.getByRole('link', { name, exact: true }).getByText(value, { exact: true }).waitFor()
      }
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme)
      const initialRequests = [...apiRequests]
      const toggle = page.getByRole('button', { name: /Przełącz na tryb/ })
      await toggle.focus()
      await page.keyboard.press('Enter')
      const switched = theme === 'light' ? 'dark' : 'light'
      await page.waitForFunction(value => document.documentElement.dataset.theme === value, switched)
      await page.reload()
      await page.getByText('20°C', { exact: true }).waitFor()
      assert.equal(await page.locator('html').getAttribute('data-theme'), switched)
      await Promise.all([
        page.waitForResponse(response => response.url().includes('/get_date_data/')),
        page.getByLabel('Wybierz datę').fill('2026-09-25'),
      ])
      await page.getByRole('button', { name: 'Poniedziałek', exact: true }).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.querySelector('[aria-label="Poniedziałek"]').getAttribute('aria-pressed') === 'true')
      await page.screenshot({ path: `${output}/${width}-${theme}-dashboard.png`, fullPage: true })
      const pool = page.getByRole('link', { name: /Pływalnia Sportowa/ }).first()
      await pool.focus()
      await page.keyboard.press('Enter')
      await page.getByRole('heading', { name: 'Pływalnia Sportowa', exact: true }).waitFor()
      await page.screenshot({ path: `${output}/${width}-${theme}-details.png`, fullPage: true })
      await page.getByRole('button', { name: width < 768 ? 'Zamknij' : 'Wstecz', exact: true }).first().click()
      await page.getByRole('heading', { name: 'Stan zajętości obiektów BOSiR' }).waitFor()
      state = 'error'
      await page.clock.fastForward(5 * 60 * 1000 + 100)
      await page.getByText('Dane nieaktualne', { exact: true }).first().waitFor({ timeout: 15000 })
      await page.getByRole('link', { name: 'Pływalnia Sportowa', exact: true }).getByText('12', { exact: true }).waitFor()
      for (const variant of ['zero', 'empty', 'error']) {
        state = variant
        await page.reload()
        if (variant === 'zero') {
          await page.getByRole('link', { name: 'Pływalnia Sportowa', exact: true }).getByText('0', { exact: true }).waitFor()
          assert.equal(await page.getByText('Brak danych z bieżącego dnia.').count(), 0)
        } else if (variant === 'empty') await page.getByText('Brak danych z bieżącego dnia.').waitFor()
        else await page.getByRole('button', { name: 'Spróbuj ponownie' }).waitFor({ timeout: 15000 })
      }
      assert.deepEqual(errors, [])
      results.push({ width, theme, initialRequests, apiRequests: apiRequests.length, result: 'PASS' })
      await context.close()
    }
  }
  await writeFile(`${output}/ui.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}
