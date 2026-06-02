import React from 'react'
import { useGetPostsQuery, useGetUserQuery, useGetCommentsQuery } from './api'

export const PostList = React.memo(function PostList({
  page,
}: {
  page: number
}) {
  const { data: posts, isFetching } = useGetPostsQuery({ page })
  return (
    <div>
      <div>
        Page {page} {isFetching ? '(loading)' : `(${posts?.length ?? 0} posts)`}
      </div>
      {posts?.map((p) => (
        <span key={p.id}>{p.title}: {p.score} </span>
      ))}
    </div>
  )
})

export const PostCount = React.memo(function PostCount({
  page,
}: {
  page: number
}) {
  const { postCount, isFetching } = useGetPostsQuery(
    { page },
    {
      selectFromResult: ({ data, isFetching }) => ({
        postCount: data?.length ?? 0,
        isFetching,
      }),
    }
  )
  return (
    <div>
      Page {page}: {isFetching ? '...' : postCount} posts
    </div>
  )
})

export const UserCard = React.memo(function UserCard({
  userId,
}: {
  userId: number
}) {
  const { data: user, isFetching } = useGetUserQuery(userId)
  return (
    <div>
      {isFetching
        ? 'Loading...'
        : user
          ? `${user.name} (${user.role})`
          : 'Unknown'}
    </div>
  )
})

export const CommentSection = React.memo(function CommentSection({
  postId,
}: {
  postId: number
}) {
  const { data: comments, isFetching } = useGetCommentsQuery(postId)
  return (
    <div>
      Post {postId}: {isFetching ? '...' : `${comments?.length ?? 0} comments`}
    </div>
  )
})
