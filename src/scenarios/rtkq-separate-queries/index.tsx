import React, { useLayoutEffect } from 'react'

import { store } from './store'
import App from './App'
import { api } from './api'

import { renderApp } from '../../common'

const invalidateAll = () => {
  store.dispatch(api.util.invalidateTags(['QUERY']))
}

const RootApp = () => {
  useLayoutEffect(() => {
    setInterval(invalidateAll, 200)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(RootApp, store)
