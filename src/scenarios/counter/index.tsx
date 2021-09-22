import React from 'react'
import { createStore } from 'redux'
import { useSelector, useDispatch } from 'react-redux'

import { renderApp } from '../../common'

const counterReducer = (state = 0, action: any) => {
  if (action.type === 'increment') {
    return state + 1
  }
  return state
}

const store = createStore(counterReducer)

const CounterApp = () => {
  const counter = useSelector((state: number) => state)
  const dispatch = useDispatch()

  return (
    <div>
      <div>Value: {counter}</div>
      <button onClick={() => dispatch({ type: 'increment' })}>Increment</button>
    </div>
  )
}

renderApp(CounterApp, store)
