/* eslint no-console: 0 */
'use strict'

import path from 'path'
import playwright from 'playwright'
import fs from 'fs'
import Table from 'cli-table2'
import _ from 'lodash'
import glob from 'glob'
import yargs from 'yargs/yargs'
import chalk from 'chalk'
import { devices as replayDevices } from '@replayio/playwright'

import {
  capturePageStats,
  ProcessedFPSEntry,
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
  .option('trace', {
    alias: 't',
    describe: 'Include Chrome perf tracing results',
    type: 'boolean',
    default: false,
  })
  .option('headless', {
    describe: 'Run Chrome in headless mode (default: true)',
    type: 'boolean',
    default: true,
  })
  .option('record', {
    alias: 'r',
    describe: 'Make a Replay recording of each benchmark run',
    type: 'boolean',
    default: false,
  })
  .help('h')
  .alias('h', 'help')

// Given an array of items such as ["a", "b", "c", "d"], return the pairwise entries
// in the form [ ["a","b"], ["b","c"], ["c","d"] ]
function pairwise<T>(list: T[]): [T, T][] {
  // Create a new list offset by 1
  // @ts-ignore
  const allButFirst: T[] = _.rest(list)
  // Pair up entries at each index
  const zipped = _.zip(list, allButFirst)
  // Remove last entry, as there's a mismatch from the offset
  const pairwiseEntries = _.initial(zipped) as [T, T][]
  return pairwiseEntries
}

function printBenchmarkResults(benchmark, versionPerfEntries, trace) {
  console.log(`\nResults for benchmark ${benchmark}:`)

  let traceCategories: string[] = []

  if (trace) {
    traceCategories = ['Scripting', 'Rendering', 'Painting']
  }

  const table: any = new Table({
    head: [
      'Version',
      'Avg FPS',
      'Render\n(Mount, Avg)',
      ...traceCategories,
      'FPS Values',
    ],
  })

  Object.keys(versionPerfEntries)
    .sort()
    .forEach((version) => {
      const versionResults = versionPerfEntries[version]

      const { fps, profile, mountTime, averageUpdateTime } = versionResults

      let traceResults: number[] = []

      if (trace) {
        traceResults = [
          profile.categories.scripting.toFixed(2),
          profile.categories.rendering.toFixed(2),
          profile.categories.painting.toFixed(2),
        ]
      }

      const fpsNumbers = fps.values.map((entry) => entry.FPS)

      table.push([
        version,
        fps.weightedFPS.toFixed(2),
        `${mountTime?.toFixed(1)}, ${averageUpdateTime?.toFixed(1)}`,
        ...traceResults,
        fpsNumbers.toString(),
      ])
    })

  console.log(table.toString())
}

function calculateBenchmarkStats(
  fpsRunResults: {
    fpsValues: ProcessedFPSEntry[]
    start: number
    end: number
    reactTimingEntries: RenderResult[]
  },
  categories: string[],
  traceRunResults,
  trace: boolean
) {
  const { fpsValues, start, end } = fpsRunResults

  if (trace) {
    categories = traceRunResults.traceMetrics.profiling.categories
  }

  // skip first value = it's usually way lower due to page startup
  const fpsValuesWithoutFirst = fpsValues.slice(1)
  const lastEntry = _.last(fpsValues)

  const averageFPS =
    fpsValuesWithoutFirst.reduce((sum, entry) => sum + entry.FPS, 0) /
      fpsValuesWithoutFirst.length || 1

  const pairwiseEntries = pairwise(fpsValuesWithoutFirst)

  const fpsValuesWithDurations = pairwiseEntries.map((pair) => {
    const [first, second] = pair
    const duration = second.timestamp - first.timestamp
    const durationSeconds = duration / 1000.0

    return { FPS: first.FPS, durationSeconds, weightedFPS: 0 }
  })

  const sums = fpsValuesWithDurations.reduce(
    (prev, current) => {
      const weightedFPS = current.FPS * current.durationSeconds

      return {
        FPS: current.FPS,
        weightedFPS: prev.weightedFPS + weightedFPS,
        durationSeconds: prev.durationSeconds + current.durationSeconds,
      }
    },
    { FPS: 0, weightedFPS: 0, durationSeconds: 0 } as {
      FPS: number
      weightedFPS: number
      durationSeconds: number
    }
  )

  const weightedFPS = sums.weightedFPS / sums.durationSeconds

  const fps = { averageFPS, weightedFPS, values: fpsValuesWithoutFirst }

  const { reactTimingEntries } = fpsRunResults

  const [mountEntry, ...updateEntries] = reactTimingEntries

  if (!mountEntry) {
    console.error(
      chalk.red(
        'Error during component mounting, run the benchmark with "--headless false" to inspect the console for React errors'
      )
    )
  }

  const mountTime = mountEntry?.actualTime

  const averageUpdateTime =
    updateEntries?.reduce((sum, entry) => sum + entry.actualTime, 0) /
      updateEntries?.length || 1

  return { fps, profile: { categories }, mountTime, averageUpdateTime }
}

async function runBenchmarks({
  scenarios,
  versions,
  length,
  trace,
  headless,
  record,
}: {
  scenarios: string[]
  versions: string[]
  length: number
  trace: boolean
  headless: boolean
  record: boolean
}) {
  console.log('Scenarios: ', scenarios)
  const distFolder = path.resolve('dist')
  const server = await runServer(9999, distFolder)

  const launchOptions: Partial<playwright.LaunchOptions> = record
    ? replayDevices['Replay Chromium'].launchOptions
    : {}

  for (let scenario of scenarios) {
    const versionPerfEntries = {}

    console.log(`Running scenario ${scenario}`)

    for (let version of versions) {
      console.log(`  React-Redux version: ${version}`)

      const browser = await playwright.chromium.launch({
        headless,
        ...launchOptions,
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
        console.log(`    Checking max FPS... (${length} seconds)`)
        const fpsRunResults = await capturePageStats(
          browser,
          URL,
          null,
          length * 1000
        )

        let traceRunResults: PageStatsResult | undefined
        let categories: string[] = []

        if (trace) {
          console.log(`    Running trace...    (${length} seconds)`)
          const traceFilename = path.join(
            __dirname,
            'runs',
            `trace-${scenario}-${version}.json`
          )
          traceRunResults = await capturePageStats(
            browser,
            URL,
            traceFilename,
            length * 1000
          )
        }

        versionPerfEntries[version] = calculateBenchmarkStats(
          fpsRunResults,
          categories,
          traceRunResults,
          trace
        )
      } catch (e) {
        console.error(e)
        process.exit(-1)
      } finally {
        await browser.close()
      }
    }
    printBenchmarkResults(scenario, versionPerfEntries, trace)
  }

  server.close()
  process.exit(0)
}

// @ts-ignore
runBenchmarks(args.argv)
