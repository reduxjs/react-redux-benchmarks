/* eslint no-console: 0 */
'use strict'

import { performance } from 'perf_hooks'

import express from 'express'
import tracealyzer from 'tracealyzer'

import type { Browser } from 'puppeteer'
import { Server } from 'http'

type TracealyticsResults = ReturnType<typeof tracealyzer>

export interface FPSStatsEntry {
  type: string
  timeStamp: number
  meta: {
    details: {
      FPS: number
      isFinal: boolean
    }
  }
}

export interface ProcessedFPSEntry {
  FPS: number
  timestamp: number
  isFinal: boolean
}

export interface RenderResult {
  id: string
  phase: 'update' | 'mount'
  actualTime: number
  baseTime: number
  startTime: number
  commitTime: number
}

export type PageStatsResult = Awaited<ReturnType<typeof capturePageStats>>

declare global {
  interface Window {
    getFpsStats: () => FPSStatsEntry[]
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
      //console.log(`Server started on ${port}`);
      resolve(server)
    })
  })
}

export async function capturePageStats(
  browser: Browser,
  url: string,
  traceFilename: string | null,
  delay = 30000
) {
  const page = await browser.newPage()
  await page.evaluate(() => {
    window.performance.setResourceTimingBufferSize(1000000)
  })

  let fpsValues: ProcessedFPSEntry[]
  let traceMetrics: TracealyticsResults | undefined = undefined

  const trace = !!traceFilename

  //console.log(`Loading page for version ${version}...`)

  if (trace) {
    page.on('load', async () => {
      await timeout(1000)
      page.tracing.start({ path: traceFilename })
    })
  }
  await page.goto(url)

  const start = performance.now()

  if (trace) {
    await timeout(delay + 1000)
    await page.tracing.stop()
    traceMetrics = tracealyzer(traceFilename)
  } else {
    await timeout(delay)
  }

  const end = performance.now()

  const fpsStatsEntries: FPSStatsEntry[] =
    JSON.parse(
      await page.evaluate(() => {
        return JSON.stringify(window.getFpsStats())
      })
    ) || []

  const reactTimingEntries: RenderResult[] =
    JSON.parse(
      await page.evaluate(() => {
        return JSON.stringify(window.renderResults)
      })
    ) || []

  fpsValues = fpsStatsEntries.map((entry) => {
    const { FPS, isFinal } = entry.meta.details
    return { FPS, timestamp: entry.timeStamp, isFinal }
  })

  await page.close()

  return { fpsValues, traceMetrics, start, end, reactTimingEntries }
}
