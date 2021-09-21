import React, { useLayoutEffect } from 'react'
import ReactDOM from 'react-dom'
import { configureStore, AnyAction } from '@reduxjs/toolkit'

import { renderApp } from '../../common'

import App from './App'
import * as c from './constants'

import rootReducer, { initialize, typeTextInRandomInput } from './inputs'

const store = configureStore({
  reducer: rootReducer,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }),
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
