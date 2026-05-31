import React from 'react'
import { useSelector } from 'react-redux'

import * as c from './constants'

interface RootState {
  counter: number
}

function Component() {
  const counter = useSelector((state: RootState) => state.counter)

  return <div>{counter}</div>
}

function App() {
  return (
    <div>
      {Array.from({ length: c.NUMBER_OF_COMPONENTS }).map((_, index) => (
        <Component key={index} />
      ))}
    </div>
  )
}

export default App
