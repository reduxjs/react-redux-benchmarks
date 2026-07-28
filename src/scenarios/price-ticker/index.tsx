import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'

import App from './App'
import rootReducer, { tick } from './state'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(() => store.dispatch(tick()), 13)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
