import React, { useLayoutEffect } from 'react'
import { renderApp } from '../../common'
import App from './App'
import { store } from './store'
import {
  broadInvalidation,
  targetedInvalidation,
  optimisticMutation,
} from './dispatchers'

function doRandomDispatch() {
  const roll = Math.random()
  if (roll < 0.4) {
    broadInvalidation(store)
  } else if (roll < 0.7) {
    targetedInvalidation(store)
  } else {
    optimisticMutation(store)
  }
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomDispatch, 200)
  }, [])
  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
