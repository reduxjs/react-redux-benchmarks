import React from 'react'
import { PostList, PostCount, UserCard, CommentSection } from './components'
import {
  POST_LIST_COUNT,
  POST_COUNT_COUNT,
  USER_CARD_COUNT,
  COMMENT_SECTION_COUNT,
  NUM_PAGES,
  NUM_USERS,
  NUM_COMMENT_POSTS,
} from './constants'

const postListItems = Array.from({ length: POST_LIST_COUNT }, (_, i) => i % NUM_PAGES)
const postCountItems = Array.from({ length: POST_COUNT_COUNT }, (_, i) => i % NUM_PAGES)
const userCardItems = Array.from({ length: USER_CARD_COUNT }, (_, i) => i % NUM_USERS)
const commentSectionItems = Array.from(
  { length: COMMENT_SECTION_COUNT },
  (_, i) => i % NUM_COMMENT_POSTS
)

const App = () => (
  <div>
    <div>
      {postListItems.map((page, i) => (
        <PostList key={i} page={page} />
      ))}
    </div>
    <div>
      {postCountItems.map((page, i) => (
        <PostCount key={i} page={page} />
      ))}
    </div>
    <div>
      {userCardItems.map((userId, i) => (
        <UserCard key={i} userId={userId} />
      ))}
    </div>
    <div>
      {commentSectionItems.map((postId, i) => (
        <CommentSection key={i} postId={postId} />
      ))}
    </div>
  </div>
)

export default App
