import React, { Profiler, ProfilerProps } from 'react'
import { createRoot } from 'react-dom/client'
import { Store } from 'redux'
import { Provider } from 'react-redux'

import './fps-emit'

// eslint-disable-next-line import/no-dynamic-require, global-require
// const { App, store } = require(`./scenarios/${process.env.NAME!}`)

document.title = `React-Redux Benchmarks: ${process.env.NAME!} / ${
  process.env.RR_VERSION
}`

// @ts-ignore
const renderResults = []
// @ts-ignore
window.renderResults = renderResults

const onAppRendered: ProfilerProps['onRender'] = (
  id,
  phase,
  actualTime,
  baseTime,
  startTime,
  commitTime
) => {
  renderResults.push({
    id,
    phase,
    actualTime,
    baseTime,
    startTime,
    commitTime,
  })
}

export const renderApp = (App: React.ComponentType, store: Store) => {
  const rootElements = (
    <Profiler id="appProfiler" onRender={onAppRendered}>
      <Provider store={store}>
        <App />
      </Provider>
    </Profiler>
  )

  const domNode = document.getElementById('root')!
  const root = createRoot(domNode)
  root.render(rootElements)
}
