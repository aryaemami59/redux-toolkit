import { factory, primaryKey } from '@mswjs/data'
import { nanoid } from '@reduxjs/toolkit'
import { delay, http, HttpResponse } from 'msw'
import type { Post } from '../app/services/posts'

const db = factory({
  post: {
    id: primaryKey(String),
    name: String,
  },
})

;[
  'A sample post',
  'A post about RTK Query',
  'How to randomly throw errors, a novella',
].forEach((name) => {
  db.post.create({ id: nanoid(), name })
})

export const handlers = [
  http.post<any, Partial<Post>>('/posts', async ({ request }) => {
    const body = await request.json()
    const { name } = body

    if (Math.random() < 0.3) {
      return HttpResponse.json(
        { error: 'Oh no, there was an error, try again.' },
        { status: 500 },
      )
    }

    const post = db.post.create({
      id: nanoid(),
      name,
    })
    await delay(300)

    return HttpResponse.json(post)
  }),
  http.put<any, Partial<Post>>('/posts/:id', async ({ request, params }) => {
    const body = await request.json()
    const { name } = body

    if (Math.random() < 0.3) {
      return HttpResponse.json(
        { error: 'Oh no, there was an error, try again.' },
        { status: 500 },
      )
    }

    const id = Array.isArray(params.id) ? params.id[0] : params.id

    const post = db.post.update({
      where: {
        id: {
          equals: id,
        },
      },
      data: { name },
    })
    await delay(300)

    return HttpResponse.json(post)
  }),
  ...db.post.toHandlers('rest'),
] as const
