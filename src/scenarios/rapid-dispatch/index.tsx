import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { listenerMiddleware } from './listenerMiddleware'
import { rootReducer } from './state'
import { doRandomDispatch } from './dispatchers'
import App from './App'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    })
      .prepend(listenerMiddleware.middleware)
      .concat(dispatchTimingMiddleware),
})

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(() => doRandomDispatch(store), 100)
  }, [])
  return <App />
}

export type AppStore = typeof store

// @ts-ignore
renderApp(RootApp, store)
