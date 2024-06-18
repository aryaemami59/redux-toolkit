import { createEntityAdapter, nanoid } from '@reduxjs/toolkit'
import { delay, http, HttpResponse } from 'msw'
import type { Post } from '../app/services/posts'

// We're just going to use a simple in-memory store for both the counter and posts
// The entity adapter will handle modifications when triggered by the MSW handlers

let count = 0
let startingId = 3 // Just a silly counter for usage when adding new posts

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

// Just use a random id for an auth token
const token = nanoid()

export const handlers = [
  http.get<{ offset: string }>('/time/:offset', async ({ params }) => {
    const { offset } = params
    const date = new Date()
    const localDate = date.getTime() // users local time
    const localOffset = date.getTimezoneOffset() * 60_000
    const formattedOffset = Number(offset.replace(':', '.'))
    const target = localDate + localOffset + 3_600_000 * formattedOffset
    await delay(400)
    return HttpResponse.json({ time: new Date(target).toUTCString() })
  }),

  http.put<Record<string, string>, { amount: number }>(
    '/increment',
    async ({ request }) => {
      const body = await request.json()
      const { amount } = body
      count = count += amount

      return HttpResponse.json({ count })
    },
  ),

  http.put<Record<string, string>, { amount: number }>(
    '/decrement',
    async ({ request }) => {
      const body = await request.json()
      const { amount } = body
      count = count -= amount

      return HttpResponse.json({ count })
    },
  ),

  http.get('/count', () => {
    return HttpResponse.json({ count })
  }),

  http.post(
    '/login',
    () => {
      return HttpResponse.json({ message: 'i fail once' }, { status: 500 })
    },
    { once: true },
  ),
  http.post('/login', () => {
    return HttpResponse.json({
      token,
      user: { first_name: 'Test', last_name: 'User' },
    })
  }),

  http.get('/posts', () => {
    return HttpResponse.json(Object.values(state.entities))
  }),

  http.post<any, Post>('/posts', async ({ request }) => {
    const body = await request.json()
    const post = body
    startingId += 1
    state = adapter.addOne(state, { ...post, id: startingId })
    await delay(400)
    return HttpResponse.json(Object.values(state.entities))
  }),

  http.get<{ id: string }>('/posts/:id', async ({ params }) => {
    const { id: idParam } = params
    const id = parseInt(idParam, 10)
    state = adapter.updateOne(state, {
      id,
      changes: { fetched_at: new Date().toUTCString() },
    })
    await delay(400)
    return HttpResponse.json(state.entities[id])
  }),

  http.put<{ id: string }, Partial<Post>>(
    '/posts/:id',
    async ({ request, params }) => {
      const body = await request.json()
      const { id: idParam } = params
      const id = parseInt(idParam, 10)
      const changes = body

      state = adapter.updateOne(state, { id, changes })
      await delay(400)

      return HttpResponse.json(state.entities[id])
    },
  ),

  http.delete<{ id: string }>('/posts/:id', async ({ params }) => {
    const { id: idParam } = params
    const id = parseInt(idParam, 10)

    state = adapter.removeOne(state, id)
    await delay(600)

    return HttpResponse.json({
      id,
      success: true,
    })
  }),

  http.get('/error-prone', () => {
    if (Math.random() > 0.1) {
      return HttpResponse.json({ error: 'failed!' }, { status: 500 })
    }
    return HttpResponse.json({
      success: true,
    })
  }),
]
