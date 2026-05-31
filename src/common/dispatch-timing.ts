import type { Middleware } from 'redux'

interface DispatchTimingEntry {
  action: string
  duration: number
  timestamp: number
}

const dispatchTimings: DispatchTimingEntry[] = []

export const dispatchTimingMiddleware: Middleware = () => (next) => (action) => {
  const actionType =
    typeof action === 'object' && action !== null && 'type' in action
      ? (action as { type: string }).type
      : String(action)

  const start = performance.now()
  const result = next(action)
  const duration = performance.now() - start

  dispatchTimings.push({
    action: actionType,
    duration,
    timestamp: start,
  })

  return result
}

export function getDispatchStats() {
  const count = dispatchTimings.length
  if (count === 0) {
    return { count: 0, totalTime: 0, avgTime: 0, maxTime: 0, p95Time: 0 }
  }

  const durations = dispatchTimings.map((e) => e.duration)
  const totalTime = durations.reduce((sum, d) => sum + d, 0)
  const avgTime = totalTime / count

  const sorted = [...durations].sort((a, b) => a - b)
  const maxTime = sorted[sorted.length - 1]
  const p95Index = Math.floor(sorted.length * 0.95)
  const p95Time = sorted[p95Index]

  return { count, totalTime, avgTime, maxTime, p95Time }
}

// @ts-ignore
window.getDispatchStats = getDispatchStats
