import { createApi, TagDescription } from '@reduxjs/toolkit/query/react'

export const config = {
  minimumRequestDuration: 50,
  maximumRequestDuration: 100,
  requestsPerArg: {} as Record<string, number>,
}

const t: TagDescription<'abcd'> = 'abcd'

export const baseQuery = (arg: string) => {
  return new Promise<{ data: string }>((resolve) => {
    config.requestsPerArg[arg] ??= 0
    const nextNumber = ++config.requestsPerArg[arg]
    const duration =
      config.minimumRequestDuration +
      Math.random() *
        (config.maximumRequestDuration - config.minimumRequestDuration)
    setTimeout(() => resolve({ data: `${arg}${nextNumber}` }), duration)
  })
}

export const api = createApi({
  baseQuery,
  tagTypes: ['QUERY'],
  endpoints: (build) => ({
    some: build.query({
      query: (arg: string) => arg,
      providesTags: ['QUERY'],
    }),
  }),
})

export const { useSomeQuery } = api
