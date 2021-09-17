import React, { Profiler, ProfilerProps } from 'react'
import ReactDOM from 'react-dom'
import { Store } from 'redux'
import { Provider } from 'react-redux'

// eslint-disable-next-line import/no-dynamic-require, global-require
// const { App, store } = require(`./scenarios/${process.env.NAME!}`)

document.title = process.env.NAME!

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

export const renderApp = (App: React.ReactNode, store: Store) => {
  const rootElements = (
    <Profiler id="appProfiler" onRender={onAppRendered}>
      <Provider store={store}>
        <App />
      </Provider>
    </Profiler>
  )

  if (process.env.CONCURRENT_RENDERING) {
    const root = ReactDOM.createRoot(document.getElementById('app')!)
    root.render(rootElements)
  } else {
    ReactDOM.render(rootElements, document.getElementById('app')!)
  }
}
