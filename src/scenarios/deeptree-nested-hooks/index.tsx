import React, { useLayoutEffect } from 'react'
import ReactDOM from 'react-dom'
import { configureStore, AnyAction } from '@reduxjs/toolkit'

import { renderApp } from '../../common'

import App from './App'
import * as c from './constants'
import countersReducer, { initialize } from './counters'
import stringsReducer from './strings'

const store = configureStore({
  reducer: {
    counters: countersReducer,
    strings: stringsReducer,
  },
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }),
})

store.dispatch(initialize({ numberOfCounters: c.NUMBER_OF_SLICES }))

function clickButton(id: string) {
  const element = document.getElementById(id)

  if (element) {
    element.click()
  }
}

const MULTIPLIER = 2

const DeepTreeNestedApp = () => {
  useLayoutEffect(() => {
    setInterval(() => clickButton('incrementRandom'), 13 * MULTIPLIER)
    setInterval(() => clickButton('appendRandomCharacter'), 37 * MULTIPLIER)
    setInterval(() => clickButton('incrementFifth'), 103 * MULTIPLIER)
    setInterval(() => clickButton('incrementThird'), 193 * MULTIPLIER)
    setInterval(() => clickButton('appendMany'), 251 * MULTIPLIER)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(DeepTreeNestedApp, store)
