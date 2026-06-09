import { createSlice } from '@reduxjs/toolkit'

interface DashboardState {
  activeUsers: number
  totalRevenue: number
  errorCount: number
  requestsPerSecond: number
  uptime: number
  latestAlert: { id: number; message: string; severity: string }
  systemStatus: { cpu: number; memory: number; disk: number }
  topEndpoint: { path: string; hits: number; avgLatency: number }
  recentEvents: Array<{ id: number; type: string; timestamp: number }>
  activeRegions: string[]
}

const initialState: DashboardState = {
  activeUsers: 1420,
  totalRevenue: 58293.47,
  errorCount: 12,
  requestsPerSecond: 3850,
  uptime: 99.97,
  latestAlert: { id: 1, message: 'High memory usage', severity: 'warning' },
  systemStatus: { cpu: 62, memory: 78, disk: 45 },
  topEndpoint: { path: '/api/users', hits: 24500, avgLatency: 42 },
  recentEvents: [
    { id: 1, type: 'deploy', timestamp: 1700000000 },
    { id: 2, type: 'alert', timestamp: 1700000100 },
    { id: 3, type: 'scale', timestamp: 1700000200 },
  ],
  activeRegions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateActiveUsers(state) {
      state.activeUsers = Math.floor(Math.random() * 1000)
    },
    updateRevenue(state) {
      state.totalRevenue += Math.random() * 100
    },
    updateErrorCount(state) {
      state.errorCount += 1
    },
    updateRps(state) {
      state.requestsPerSecond = Math.floor(Math.random() * 5000)
    },
    updateUptime(state) {
      state.uptime += 1
    },
    updateLatestAlert(state) {
      state.latestAlert = {
        id: Date.now(),
        message: `Alert ${Date.now()}`,
        severity: 'warning',
      }
    },
    updateSystemStatus(state) {
      state.systemStatus.cpu = Math.random() * 100
    },
    updateTopEndpoint(state) {
      state.topEndpoint.hits += 1
    },
    pushEvent(state) {
      state.recentEvents.push({
        id: Date.now(),
        type: 'event',
        timestamp: Date.now(),
      })
      if (state.recentEvents.length > 50) state.recentEvents.shift()
    },
    toggleRegion(state) {
      const regions = ['us-east', 'us-west', 'eu-west', 'eu-east', 'ap-south']
      const r = regions[Math.floor(Math.random() * regions.length)]
      const idx = state.activeRegions.indexOf(r)
      if (idx >= 0) state.activeRegions.splice(idx, 1)
      else state.activeRegions.push(r)
    },
  },
})

export const {
  updateActiveUsers,
  updateRevenue,
  updateErrorCount,
  updateRps,
  updateUptime,
  updateLatestAlert,
  updateSystemStatus,
  updateTopEndpoint,
  pushEvent,
  toggleRegion,
} = dashboardSlice.actions

export const allActions = [
  updateActiveUsers,
  updateRevenue,
  updateErrorCount,
  updateRps,
  updateUptime,
  updateLatestAlert,
  updateSystemStatus,
  updateTopEndpoint,
  pushEvent,
  toggleRegion,
]

export const rootReducer = {
  dashboard: dashboardSlice.reducer,
}

export type RootState = {
  dashboard: DashboardState
}
