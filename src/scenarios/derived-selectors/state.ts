import {
  combineReducers,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit'
import {
  NUM_USERS,
  NUM_POSTS,
  NUM_COMMENTS,
  CATEGORIES,
} from './constants'

// --- Entity types ---

export interface User {
  id: number
  name: string
  role: 'admin' | 'user'
}

export interface Post {
  id: number
  userId: number
  title: string
  score: number
  category: string
}

export interface Comment {
  id: number
  postId: number
  userId: number
  text: string
}

// --- Adapters ---

const usersAdapter = createEntityAdapter<User>()
const postsAdapter = createEntityAdapter<Post>()
const commentsAdapter = createEntityAdapter<Comment>()

// --- Seed data ---

const roles: Array<'admin' | 'user'> = ['admin', 'user']

const seedUsers: User[] = Array.from({ length: NUM_USERS }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  role: roles[i % roles.length],
}))

const seedPosts: Post[] = Array.from({ length: NUM_POSTS }, (_, i) => ({
  id: i,
  userId: Math.floor(Math.random() * NUM_USERS),
  title: `Post ${i}`,
  score: Math.floor(Math.random() * 101),
  category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
}))

const seedComments: Comment[] = Array.from(
  { length: NUM_COMMENTS },
  (_, i) => ({
    id: i,
    postId: Math.floor(Math.random() * NUM_POSTS),
    userId: Math.floor(Math.random() * NUM_USERS),
    text: `Comment ${i}`,
  })
)

// --- Slices ---

const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(undefined, seedUsers),
  reducers: {
    updateRole(state, action: { payload: { id: number; role: 'admin' | 'user' } }) {
      usersAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { role: action.payload.role },
      })
    },
  },
})

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState(undefined, seedPosts),
  reducers: {
    updateScore: postsAdapter.updateOne,
  },
})

const commentsSlice = createSlice({
  name: 'comments',
  initialState: commentsAdapter.getInitialState(undefined, seedComments),
  reducers: {
    addComment: commentsAdapter.addOne,
  },
})

interface UiState {
  selectedCategory: string
  sortBy: 'score' | 'date'
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    selectedCategory: 'tech',
    sortBy: 'score',
  } as UiState,
  reducers: {},
})

// --- Root reducer & types ---

export const rootReducer = combineReducers({
  users: usersSlice.reducer,
  posts: postsSlice.reducer,
  comments: commentsSlice.reducer,
  ui: uiSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

// --- Adapter selectors ---

export const {
  selectById: selectUserById,
  selectAll: selectAllUsers,
} = usersAdapter.getSelectors((state: RootState) => state.users)

export const {
  selectById: selectPostById,
  selectAll: selectAllPosts,
} = postsAdapter.getSelectors((state: RootState) => state.posts)

export const {
  selectAll: selectAllComments,
} = commentsAdapter.getSelectors((state: RootState) => state.comments)

// --- Exported actions ---

export const { updateScore } = postsSlice.actions
export const { addComment } = commentsSlice.actions
export const { updateRole } = usersSlice.actions

// --- Mutable counter for new comment IDs ---

export let nextCommentId = NUM_COMMENTS
