import { createSelector } from '@reduxjs/toolkit'
import {
  selectPostById,
  selectAllPosts,
  selectAllComments,
} from './state'
import type { RootState } from './state'

// Tier 2: post + comment count
export const selectPostWithComments = createSelector(
  [
    (state: RootState, postId: number) => selectPostById(state, postId),
    selectAllComments,
  ],
  (post, comments) =>
    post
      ? {
          ...post,
          commentCount: comments.filter((c) => c.postId === post.id).length,
        }
      : null
)

// Tier 3: all posts for a user, sorted by score desc
export const selectPostsByUser = createSelector(
  [selectAllPosts, (_: RootState, userId: number) => userId],
  (posts, userId) =>
    posts
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.score - a.score)
)

// Tier 4: aggregate stats for a category
export const selectCategoryStats = createSelector(
  [selectAllPosts, selectAllComments, (_: RootState, category: string) => category],
  (posts, comments, category) => {
    const catPosts = posts.filter((p) => p.category === category)
    const postIds = new Set(catPosts.map((p) => p.id))
    const commentCount = comments.filter((c) => postIds.has(c.postId)).length
    const avgScore =
      catPosts.length > 0
        ? catPosts.reduce((sum, p) => sum + p.score, 0) / catPosts.length
        : 0
    return {
      postCount: catPosts.length,
      avgScore,
      commentCount,
    }
  }
)
