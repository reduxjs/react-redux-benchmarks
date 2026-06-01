// Instrumentation accumulator — injected at build time by the instrumentation plugin.
// Uses performance.now() deltas accumulated in numeric counters (not performance.mark()).
// Matches the pattern established by dispatch-timing.ts.

export interface InstrumentationStats {
  // Redux dispatch decomposition
  reducerTime: number
  reducerCount: number
  notifyTime: number
  callbackCount: number

  // uSES selector path (react-redux 9.2.0 standard)
  selectorTime: number
  selectorCount: number
  equalityCheckTime: number
  equalityCheckCount: number

  // Signal experiment path (react-redux 9.2.0-shallow-checks)
  reconcileTime: number
  reconcileCount: number
  signalSelectorTime: number
  signalSelectorCount: number
}

// This code is injected as a preamble string by the instrumentation plugin,
// NOT imported at runtime. The TypeScript here serves as documentation and
// type-checking for the shape. The actual injection is a raw JS string
// in the transform plugin.

declare global {
  // eslint-disable-next-line no-var
  var __benchInst: InstrumentationStats
  interface Window {
    getInstrumentationStats: () => InstrumentationStats
  }
}

export const INST_INIT_CODE = `
if (typeof globalThis.__benchInst === 'undefined') {
  globalThis.__benchInst = {
    reducerTime: 0,
    reducerCount: 0,
    notifyTime: 0,
    callbackCount: 0,
    selectorTime: 0,
    selectorCount: 0,
    equalityCheckTime: 0,
    equalityCheckCount: 0,
    reconcileTime: 0,
    reconcileCount: 0,
    signalSelectorTime: 0,
    signalSelectorCount: 0,
  };
  window.getInstrumentationStats = function() {
    return Object.assign({}, globalThis.__benchInst);
  };
}
`.trim()
