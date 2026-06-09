export interface Post {
  id: number
  title: string
  score: number
  userId: number
}

export interface User {
  id: number
  name: string
  role: string
}

export interface Comment {
  id: number
  postId: number
  userId: number
  text: string
}

const ROLES = ['admin', 'editor', 'viewer', 'moderator']

export function generatePosts(page: number, count: number): Post[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = page * 1000 + i
    return {
      id: seed,
      title: `Post ${seed} on page ${page}`,
      score: (seed * 7 + 13) % 500,
      userId: (seed * 3 + 1) % 80,
    }
  })
}

export function generateUser(userId: number): User {
  return {
    id: userId,
    name: `User ${userId}`,
    role: ROLES[userId % ROLES.length],
  }
}

export function generateComments(postId: number, count: number): Comment[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = postId * 100 + i
    return {
      id: seed,
      postId,
      userId: (seed * 3 + 7) % 80,
      text: `Comment ${i} on post ${postId}`,
    }
  })
}
