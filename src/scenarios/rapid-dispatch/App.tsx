import React from 'react'
import {
  ITEM_STATUS_COUNT,
  COUNTER_VIEW_COUNT,
  LAST_UPDATED_COUNT,
  LOG_COUNT_COUNT,
} from './constants'
import { ItemStatus, CounterView, LastUpdated, LogCount } from './components'

function App() {
  return (
    <div>
      <div>
        {Array.from({ length: ITEM_STATUS_COUNT }).map((_, i) => (
          <ItemStatus key={i} itemId={i} />
        ))}
      </div>
      <div>
        {Array.from({ length: COUNTER_VIEW_COUNT }).map((_, i) => (
          <CounterView key={i} />
        ))}
      </div>
      <div>
        {Array.from({ length: LAST_UPDATED_COUNT }).map((_, i) => (
          <LastUpdated key={i} />
        ))}
      </div>
      <div>
        {Array.from({ length: LOG_COUNT_COUNT }).map((_, i) => (
          <LogCount key={i} />
        ))}
      </div>
    </div>
  )
}

export default App
