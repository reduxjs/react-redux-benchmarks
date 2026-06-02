import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'
import { rootReducer, allActions } from './state'

import App from './App'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

const doRandomDispatch = () => {
  const randomIndex = Math.floor(Math.random() * allActions.length)
  store.dispatch(allActions[randomIndex]())
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomDispatch, 25)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
