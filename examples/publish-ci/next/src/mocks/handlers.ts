import { createEntityAdapter } from '@reduxjs/toolkit'
import type { DefaultBodyType } from 'msw'
import { delay, http, HttpResponse } from 'msw'
import type { Post } from '../app-core/services/post'
import type { TimeResponse } from '../app-core/services/times'

// We're just going to use a simple in-memory store for both the counter and posts
// The entity adapter will handle modifications when triggered by the MSW handlers

const adapter = createEntityAdapter<Post>()

let state = adapter.getInitialState()
state = adapter.setAll(state, [
  { id: 1, name: 'A sample post', fetched_at: new Date().toUTCString() },
  {
    id: 2,
    name: 'A post about rtk-query',
    fetched_at: new Date().toUTCString(),
  },
])

export { state }

export const handlers = [
  http.get<{ offset: string }, DefaultBodyType, TimeResponse>(
    '/time/:offset',
    async ({ params }) => {
      const { offset } = params
      const date = new Date()
      const localDate = date.getTime() // users local time
      const localOffset = date.getTimezoneOffset() * 60000
      const formattedOffset = Number(offset.replace(':', '.'))
      const target = localDate + localOffset + 3600000 * formattedOffset

      await delay(400)

      return HttpResponse.json(
        { time: new Date(target).toUTCString() },
        { status: 200 },
      )
    },
  ),

  http.get<{ id: string }, DefaultBodyType, Post>(
    '/posts/:id',
    async ({ params }) => {
      const { id: idParam } = params
      const id = parseInt(idParam, 10)
      state = adapter.updateOne(state, {
        id,
        changes: { fetched_at: new Date().toUTCString() },
      })

      await delay(400)

      return HttpResponse.json(state.entities[id], { status: 200 })
    },
  ),
]
