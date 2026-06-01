/* eslint no-console: 0 */
'use strict'

import path from 'path'
import playwright from 'playwright'
import fs from 'fs'
import Table from 'cli-table2'
import glob from 'glob'
import yargs from 'yargs/yargs'
import chalk from 'chalk'
import { SourceMapConsumer, type RawSourceMap } from 'source-map-js'

import {
  capturePageStats,
  runServer,
  PageStatsResult,
  RenderResult,
  V8CpuProfile,
} from './utils/server'

import type { InstrumentationStats } from './src/common/instrumentation'

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
  .option('json', {
    describe: 'Output results as JSON',
    type: 'boolean',
    default: false,
  })
  .option('profile', {
    alias: 'p',
    describe: 'Enable V8 CPU profiling with per-module attribution',
    type: 'boolean',
    default: false,
  })
  .option('save-profiles', {
    describe: 'Save .cpuprofile files to ./profiles/ directory',
    type: 'boolean',
    default: false,
  })
  .option('instrument', {
    alias: 'i',
    describe: 'Collect dispatch-cycle instrumentation (build with --instrument)',
    type: 'boolean',
    default: false,
  })
  .help('h')
  .alias('h', 'help')

// --- Percentile helper ---

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

// --- Module attribution ---

type ModuleCategory =
  | 'react-dom'
  | 'react'
  | 'react-redux'
  | 'redux/toolkit'
  | 'app'
  | 'other'

function classifySourcePath(originalSource: string): ModuleCategory {
  const s = originalSource.replace(/\\/g, '/')
  // Order matters: more specific matches first
  if (s.includes('/react-dom/')) return 'react-dom'
  if (s.includes('/react-redux/') || s.includes('/react-redux-'))
    return 'react-redux'
  if (
    s.includes('/@reduxjs/toolkit/') ||
    s.includes('/node_modules/redux/') ||
    s.includes('/node_modules/reselect/') ||
    s.includes('/node_modules/immer/')
  )
    return 'redux/toolkit'
  if (
    s.includes('/node_modules/react/') ||
    s.includes('/node_modules/scheduler/')
  )
    return 'react'
  if (
    s.includes('/scenarios/') ||
    s.includes('/common/') ||
    s.includes('/src/')
  )
    return 'app'
  return 'other'
}

// Classify non-bundle profile nodes (browser internals, GC, extensions, etc.)
type NonBundleCategory = 'idle' | 'gc' | 'browser'

function classifyNonBundleNode(
  functionName: string,
  url: string
): NonBundleCategory {
  if (
    functionName === '(idle)' ||
    functionName === '(root)' ||
    functionName === ''
  )
    return 'idle'
  if (functionName === '(garbage collector)' || functionName.includes('GC'))
    return 'gc'
  return 'browser'
}

export interface ModuleBreakdown {
  'react-dom': number
  react: number
  'react-redux': number
  'redux/toolkit': number
  app: number
  other: number
  idle: number
  gc: number
  browser: number
}

function extractInlineSourceMap(bundlePath: string): RawSourceMap | null {
  const content = fs.readFileSync(bundlePath, 'utf-8')
  const marker = '//# sourceMappingURL=data:application/json;charset=utf-8;base64,'
  const idx = content.lastIndexOf(marker)
  if (idx === -1) return null
  const base64 = content.slice(idx + marker.length).trim()
  const json = Buffer.from(base64, 'base64').toString('utf-8')
  return JSON.parse(json)
}

function computeModuleBreakdown(
  profile: V8CpuProfile,
  bundlePath: string
): ModuleBreakdown {
  const breakdown: ModuleBreakdown = {
    'react-dom': 0,
    react: 0,
    'react-redux': 0,
    'redux/toolkit': 0,
    app: 0,
    other: 0,
    idle: 0,
    gc: 0,
    browser: 0,
  }

  const rawMap = extractInlineSourceMap(bundlePath)
  if (!rawMap) {
    console.warn(chalk.yellow(`  No inline source map found in ${bundlePath}`))
    return breakdown
  }

  const consumer = new SourceMapConsumer(rawMap)

  // Build node map for lookup
  const nodeMap = new Map<number, V8ProfileNode>()
  for (const node of profile.nodes) {
    nodeMap.set(node.id, node)
  }

  // Compute self time per node from samples + timeDeltas
  const selfTime = new Map<number, number>()
  if (profile.samples && profile.timeDeltas) {
    for (let i = 0; i < profile.samples.length; i++) {
      const nodeId = profile.samples[i]
      const delta = profile.timeDeltas[i]
      selfTime.set(nodeId, (selfTime.get(nodeId) ?? 0) + delta)
    }
  } else {
    // Fallback: use hitCount (less precise)
    for (const node of profile.nodes) {
      if (node.hitCount) {
        selfTime.set(node.id, node.hitCount)
      }
    }
  }

  // Determine the bundle URL to match against callFrame.url
  // The bundle is served at e.g. http://localhost:9999/{version}/{scenario}/index.js
  const bundleFilename = 'index.js'

  for (const node of profile.nodes) {
    const time = selfTime.get(node.id) ?? 0
    if (time === 0) continue

    const { url, lineNumber, columnNumber } = node.callFrame

    // Non-bundle nodes: browser internals, idle, GC
    if (!url.endsWith(bundleFilename)) {
      const cat = classifyNonBundleNode(node.callFrame.functionName, url)
      breakdown[cat] += time
      continue
    }

    // V8 uses 0-based lines, source-map-js uses 1-based
    const pos = consumer.originalPositionFor({
      line: lineNumber + 1,
      column: columnNumber,
    })

    if (pos.source) {
      const category = classifySourcePath(pos.source)
      breakdown[category] += time
    } else {
      breakdown.other += time
    }
  }

  // Convert from μs to ms
  for (const key of Object.keys(breakdown) as ModuleCategory[]) {
    breakdown[key] = breakdown[key] / 1000
  }

  return breakdown
}

// --- Stats types ---

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
    p50UpdateTime: number | null
    p95UpdateTime: number | null
    totalRenderTime: number
    renderCount: number
  }
  dispatch: {
    count: number
    totalTime: number
    avgTime: number
  }
  wallTime: number
  moduleBreakdown?: ModuleBreakdown
  instrumentation?: InstrumentationStats
}

function calculateBenchmarkStats(
  results: PageStatsResult,
  bundlePath?: string
): BenchmarkStats {
  const { cdpMetrics, dispatchStats, reactTimingEntries, wallTime, cpuProfile } =
    results

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

  const totalRenderTime = reactTimingEntries.reduce(
    (sum, entry) => sum + entry.actualTime,
    0
  )

  const updateTimes = updateEntries
    .map((e) => e.actualTime)
    .sort((a, b) => a - b)

  const avgUpdateTime =
    updateTimes.length > 0
      ? updateTimes.reduce((sum, t) => sum + t, 0) / updateTimes.length
      : null

  const p50UpdateTime =
    updateTimes.length > 0 ? percentile(updateTimes, 50) : null

  const p95UpdateTime =
    updateTimes.length > 0 ? percentile(updateTimes, 95) : null

  const react = {
    mountTime,
    avgUpdateTime,
    p50UpdateTime,
    p95UpdateTime,
    totalRenderTime,
    renderCount: reactTimingEntries.length,
  }

  // Dispatch timing
  const dispatch = {
    count: dispatchStats.count,
    totalTime: dispatchStats.totalTime,
    avgTime: dispatchStats.avgTime,
  }

  // Module breakdown from V8 CPU profile
  let moduleBreakdown: ModuleBreakdown | undefined
  if (cpuProfile && bundlePath) {
    moduleBreakdown = computeModuleBreakdown(cpuProfile, bundlePath)
  }

  // Instrumentation stats (pass through)
  const instrumentation = results.instrumentationStats ?? undefined

  return { cdp, react, dispatch, wallTime, moduleBreakdown, instrumentation }
}

// --- Output ---

function printBenchmarkResults(
  benchmark: string,
  versionPerfEntries: Record<string, BenchmarkStats>,
  showProfile: boolean,
  showInstrumentation: boolean
) {
  console.log(`\n${chalk.bold.underline(benchmark)}`)
  console.log(chalk.dim('  All times in ms'))

  const versions = Object.keys(versionPerfEntries).sort()
  const colAligns = ['left', ...Array(10).fill('right')] as (
    | 'left'
    | 'right'
  )[]

  // CDP table
  const cdpTable: any = new Table({
    head: ['Version', 'Script', 'Task', 'Layout', 'Wall'],
    style: { head: ['red'] },
    colAligns,
  })
  for (const version of versions) {
    const s = versionPerfEntries[version]
    cdpTable.push([
      version,
      s.cdp.scriptDuration.toFixed(0),
      s.cdp.taskDuration.toFixed(0),
      s.cdp.layoutDuration.toFixed(0),
      s.wallTime.toFixed(0),
    ])
  }
  console.log(cdpTable.toString())

  // React table
  const reactTable: any = new Table({
    head: ['Version', 'Mount', 'Avg Upd', 'p95 Upd', 'Renders', 'Dispatches (avg)'],
    style: { head: ['red'] },
    colAligns,
  })
  for (const version of versions) {
    const s = versionPerfEntries[version]
    reactTable.push([
      version,
      s.react.mountTime?.toFixed(1) ?? 'N/A',
      s.react.avgUpdateTime?.toFixed(1) ?? 'N/A',
      s.react.p95UpdateTime?.toFixed(1) ?? 'N/A',
      s.react.renderCount,
      `${s.dispatch.count} (${s.dispatch.avgTime.toFixed(2)})`,
    ])
  }
  console.log(reactTable.toString())

  // Profile table (only when --profile)
  if (showProfile) {
    const profileTable: any = new Table({
      head: ['Version', 'react-dom', 'react', 'react-redux', 'redux/tk', 'app'],
      style: { head: ['red'] },
      colAligns,
    })
    for (const version of versions) {
      const mb = versionPerfEntries[version].moduleBreakdown
      if (mb) {
        profileTable.push([
          version,
          mb['react-dom'].toFixed(0),
          mb.react.toFixed(0),
          mb['react-redux'].toFixed(0),
          mb['redux/toolkit'].toFixed(0),
          mb.app.toFixed(0),
        ])
      } else {
        profileTable.push([version, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'])
      }
    }
    console.log(profileTable.toString())
  }

  // Instrumentation table (only when --instrument)
  if (showInstrumentation) {
    const hasAnyInst = versions.some(v => versionPerfEntries[v].instrumentation)
    if (hasAnyInst) {
      const instTable: any = new Table({
        head: ['Version', 'Reducer', 'Notify', 'Callbacks', 'Selector', 'Sel#', 'EqCheck', 'Eq#', 'Reconcile', 'Rec#', 'SigSel', 'Sig#'],
        style: { head: ['cyan'] },
        colAligns,
      })
      for (const version of versions) {
        const inst = versionPerfEntries[version].instrumentation
        if (inst) {
          instTable.push([
            version,
            inst.reducerTime.toFixed(1),
            inst.notifyTime.toFixed(1),
            inst.callbackCount,
            inst.selectorTime.toFixed(1),
            inst.selectorCount,
            inst.equalityCheckTime.toFixed(1),
            inst.equalityCheckCount,
            inst.reconcileTime.toFixed(1),
            inst.reconcileCount,
            inst.signalSelectorTime.toFixed(1),
            inst.signalSelectorCount,
          ])
        } else {
          instTable.push([version, ...Array(11).fill('N/A')])
        }
      }
      console.log(instTable.toString())
    }
  }
}

function saveCpuProfile(
  profile: V8CpuProfile,
  scenario: string,
  version: string
) {
  const dir = path.resolve('profiles')
  fs.mkdirSync(dir, { recursive: true })
  const filename = `${scenario}_${version}.cpuprofile`
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, JSON.stringify(profile))
  console.log(`    Saved profile: ${filepath}`)
}

// --- Main ---

async function runBenchmarks({
  scenarios,
  versions,
  length,
  headless,
  json: jsonOutput,
  profile: enableProfile,
  'save-profiles': saveProfiles,
  instrument: enableInstrumentation,
}: {
  scenarios: string[]
  versions: string[]
  length: number
  headless: boolean
  json: boolean
  profile: boolean
  'save-profiles': boolean
  instrument: boolean
}) {
  if (!jsonOutput) {
    console.log('Scenarios: ', scenarios)
  }

  const distFolder = path.resolve('dist')
  const server = await runServer(9999, distFolder)

  const allResults: Record<string, Record<string, BenchmarkStats>> = {}

  for (let scenario of scenarios) {
    const versionPerfEntries: Record<string, BenchmarkStats> = {}

    if (!jsonOutput) {
      console.log(`Running scenario ${scenario}`)
    }

    for (let version of versions) {
      if (!jsonOutput) {
        console.log(`  React-Redux version: ${version}`)
      }

      const browser = await playwright.chromium.launch({
        headless,
      })

      const folderPath = path.join(distFolder, version, scenario)

      if (!fs.existsSync(folderPath)) {
        if (!jsonOutput) {
          console.log(
            `Scenario ${scenario} does not exist for version ${version}, skipping`
          )
        }
        continue
      }

      const bundlePath = enableProfile
        ? path.join(folderPath, 'index.js')
        : undefined

      const URL = `http://localhost:9999/${version}/${scenario}`
      try {
        if (!jsonOutput) {
          console.log(`    Running benchmark... (${length} seconds)`)
        }
        const results = await capturePageStats(
          browser,
          URL,
          length * 1000,
          enableProfile,
          enableInstrumentation
        )

        if (saveProfiles && results.cpuProfile) {
          saveCpuProfile(results.cpuProfile, scenario, version)
        }

        versionPerfEntries[version] = calculateBenchmarkStats(
          results,
          bundlePath
        )
      } catch (e) {
        console.error(e)
        process.exit(-1)
      } finally {
        await browser.close()
      }
    }

    if (!jsonOutput) {
      printBenchmarkResults(scenario, versionPerfEntries, enableProfile, enableInstrumentation)
    }

    allResults[scenario] = versionPerfEntries
  }

  if (jsonOutput) {
    console.log(JSON.stringify(allResults, null, 2))
  }

  server.close()
  process.exit(0)
}

// @ts-ignore
runBenchmarks(args.argv)
