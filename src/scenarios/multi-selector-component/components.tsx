import React from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import type { RootState } from './state'

const DashboardCard = React.memo(function DashboardCard({
  itemId,
}: {
  itemId: number
}) {
  // 1: primitive from auth
  const role = useSelector((state: RootState) => state.auth.role)
  // 2: primitive from notifications
  const unreadCount = useSelector(
    (state: RootState) => state.notifications.unreadCount
  )
  // 3: object ref from data
  const item = useSelector((state: RootState) => state.data.items[itemId])
  // 4: derived object with shallowEqual
  const uiState = useSelector(
    (state: RootState) => ({
      sidebar: state.ui.sidebarOpen,
      tab: state.ui.activeTab,
    }),
    shallowEqual
  )

  return (
    <div>
      {role} | {unreadCount} | {item?.value} | {uiState.tab}
    </div>
  )
})

export default DashboardCard
