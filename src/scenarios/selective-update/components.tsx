import React from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import type { RootState } from './state'

export const ActiveUsersDisplay = React.memo(function ActiveUsersDisplay() {
  const activeUsers = useSelector(
    (state: RootState) => state.dashboard.activeUsers
  )
  return <div>Users: {activeUsers}</div>
})

export const TotalRevenueDisplay = React.memo(function TotalRevenueDisplay() {
  const totalRevenue = useSelector(
    (state: RootState) => state.dashboard.totalRevenue
  )
  return <div>{totalRevenue.toFixed(2)}</div>
})

export const ErrorCountDisplay = React.memo(function ErrorCountDisplay() {
  const errorCount = useSelector(
    (state: RootState) => state.dashboard.errorCount
  )
  return <div>{errorCount}</div>
})

export const RequestsPerSecondDisplay = React.memo(
  function RequestsPerSecondDisplay() {
    const rps = useSelector(
      (state: RootState) => state.dashboard.requestsPerSecond
    )
    return <div>{rps}</div>
  }
)

export const UptimeDisplay = React.memo(function UptimeDisplay() {
  const uptime = useSelector((state: RootState) => state.dashboard.uptime)
  return <div>{uptime.toFixed(2)}%</div>
})

export const LatestAlertDisplay = React.memo(function LatestAlertDisplay() {
  const alert = useSelector(
    (state: RootState) => state.dashboard.latestAlert
  )
  return <div>Alert: {alert.message}</div>
})

export const SystemStatusDisplay = React.memo(function SystemStatusDisplay() {
  const status = useSelector(
    (state: RootState) => ({
      cpu: state.dashboard.systemStatus.cpu,
      memory: state.dashboard.systemStatus.memory,
    }),
    shallowEqual
  )
  return <div>CPU: {status.cpu.toFixed(1)}%</div>
})

export const TopEndpointDisplay = React.memo(function TopEndpointDisplay() {
  const endpoint = useSelector(
    (state: RootState) => state.dashboard.topEndpoint
  )
  return (
    <div>
      {endpoint.path}: {endpoint.hits} hits ({endpoint.avgLatency}ms)
    </div>
  )
})

export const RecentEventsDisplay = React.memo(function RecentEventsDisplay() {
  const events = useSelector(
    (state: RootState) => state.dashboard.recentEvents
  )
  return <div>{events.length} events</div>
})

export const ActiveRegionsDisplay = React.memo(function ActiveRegionsDisplay() {
  const regions = useSelector(
    (state: RootState) => state.dashboard.activeRegions
  )
  return <div>{regions.join(', ')}</div>
})
