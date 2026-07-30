import React from 'react'
import { useSelector } from 'react-redux'

import { NUM_INSTRUMENTS } from './constants'
import type { RootState } from './state'

// A realistic per-row derive for a trading grid: % change vs. open plus a small
// sparkline summary (min / max / SMA) over the price history. This is the very
// common "just compute it in the selector" pattern — deliberately NOT a
// reselect-memoized selector — so it re-runs for every subscriber on every tick.
//
// It returns a single primitive signature so React-Redux's equality check can
// still bail out the rows whose instrument didn't tick, while the work itself
// runs regardless.
function selectRowSignature(state: RootState, index: number): number {
  const inst = state.instruments[index]
  const h = inst.history

  let min = Infinity
  let max = -Infinity
  let sum = 0
  for (let i = 0; i < h.length; i++) {
    const v = h[i]
    if (v < min) min = v
    if (v > max) max = v
    sum += v
  }

  const last = h[h.length - 1]
  const sma = sum / h.length
  const changePct = (last - inst.open) / inst.open
  const range = max - min || 1
  const sparkPos = (last - min) / range

  return Math.round((sma * 1e4 + changePct * 1e3 + sparkPos * 100) * 100)
}

function Row({ index }: { index: number }) {
  const signature = useSelector((state: RootState) =>
    selectRowSignature(state, index),
  )

  return <div>{signature}</div>
}

function App() {
  return (
    <div>
      {Array.from({ length: NUM_INSTRUMENTS }, (_, index) => (
        <Row key={index} index={index} />
      ))}
    </div>
  )
}

export default App
