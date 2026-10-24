// Lighthouse audit: optimized build served by `vite preview` with the default mock scenario.
// Each page × profile runs RUNS times in a fresh Chrome profile; the median of each category is
// reported, with LCP, CLS and TBT. Usage: `npm run lighthouse` (add `-- --no-build` to reuse dist/).
import { spawn, execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { CATEGORIES, PAGES, PROFILES, RUNS, TARGETS } from './config.mjs'

const PORT = 4175
const BASE = `http://localhost:${PORT}`
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const OUT = path.resolve('lighthouse/reports', stamp)

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`preview server did not start on ${BASE}`)
}

if (!process.argv.includes('--no-build')) execSync('npm run build', { stdio: 'inherit' })
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' })

try {
  await waitForServer()
  await mkdir(OUT, { recursive: true })
  const results = []
  let chromeVersion = ''

  for (const page of PAGES) {
    for (const [profile, config] of Object.entries(PROFILES)) {
      const runs = []
      for (let run = 1; run <= RUNS; run += 1) {
        // A fresh profile each run: no cache, no service worker from a previous run.
        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run'] })
        try {
          const result = await lighthouse(`${BASE}${page.path}`, { port: chrome.port, output: ['html', 'json'], logLevel: 'error' }, config)
          if (!result) throw new Error('no Lighthouse result')
          const { lhr, report } = result
          chromeVersion = lhr.environment.hostUserAgent
          const base = path.join(OUT, `${page.id}-${profile}-${run}`)
          await writeFile(`${base}.report.html`, report[0])
          await writeFile(`${base}.report.json`, report[1])
          runs.push({
            scores: Object.fromEntries(CATEGORIES.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)])),
            lcp: lhr.audits['largest-contentful-paint'].numericValue,
            cls: lhr.audits['cumulative-layout-shift'].numericValue,
            tbt: lhr.audits['total-blocking-time'].numericValue,
          })
          console.log(`${page.id} ${profile} #${run}`, runs.at(-1).scores)
        } finally {
          await chrome.kill()
        }
      }
      results.push({
        page: page.id,
        path: page.path,
        profile,
        median: Object.fromEntries(CATEGORIES.map((id) => [id, median(runs.map((item) => item.scores[id]))])),
        lcpMs: Math.round(median(runs.map((item) => item.lcp))),
        cls: Number(median(runs.map((item) => item.cls)).toFixed(3)),
        tbtMs: Math.round(median(runs.map((item) => item.tbt))),
        runs,
      })
    }
  }

  const environment = {
    date: new Date().toISOString(),
    lighthouse: (await import('lighthouse/package.json', { with: { type: 'json' } })).default.version,
    chrome: chromeVersion,
    node: process.version,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()[0]?.model,
    conditions: 'vite preview (production build), default mock scenario, headless Chrome, fresh profile per run',
  }
  await writeFile(path.join(OUT, 'summary.json'), JSON.stringify({ environment, targets: TARGETS, results }, null, 2))

  const header = '| Page | Profile | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |\n|---|---|---|---|---|---|---|---|---|'
  const rows = results.map(
    (item) =>
      `| ${item.page} | ${item.profile} | ${item.median.performance} | ${item.median.accessibility} | ${item.median['best-practices']} | ${item.median.seo} | ${(item.lcpMs / 1000).toFixed(2)} s | ${item.cls} | ${item.tbtMs} ms |`,
  )
  const markdown = `# Lighthouse — ${environment.date}\n\nMedian of ${RUNS} runs per page and profile.\n\n${header}\n${rows.join('\n')}\n\n` +
    `Targets: ${Object.entries(TARGETS).map(([id, value]) => `${id} ≥ ${value}`).join(', ')}.\n\n` +
    `Lighthouse ${environment.lighthouse} · ${environment.chrome} · Node ${environment.node} · ${environment.os} · ${environment.cpu}\n\n${environment.conditions}.\n`
  await writeFile(path.join(OUT, 'summary.md'), markdown)
  console.log(`\n${markdown}\nReports: ${OUT}`)
} finally {
  server.kill()
  if (process.platform === 'win32') {
    try {
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /PID %a /F`, { stdio: 'ignore', shell: 'cmd.exe' })
    } catch {
      // already gone
    }
  }
}
