import React, { useLayoutEffect } from 'react'
import ReactDOM from 'react-dom'
import { configureStore, AnyAction } from '@reduxjs/toolkit'

import { renderApp } from '../../common'

import App from './App'
import * as c from './constants'
import rootReducer, {
  initialize,
  incrementRandomCounter,
  incrementMany,
} from './counters'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }),
})

store.dispatch(initialize({ numberOfCounters: c.NUMBER_OF_SLICES }))

function doRandomUpdate() {
  store.dispatch(incrementRandomCounter())
}

function doUpdateMany(mod: number) {
  store.dispatch(incrementMany({ mod }))
}

const DeepTreeApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomUpdate, 13)

    setInterval(() => doUpdateMany(5), 21)

    setInterval(doRandomUpdate, 34)

    setInterval(() => doUpdateMany(3), 55)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(DeepTreeApp, store)
