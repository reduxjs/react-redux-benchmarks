/* eslint no-console: 0 */
'use strict'

const path = require('path')
const puppeteer = require('puppeteer')
const fs = require('fs')
const Table = require('cli-table2')
const _ = require('lodash')
const glob = require('glob')
const yargs = require('yargs/yargs')

const serverUtils = require('./utils/server.js')

const readFolderNames = (searchDir) => {
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
  .help('h')
  .alias('h', 'help')

// Given an array of items such as ["a", "b", "c", "d"], return the pairwise entries
// in the form [ ["a","b"], ["b","c"], ["c","d"] ]
function pairwise(list) {
  // Create a new list offset by 1
  var allButFirst = _.rest(list)
  // Pair up entries at each index
  var zipped = _.zip(list, allButFirst)
  // Remove last entry, as there's a mismatch from the offset
  var pairwiseEntries = _.initial(zipped)
  return pairwiseEntries
}

function printBenchmarkResults(benchmark, versionPerfEntries, trace) {
  console.log(`\nResults for benchmark ${benchmark}:`)

  let traceCategories = []

  if (trace) {
    traceCategories = ['Scripting', 'Rendering', 'Painting']
  }

  const table = new Table({
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

      let traceResults = []

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
        `${mountTime.toFixed(1)}, ${averageUpdateTime.toFixed(1)}`,
        ...traceResults,
        fpsNumbers.toString(),
      ])
    })

  console.log(table.toString())
}

function calculateBenchmarkStats(
  fpsRunResults,
  categories,
  traceRunResults,
  trace
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

    return { FPS: first.FPS, durationSeconds }
  })

  const sums = fpsValuesWithDurations.reduce(
    (prev, current) => {
      const weightedFPS = current.FPS * current.durationSeconds

      return {
        weightedFPS: prev.weightedFPS + weightedFPS,
        durationSeconds: prev.durationSeconds + current.durationSeconds,
      }
    },
    { FPS: 0, weightedFPS: 0, durationSeconds: 0 }
  )

  const weightedFPS = sums.weightedFPS / sums.durationSeconds

  const fps = { averageFPS, weightedFPS, values: fpsValuesWithoutFirst }

  const { reactTimingEntries } = fpsRunResults

  const [mountEntry, ...updateEntries] = reactTimingEntries

  const mountTime = mountEntry.actualTime

  const averageUpdateTime =
    updateEntries.reduce((sum, entry) => sum + entry.actualTime, 0) /
      updateEntries.length || 1

  return { fps, profile: { categories }, mountTime, averageUpdateTime }
}

async function runBenchmarks({ scenarios, versions, length, trace }) {
  console.log('Scenarios: ', scenarios)
  const distFolder = path.resolve('dist')
  const server = await serverUtils.runServer(9999, distFolder)

  for (let scenario of scenarios) {
    const versionPerfEntries = {}

    console.log(`Running scenario ${scenario}`)

    for (let version of versions) {
      console.log(`  React-Redux version: ${version}`)
      const browser = await puppeteer.launch({
        //headless: false
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
        const fpsRunResults = await serverUtils.capturePageStats(
          browser,
          URL,
          null,
          length * 1000
        )

        let traceRunResults, categories

        if (trace) {
          console.log(`    Running trace...    (${length} seconds)`)
          const traceFilename = path.join(
            __dirname,
            'runs',
            `trace-${scenario}-${version}.json`
          )
          traceRunResults = await serverUtils.capturePageStats(
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

runBenchmarks(args.argv)
