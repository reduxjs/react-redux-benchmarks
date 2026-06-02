import React from 'react'

import { COMPONENTS_PER_GROUP } from './constants'
import {
  ActiveUsersDisplay,
  TotalRevenueDisplay,
  ErrorCountDisplay,
  RequestsPerSecondDisplay,
  UptimeDisplay,
  LatestAlertDisplay,
  SystemStatusDisplay,
  TopEndpointDisplay,
  RecentEventsDisplay,
  ActiveRegionsDisplay,
} from './components'

const groups = [
  ActiveUsersDisplay,
  TotalRevenueDisplay,
  ErrorCountDisplay,
  RequestsPerSecondDisplay,
  UptimeDisplay,
  LatestAlertDisplay,
  SystemStatusDisplay,
  TopEndpointDisplay,
  RecentEventsDisplay,
  ActiveRegionsDisplay,
]

function App() {
  return (
    <div>
      {groups.map((Component, groupIndex) =>
        Array.from({ length: COMPONENTS_PER_GROUP }).map((_, i) => (
          <Component key={groupIndex * COMPONENTS_PER_GROUP + i} />
        ))
      )}
    </div>
  )
}

export default App
