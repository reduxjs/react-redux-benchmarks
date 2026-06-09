/**
 * Node-mode replacement for src/common/index.tsx
 *
 * Uses @happy-dom/global-registrator to set up DOM globals,
 * then exports the same `renderApp` signature.
 * No <Profiler> wrapper — pprof-it provides the profiling.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator'

// Register happy-dom globals (document, window, HTMLElement, etc.)
GlobalRegistrator.register({ url: 'http://localhost' })

// Now that DOM globals exist, we can set up the root element
document.body.innerHTML = '<div id="root"></div>'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { Store } from 'redux'
import { Provider } from 'react-redux'

// Stubs that dispatch-timing.ts and scenarios expect
;(window as any).renderResults = []
;(window as any).getDispatchStats = () => ({
  count: 0,
  totalTime: 0,
  avgTime: 0,
  maxTime: 0,
  p95Time: 0,
})

// Duration before auto-exit (seconds). Default 10s.
// Grab env indirectly to prevent Vite's define from replacing process.env → {}
const _env = process; const profileDuration = Number(_env.env.PROFILE_DURATION ?? 10)

export const renderApp = (App: React.ComponentType, store: Store) => {
  const rootElements = (
    <Provider store={store}>
      <App />
    </Provider>
  )

  const domNode = document.getElementById('root')!
  const root = createRoot(domNode)
  root.render(rootElements)

  console.log(
    `[node-profiler] Rendered ${process.env.NAME} (${process.env.RR_VERSION}). ` +
      `Running for ${profileDuration}s...`,
  )

  // Let timers/dispatches run for the specified duration, then exit
  setTimeout(() => {
    console.log(`[node-profiler] ${profileDuration}s elapsed, exiting.`)
    process.exit(0)
  }, profileDuration * 1000)
}
