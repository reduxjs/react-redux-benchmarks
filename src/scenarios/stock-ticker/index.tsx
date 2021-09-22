import React, { useLayoutEffect } from 'react'
import { configureStore, AnyAction } from '@reduxjs/toolkit'

import { renderApp } from '../../common'

import App from './App'
import * as c from './constants'
import { updatePair, updateRandomPairInSlice, fillPairs } from './pairActions'

const initialState: any = []

const highOrderSliceReducer =
  (sliceId = '') =>
  (state = initialState, action: AnyAction) => {
    switch (action.type) {
      case `${c.FILL_PAIRS}_${sliceId}`: {
        return [...action.pairs]
      }
      case `${c.UPDATE_PAIR}_${sliceId}`: {
        return state.map((pair: any) => {
          return pair.id === action.id ? { ...pair, value: action.value } : pair
        })
      }
      default: {
        return state
      }
    }
  }

const reducers = Array(c.NUMBER_OF_SLICES)
  .fill(0)
  .reduce((acc, curr, i) => {
    acc[i] = highOrderSliceReducer(i.toString())
    return acc
  }, {})

const store = configureStore({
  reducer: reducers,
  middleware: (gdm) =>
    gdm({
      immutabilityCheck: false,
      serializableCheck: false,
    }),
})

for (let i = 0; i < c.NUMBER_OF_SLICES; i++) {
  // @ts-ignore
  store.dispatch(fillPairs(i))
}

function addTweetInRandomSlice() {
  const sliceId = Math.floor(Math.random() * c.NUMBER_OF_SLICES)
  // @ts-ignore
  store.dispatch(addTweet(sliceId))
}

function doRandomUpdate() {
  store.dispatch(updateRandomPairInSlice())
}

const StockTickerApp = () => {
  useLayoutEffect(() => {
    setInterval(doRandomUpdate, 13)

    setInterval(doRandomUpdate, 21)

    setInterval(doRandomUpdate, 34)

    setInterval(doRandomUpdate, 55)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(StockTickerApp, store)
