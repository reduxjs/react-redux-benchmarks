import React, { useLayoutEffect } from 'react'
import { createStore, combineReducers, AnyAction } from 'redux'
import { useSelector, useDispatch } from 'react-redux'

import { renderApp } from '../../common'

import App from './App'

const ADD_TWEET = 'add-tweet'

const NUMBER_OF_SLICES = 1000

function addTweet(id: string) {
  return {
    type: `${ADD_TWEET}_${id}`,
    payload: 'fabulous',
  }
}

const highOrderSliceReducer =
  (sliceId = '') =>
  (state = [] as string[], action: AnyAction) => {
    switch (action.type) {
      case `${ADD_TWEET}_${sliceId}`: {
        return [...state, action.payload as string]
      }
      default: {
        return state
      }
    }
  }

const reducers = Array(NUMBER_OF_SLICES)
  .fill(0)
  .reduce((acc, curr, i) => {
    acc[i] = highOrderSliceReducer(i.toString())
    return acc
  }, {})

const rootReducer = combineReducers(reducers)

const store = createStore(rootReducer)

function addTweetInRandomSlice() {
  const sliceId = Math.floor(Math.random() * NUMBER_OF_SLICES)
  // @ts-ignore
  store.dispatch(addTweet(sliceId))
}

const TwitterApp = () => {
  useLayoutEffect(() => {
    setInterval(addTweetInRandomSlice, 13)

    setInterval(addTweetInRandomSlice, 21)

    setInterval(addTweetInRandomSlice, 34)

    setInterval(addTweetInRandomSlice, 55)
  }, [])

  return <App />
}

// @ts-ignore
renderApp(TwitterApp, store)
