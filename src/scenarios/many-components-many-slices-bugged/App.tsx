import React from 'react'
import { useSelector } from 'react-redux'

import { NUMBER_OF_COMPONENTS } from './constants'

import { getSliceName } from './state'
import type { RootState } from './state'

const createComponent = (index: number) => {
  const sliceName = getSliceName(index)

  return function Component() {
    // NOTE: "Bugged" selector used on purpose to force a rerender on every state change
    // Returning a new object every time causes a rerender
    const { counter } = useSelector((state: RootState) => {
      return {
        counter: state[sliceName].counter,
      }
    })

    return <div>{counter}</div>
  }
}

function App() {
  return (
    <div>
      {Array.from({ length: NUMBER_OF_COMPONENTS }).map((_, index) => {
        // App is rendered only once, so components are not re-created
        const Component = createComponent(index)
        return <Component key={index} />
      })}
    </div>
  )
}

export default App
