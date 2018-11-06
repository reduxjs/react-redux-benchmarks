import * as c from './constants'

export function addTweet (id) {
    return {
      type: `${c.ADD_TWEET}_${id}`,
      tweet: 'fabulous'
    }
  }