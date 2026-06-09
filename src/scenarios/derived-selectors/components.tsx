import React from 'react'
import { useSelector } from 'react-redux'
import { selectPostById } from './state'
import {
  selectPostWithComments,
  selectPostsByUser,
  selectCategoryStats,
} from './selectors'
import type { RootState } from './state'

// Tier 1: direct entity lookup
export const PostCard = React.memo(function PostCard({
  postId,
}: {
  postId: number
}) {
  const post = useSelector((state: RootState) => selectPostById(state, postId))
  if (!post) return null
  return (
    <div>
      {post.title}: {post.score}
    </div>
  )
})

// Tier 2: post + derived comment count
export const PostWithComments = React.memo(function PostWithComments({
  postId,
}: {
  postId: number
}) {
  const data = useSelector((state: RootState) =>
    selectPostWithComments(state, postId)
  )
  if (!data) return null
  return (
    <div>
      {data.title} ({data.commentCount} comments)
    </div>
  )
})

// Tier 3: filtered + sorted posts per user
export const UserPostList = React.memo(function UserPostList({
  userId,
}: {
  userId: number
}) {
  const posts = useSelector((state: RootState) =>
    selectPostsByUser(state, userId)
  )
  return (
    <div>
      {posts.length} posts, top: {posts[0]?.title}
    </div>
  )
})

// Tier 4: aggregated category statistics
export const CategoryStats = React.memo(function CategoryStats({
  category,
}: {
  category: string
}) {
  const stats = useSelector((state: RootState) =>
    selectCategoryStats(state, category)
  )
  return (
    <div>
      {category}: {stats.postCount} posts, avg {stats.avgScore.toFixed(1)}
    </div>
  )
})
