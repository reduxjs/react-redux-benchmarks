/* eslint no-console: 0 */
'use strict'

import path from 'path'
import playwright from 'playwright'
import fs from 'fs'
import Table from 'cli-table2'
import glob from 'glob'
import yargs from 'yargs/yargs'
import chalk from 'chalk'

import {
  capturePageStats,
  runServer,
  PageStatsResult,
  RenderResult,
} from './utils/server'

const readFolderNames = (searchDir: string) => {
  return glob.sync('*/', { cwd: searchDir }).map((s) => s.replace('/', ''))
}

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
  .option('length', {
    alias: 'l',
    describe: 'Number of seconds to run each benchmark',
    type: 'number',
    default: 30,
  })
  .option('headless', {
    describe: 'Run Chrome in headless mode (default: true)',
    type: 'boolean',
    default: true,
  })
  .help('h')
  .alias('h', 'help')

interface BenchmarkStats {
  cdp: {
    scriptDuration: number
    taskDuration: number
    layoutDuration: number
    styleDuration: number
  }
  react: {
    mountTime: number | null
    avgUpdateTime: number | null
    renderCount: number
  }
  dispatch: {
    count: number
    totalTime: number
    avgTime: number
  }
  wallTime: number
}

function calculateBenchmarkStats(
  results: PageStatsResult
): BenchmarkStats {
  const { cdpMetrics, dispatchStats, reactTimingEntries, wallTime } = results

  // CDP metrics (seconds from CDP, convert to ms for display)
  const cdp = {
    scriptDuration: cdpMetrics.ScriptDuration * 1000,
    taskDuration: cdpMetrics.TaskDuration * 1000,
    layoutDuration: cdpMetrics.LayoutDuration * 1000,
    styleDuration: cdpMetrics.RecalcStyleDuration * 1000,
  }

  // React Profiler
  const [mountEntry, ...updateEntries] = reactTimingEntries

  if (!mountEntry) {
    console.error(
      chalk.red(
        'Error during component mounting, run the benchmark with "--headless false" to inspect the console for React errors'
      )
    )
  }

  const mountTime = mountEntry?.actualTime ?? null

  const avgUpdateTime =
    updateEntries.length > 0
      ? updateEntries.reduce((sum, entry) => sum + entry.actualTime, 0) /
        updateEntries.length
      : null

  const react = {
    mountTime,
    avgUpdateTime,
    renderCount: reactTimingEntries.length,
  }

  // Dispatch timing
  const dispatch = {
    count: dispatchStats.count,
    totalTime: dispatchStats.totalTime,
    avgTime: dispatchStats.avgTime,
  }

  return { cdp, react, dispatch, wallTime }
}

function printBenchmarkResults(
  benchmark: string,
  versionPerfEntries: Record<string, BenchmarkStats>
) {
  console.log(`\nResults for benchmark ${benchmark}:`)

  const table: any = new Table({
    head: [
      'Version',
      'Script\n(ms)',
      'Task\n(ms)',
      'Layout\n(ms)',
      'Style\n(ms)',
      'Mount\n(ms)',
      'Avg Upd\n(ms)',
      'Renders',
      'Dispatches\n(avg ms)',
    ],
  })

  Object.keys(versionPerfEntries)
    .sort()
    .forEach((version) => {
      const stats = versionPerfEntries[version]

      table.push([
        version,
        stats.cdp.scriptDuration.toFixed(0),
        stats.cdp.taskDuration.toFixed(0),
        stats.cdp.layoutDuration.toFixed(0),
        stats.cdp.styleDuration.toFixed(0),
        stats.react.mountTime?.toFixed(1) ?? 'N/A',
        stats.react.avgUpdateTime?.toFixed(1) ?? 'N/A',
        stats.react.renderCount,
        `${stats.dispatch.count} (${stats.dispatch.avgTime.toFixed(2)})`,
      ])
    })

  console.log(table.toString())
}

async function runBenchmarks({
  scenarios,
  versions,
  length,
  headless,
}: {
  scenarios: string[]
  versions: string[]
  length: number
  headless: boolean
}) {
  console.log('Scenarios: ', scenarios)
  const distFolder = path.resolve('dist')
  const server = await runServer(9999, distFolder)

  for (let scenario of scenarios) {
    const versionPerfEntries: Record<string, BenchmarkStats> = {}

    console.log(`Running scenario ${scenario}`)

    for (let version of versions) {
      console.log(`  React-Redux version: ${version}`)
      const browser = await playwright.chromium.launch({
        headless,
      })

      const folderPath = path.join(distFolder, version, scenario)

      if (!fs.existsSync(folderPath)) {
        console.log(
          `Scenario ${scenario} does not exist for version ${version}, skipping`
        )
        continue
      }

      const URL = `http://localhost:9999/${version}/${scenario}`
      try {
        console.log(`    Running benchmark... (${length} seconds)`)
        const results = await capturePageStats(
          browser,
          URL,
          length * 1000
        )

        versionPerfEntries[version] = calculateBenchmarkStats(results)
      } catch (e) {
        console.error(e)
        process.exit(-1)
      } finally {
        await browser.close()
      }
    }
    printBenchmarkResults(scenario, versionPerfEntries)
  }

  server.close()
  process.exit(0)
}

// @ts-ignore
runBenchmarks(args.argv)
