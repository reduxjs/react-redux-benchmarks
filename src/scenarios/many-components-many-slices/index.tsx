import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { rootReducer, incrementActions } from './state'

import App from './App'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }),
})

const incrementRandom = () => {
  const randomIndex = Math.floor(Math.random() * incrementActions.length)
  store.dispatch(incrementActions[randomIndex]())
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(incrementRandom, 13)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
