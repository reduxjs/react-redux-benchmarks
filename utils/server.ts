/* eslint no-console: 0 */
'use strict'

import { performance } from 'perf_hooks'

import express from 'express'

import type { Browser } from 'playwright'
import { Server } from 'http'

export interface RenderResult {
  id: string
  phase: 'update' | 'mount'
  actualTime: number
  baseTime: number
  startTime: number
  commitTime: number
}

export interface DispatchStats {
  count: number
  totalTime: number
  avgTime: number
  maxTime: number
  p95Time: number
}

export interface CDPMetricsDelta {
  ScriptDuration: number
  TaskDuration: number
  LayoutDuration: number
  RecalcStyleDuration: number
  LayoutCount: number
  RecalcStyleCount: number
  JSHeapUsedSize: number
}

export interface PageStatsResult {
  cdpMetrics: CDPMetricsDelta
  dispatchStats: DispatchStats
  reactTimingEntries: RenderResult[]
  wallTime: number
}

declare global {
  interface Window {
    getDispatchStats: () => DispatchStats
    renderResults: RenderResult[]
  }
}

const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms))

export function runServer(port: number, sources: string): Promise<Server> {
  const app = express()

  app.use(express.static(sources))

  return new Promise((resolve, reject) => {
    // eslint-disable-line
    app.use((err) => {
      reject(err)
    })
    const server = app.listen(port, () => {
      resolve(server)
    })
  })
}

interface CDPMetricEntry {
  name: string
  value: number
}

function metricsToMap(
  metrics: CDPMetricEntry[]
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const m of metrics) {
    map[m.name] = m.value
  }
  return map
}

function computeMetricsDelta(
  before: Record<string, number>,
  after: Record<string, number>
): CDPMetricsDelta {
  return {
    ScriptDuration: after.ScriptDuration - before.ScriptDuration,
    TaskDuration: after.TaskDuration - before.TaskDuration,
    LayoutDuration: after.LayoutDuration - before.LayoutDuration,
    RecalcStyleDuration:
      after.RecalcStyleDuration - before.RecalcStyleDuration,
    LayoutCount: after.LayoutCount - before.LayoutCount,
    RecalcStyleCount: after.RecalcStyleCount - before.RecalcStyleCount,
    JSHeapUsedSize: after.JSHeapUsedSize - before.JSHeapUsedSize,
  }
}

export async function capturePageStats(
  browser: Browser,
  url: string,
  delay = 30000
): Promise<PageStatsResult> {
  const context = await browser.newContext({})
  const page = await context.newPage()

  // Set up CDP session for Performance metrics
  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')

  await page.goto(url)

  // Snapshot CDP metrics before the measurement window
  const beforeResult = await cdp.send('Performance.getMetrics')
  const before = metricsToMap(beforeResult.metrics as CDPMetricEntry[])

  const wallStart = performance.now()

  await timeout(delay)

  const wallEnd = performance.now()
  const wallTime = wallEnd - wallStart

  // Snapshot CDP metrics after the measurement window
  const afterResult = await cdp.send('Performance.getMetrics')
  const after = metricsToMap(afterResult.metrics as CDPMetricEntry[])

  const cdpMetrics = computeMetricsDelta(before, after)

  // Collect dispatch timing stats from the page
  const dispatchStats: DispatchStats = await page.evaluate(() => {
    return window.getDispatchStats()
  })

  // Collect React Profiler timing entries
  const reactTimingEntries: RenderResult[] = await page.evaluate(() => {
    return window.renderResults
  })

  await cdp.detach()
  await page.close()
  await context.close()

  return { cdpMetrics, dispatchStats, reactTimingEntries, wallTime }
}
