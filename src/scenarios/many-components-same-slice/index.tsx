import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'

import App from './App'
import rootReducer, { increment } from './stateSlice'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }),
})

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(() => store.dispatch(increment()), 13)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
