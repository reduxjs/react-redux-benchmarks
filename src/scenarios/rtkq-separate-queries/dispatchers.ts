import type { AppStore } from './store'
import { api } from './api'
import { NUM_COMMENT_POSTS } from './constants'
import { store } from './store'

export function broadInvalidation(store: AppStore) {
  store.dispatch(api.util.invalidateTags(['Post']))
}

export function targetedInvalidation(store: AppStore) {
  const postId = Math.floor(Math.random() * NUM_COMMENT_POSTS)
  store.dispatch(
    api.util.invalidateTags([{ type: 'Comment', id: `post-${postId}` }]),
  )
}

export function optimisticMutation(store: AppStore) {
  const postId = Math.floor(Math.random() * NUM_COMMENT_POSTS)
  store.dispatch(
    api.endpoints.addComment.initiate({ postId, text: 'New comment' }),
  )
}
