import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { incrementActions, rootReducer, toggleActions } from './state'

import App from './App'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

let tick = 0

const dispatchNext = () => {
  const sliceIndex = tick % incrementActions.length
  // Every eighth tick flips a boolean instead of bumping a number, so the
  // diff sees a mix of leaf types rather than one monotonic counter.
  if (tick % 8 === 7) {
    store.dispatch(toggleActions[sliceIndex]())
  } else {
    store.dispatch(incrementActions[sliceIndex]())
  }
  tick++
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(dispatchNext, 13)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
