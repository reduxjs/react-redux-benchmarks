import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  generatePosts,
  generateUser,
  generateComments,
  type Post,
  type User,
  type Comment,
} from './fakeData'

const randomDelay = () =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, 20 + Math.random() * 60)
  )

export const api = createApi({
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Post', 'User', 'Comment'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], { page: number }>({
      queryFn: async ({ page }) => {
        await randomDelay()
        return { data: generatePosts(page, 20) }
      },
      providesTags: (result, _error, { page }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: `LIST-${page}` },
              'Post',
            ]
          : ['Post'],
    }),

    getUser: builder.query<User, number>({
      queryFn: async (userId) => {
        await randomDelay()
        return { data: generateUser(userId) }
      },
      providesTags: (_result, _error, userId) => [
        { type: 'User', id: userId },
      ],
    }),

    getComments: builder.query<Comment[], number>({
      queryFn: async (postId) => {
        await randomDelay()
        return { data: generateComments(postId, 5) }
      },
      providesTags: (result, _error, postId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'Comment', id: `post-${postId}` },
            ]
          : [{ type: 'Comment', id: `post-${postId}` }],
    }),

    addComment: builder.mutation<
      Comment,
      { postId: number; text: string }
    >({
      queryFn: async ({ postId, text }) => {
        await randomDelay()
        const newComment: Comment = {
          id: Date.now(),
          postId,
          userId: Math.floor(Math.random() * 80),
          text,
        }
        return { data: newComment }
      },
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Comment', id: `post-${postId}` },
      ],
      onQueryStarted: async ({ postId, text }, { dispatch, queryFulfilled }) => {
        const newComment: Comment = {
          id: Date.now(),
          postId,
          userId: Math.floor(Math.random() * 80),
          text,
        }
        const patchResult = dispatch(
          api.util.updateQueryData('getComments', postId, (draft) => {
            draft.push(newComment)
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetUserQuery,
  useGetCommentsQuery,
} = api
