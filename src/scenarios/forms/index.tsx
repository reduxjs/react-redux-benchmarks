import React, { useLayoutEffect } from 'react'
import { configureStore } from '@reduxjs/toolkit'

import { renderApp } from '../../common'
import { dispatchTimingMiddleware } from '../../common/dispatch-timing'

import App from './App'
import * as c from './constants'

import rootReducer, { initialize, typeTextInRandomInput } from './inputs'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }).concat(dispatchTimingMiddleware),
})

store.dispatch(initialize({ numberOfInputs: c.NUMBER_OF_INPUTS }))

async function infiniteBobRoss() {
  while (true) {
    await typeTextInRandomInput()
  }
}

const FormsApp = () => {
  useLayoutEffect(() => {
    setTimeout(infiniteBobRoss, 50)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(FormsApp, store)
