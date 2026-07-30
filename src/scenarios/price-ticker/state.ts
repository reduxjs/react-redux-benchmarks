import { createSlice } from '@reduxjs/toolkit'

import { NUM_INSTRUMENTS, PRICES_PER_TICK, HISTORY_LENGTH } from './constants'

export interface Instrument {
  symbol: string
  open: number
  price: number
  history: number[]
}

export interface RootState {
  instruments: Instrument[]
}

const CCY = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD']

function makeSymbol(i: number) {
  return `${CCY[i % CCY.length]}/${CCY[(i * 7 + 3) % CCY.length]}#${i}`
}

// Deterministic PRNG so runs are comparable across versions.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(0xc0ffee)

const initialInstruments: Instrument[] = Array.from(
  { length: NUM_INSTRUMENTS },
  (_, i) => {
    const base = 0.5 + rng() * 1.5
    return {
      symbol: makeSymbol(i),
      open: base,
      price: base,
      history: Array.from({ length: HISTORY_LENGTH }, () => base),
    }
  },
)

// Cheap LCG for choosing which instruments tick, so the reducer stays cheap and
// the measured dispatch cost is dominated by the subscriber fan-out, not this.
let tickSeed = 1

const { reducer, actions } = createSlice({
  name: 'market',
  initialState: { instruments: initialInstruments } as RootState,
  reducers: {
    tick(state) {
      const n = state.instruments.length
      for (let k = 0; k < PRICES_PER_TICK; k++) {
        tickSeed = (tickSeed * 1103515245 + 12345) & 0x7fffffff
        const inst = state.instruments[tickSeed % n]
        const drift = (((tickSeed >>> 8) & 0xff) / 255 - 0.5) * 0.004
        inst.price = Math.max(0.0001, inst.price * (1 + drift))
        inst.history.push(inst.price)
        if (inst.history.length > HISTORY_LENGTH) inst.history.shift()
      }
    },
  },
})

export const { tick } = actions

export default reducer
