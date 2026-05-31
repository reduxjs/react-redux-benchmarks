import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'
// @ts-ignore
import seedrandom from 'seedrandom'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'

import reducer from './reducers'
import { doRandomAction } from './actions'
import generateTree from './generateTree'
import Node from './containers/Node'

seedrandom('test seed', { global: true })

const tree = generateTree(5000)
const store = configureStore({
  reducer,
  preloadedState: tree,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

let maxUpdates = 3500,
  numUpdates = 0

function runUpdates() {
  doRandomAction()
  numUpdates++

  if (numUpdates < maxUpdates) {
    setTimeout(runUpdates, 25)
  }
}

const StockTickerApp = () => {
  useLayoutEffect(() => {
    setTimeout(runUpdates, 250)
  }, [])

  return <Node id={0} />
}

// @ts-ignore
renderApp(StockTickerApp, store)
