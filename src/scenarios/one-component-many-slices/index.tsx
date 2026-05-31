import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { rootReducer, incrementFirstSlice } from './state'

import App from './App'

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
    setInterval(() => {
      store.dispatch(incrementFirstSlice())
    }, 13)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
