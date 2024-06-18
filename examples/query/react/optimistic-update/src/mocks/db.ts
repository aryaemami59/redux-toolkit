import { factory, primaryKey } from '@mswjs/data'
import { http, delay, HttpResponse } from 'msw'
import type { Post } from '../app/services/posts'
const db = factory({
  post: {
    id: primaryKey(String),
    name: String,
  },
})

db.post.create({ id: '1', name: 'A sample post' })
db.post.create({ id: '2', name: 'A post about rtk query' })

export const handlers = [
  http.put<any, Partial<Post>>('/posts/:id', async ({ request, params }) => {
    const body = await request.json()
    const { name } = body

    if (Math.random() < 0.5) {
      return HttpResponse.json(
        { error: 'Oh no, there was an error' },
        { status: 500 },
      )
    }

    const id = Array.isArray(params.id) ? params.id[0] : params.id

    const post = db.post.update({
      where: { id: { equals: id } },
      data: { name },
    })
    await delay(400)

    return HttpResponse.json(post)
  }),
  ...db.post.toHandlers('rest'),
] as const
