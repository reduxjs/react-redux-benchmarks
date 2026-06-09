import React from 'react'
import { NUM_COMPONENTS } from './constants'
import DashboardCard from './components'

const itemIds = Array.from({ length: NUM_COMPONENTS }, (_, i) => i)

const App = () => {
  return (
    <div>
      {itemIds.map((id) => (
        <DashboardCard key={id} itemId={id} />
      ))}
    </div>
  )
}

export default App
