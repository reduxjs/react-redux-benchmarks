import type { Middleware } from 'redux'

interface DispatchTimingEntry {
  action: string
  duration: number
  timestamp: number
}

const dispatchTimings: DispatchTimingEntry[] = []

// A thunk's inner dispatches run inside the outer dispatch's timing window.
// Recording both would count the inner duration twice in the totals, which
// is how stock 9.2.0's rtkq scenario reported more Blocked time than Script
// time. Only the outermost dispatch of each chain is measured.
let depth = 0
let nestedDispatchCount = 0

export const dispatchTimingMiddleware: Middleware = () => (next) => (action) => {
  if (depth > 0) {
    nestedDispatchCount++
    return next(action)
  }

  const actionType =
    typeof action === 'object' && action !== null && 'type' in action
      ? (action as { type: string }).type
      : String(action)

  const start = performance.now()
  depth++
  try {
    return next(action)
  } finally {
    depth--
    dispatchTimings.push({
      action: actionType,
      duration: performance.now() - start,
      timestamp: start,
    })
  }
}

export function getDispatchStats() {
  const count = dispatchTimings.length
  if (count === 0) {
    return {
      count: 0,
      nestedCount: nestedDispatchCount,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      p95Time: 0,
    }
  }

  const durations = dispatchTimings.map((e) => e.duration)
  const totalTime = durations.reduce((sum, d) => sum + d, 0)
  const avgTime = totalTime / count

  const sorted = [...durations].sort((a, b) => a - b)
  const maxTime = sorted[sorted.length - 1]
  const p95Index = Math.floor(sorted.length * 0.95)
  const p95Time = sorted[p95Index]

  return {
    count,
    nestedCount: nestedDispatchCount,
    totalTime,
    avgTime,
    maxTime,
    p95Time,
  }
}

// @ts-ignore
window.getDispatchStats = getDispatchStats
