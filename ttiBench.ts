/* eslint no-console: 0 */
'use strict'

/**
 * Time-to-interactive bench — companion to runBenchmarks.ts.
 *
 * runBenchmarks reports the React Profiler mount time (render-phase
 * actualDuration only). That misses work deferred into commit/passive
 * effects, so it can look great while the user-visible mount is unchanged.
 * This measures what the user actually waits for, around the mount:
 *
 *   FCP          first contentful paint (ms from nav start)
 *   MountRender  React Profiler mount actualTime (render phase only)
 *   LongestTask  worst single main-thread block (ms) — the input killer
 *   TTIquiet     end of the last long task in the mount window — when the
 *                main thread first goes quiet (≈ interactive)
 *   TBT          total blocking time = sum(max(0, dur-50)) over long tasks
 *
 * A longtask + paint observer is injected before page scripts run.
 * Steady-state dispatches are <50ms so they never register as long tasks —
 * the only long tasks in the window are mount-related, which isolates it.
 *
 * Usage (build the scenario first, same as the other benches):
 *   yarn build price-ticker
 *   yarn tti -s price-ticker -v signals-base signals-mount
 *   yarn tti -s price-ticker            # all built versions, defaults
 */

import path from 'path'
import fs from 'fs'
import playwright from 'playwright'
import glob from 'glob'
import Table from 'cli-table2'
import yargs from 'yargs/yargs'

import { runServer } from './utils/server'

const readFolderNames = (searchDir: string) =>
  glob.sync('*/', { cwd: searchDir }).map((s) => s.replace('/', ''))

const allScenarios = readFolderNames(path.resolve('src/scenarios'))
const allBuiltVersions = readFolderNames(path.resolve('dist'))

const args = yargs(process.argv.slice(2))
  .option('scenarios', {
    alias: 's',
    describe: 'List of benchmark scenarios to run',
    type: 'array',
    choices: allScenarios,
    default: allScenarios,
  })
  .option('versions', {
    alias: 'v',
    describe: 'List of React-Redux versions to compare',
    type: 'array',
    choices: allBuiltVersions,
    default: allBuiltVersions,
  })
  .option('runs', {
    alias: 'r',
    describe: 'Number of page loads to take the median over',
    type: 'number',
    default: 5,
  })
  .option('settle', {
    describe: 'Milliseconds to wait after load for the mount to settle',
    type: 'number',
    default: 3500,
  })
  .option('headless', {
    describe: 'Run Chrome in headless mode (default: true)',
    type: 'boolean',
    default: true,
  })
  .help('h')
  .alias('h', 'help')

const PORT = 9998

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : 0
}
const f = (x: number) => x.toFixed(1)

interface TTISample {
  fcp: number
  mountRender: number
  longest: number
  ttiQuiet: number
  tbt: number
}

async function measure(
  browser: playwright.Browser,
  url: string,
  settleMs: number,
): Promise<TTISample> {
  const context = await browser.newContext({})
  const page = await context.newPage()
  await page.addInitScript(() => {
    ;(window as any).__lt = []
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          (window as any).__lt.push({ start: e.startTime, dur: e.duration })
      }).observe({ type: 'longtask', buffered: true } as any)
    } catch {}
  })
  await page.goto(url)
  await page.waitForTimeout(settleMs)

  const data = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint')
    const fcp = paints.find((p) => p.name === 'first-contentful-paint')
    const mount = (window as any).renderResults?.[0]
    return {
      fcp: fcp ? fcp.startTime : null,
      lt: (window as any).__lt as { start: number; dur: number }[],
      mountRender: mount ? mount.actualTime : null,
    }
  })

  await context.close()

  const lt = data.lt.filter((t) => t.start < settleMs)
  const longest = lt.length ? Math.max(...lt.map((t) => t.dur)) : 0
  const ttiQuiet = lt.length
    ? Math.max(...lt.map((t) => t.start + t.dur))
    : (data.fcp ?? 0)
  const tbt = lt.reduce((s, t) => s + Math.max(0, t.dur - 50), 0)
  return {
    fcp: data.fcp ?? 0,
    mountRender: data.mountRender ?? 0,
    longest,
    ttiQuiet,
    tbt,
  }
}

async function main() {
  const argv = await args.argv
  const scenarios = argv.scenarios as string[]
  const versions = argv.versions as string[]
  const runs = argv.runs as number
  const settle = argv.settle as number

  const dist = path.resolve('dist')
  const server = await runServer(PORT, dist)
  const browser = await playwright.chromium.launch({ headless: argv.headless })

  try {
    for (const scenario of scenarios) {
      const table = new Table({
        head: ['Version', 'FCP', 'MountRender', 'LongestTask', 'TTIquiet', 'TBT'],
      })

      for (const version of versions) {
        if (!fs.existsSync(path.join(dist, version, scenario))) continue

        const samples: TTISample[] = []
        for (let i = 0; i < runs; i++) {
          samples.push(
            await measure(
              browser,
              `http://localhost:${PORT}/${version}/${scenario}`,
              settle,
            ),
          )
        }

        table.push([
          version,
          f(median(samples.map((s) => s.fcp))),
          f(median(samples.map((s) => s.mountRender))),
          f(median(samples.map((s) => s.longest))),
          f(median(samples.map((s) => s.ttiQuiet))),
          f(median(samples.map((s) => s.tbt))),
        ])
      }

      console.log(`\n${scenario} — time-to-interactive (median of ${runs}), all ms`)
      console.log(table.toString())
    }
  } finally {
    await browser.close()
    server.close()
  }
}

main()
