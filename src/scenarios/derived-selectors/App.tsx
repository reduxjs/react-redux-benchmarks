import React from 'react'
import {
  TIER1_COUNT,
  TIER2_COUNT,
  TIER3_COUNT,
  TIER4_COUNT,
  CATEGORIES,
  NUM_USERS,
} from './constants'
import {
  PostCard,
  PostWithComments,
  UserPostList,
  CategoryStats,
} from './components'

// Stable user IDs: pick TIER3_COUNT evenly spread across NUM_USERS
const userIds = Array.from(
  { length: TIER3_COUNT },
  (_, i) => Math.floor((i * NUM_USERS) / TIER3_COUNT)
)

function App() {
  return (
    <div>
      <div>
        {Array.from({ length: TIER1_COUNT }, (_, i) => (
          <PostCard key={`t1-${i}`} postId={i} />
        ))}
      </div>
      <div>
        {Array.from({ length: TIER2_COUNT }, (_, i) => (
          <PostWithComments key={`t2-${i}`} postId={i} />
        ))}
      </div>
      <div>
        {userIds.map((uid) => (
          <UserPostList key={`t3-${uid}`} userId={uid} />
        ))}
      </div>
      <div>
        {CATEGORIES.map((cat) =>
          Array.from({ length: TIER4_COUNT / CATEGORIES.length }, (_, i) => (
            <CategoryStats key={`t4-${cat}-${i}`} category={cat} />
          ))
        )}
      </div>
    </div>
  )
}

export default App
