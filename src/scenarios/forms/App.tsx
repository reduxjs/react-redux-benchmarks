import React from 'react'
import { useSelector } from 'react-redux'

import Form from './Form'

import { typeTextInRandomInput } from './inputs'

async function infiniteBobRoss() {
  while (true) {
    await typeTextInRandomInput()
  }
}

const App = () => {
  const slices = useSelector((state: Record<number, string>) => {
    return Object.keys(state).map(Number)
  }, () => true)

  return (
    <div>
      <button onClick={infiniteBobRoss}>Type Text</button>
      <div className="row">
        {slices.map((slice) => (
          <div style={{ display: 'inline-block', minWidth: 70 }} key={slice}>
            <Form id={slice} />
          </div>
        ))}
      </div>
    </div>
  )
}
App.displayName = 'App'

export default App
