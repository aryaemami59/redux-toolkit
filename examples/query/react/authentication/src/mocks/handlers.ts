import { http, HttpResponse } from 'msw'
import { nanoid } from '@reduxjs/toolkit'
import { headersToObject } from 'headers-polyfill'

const token = nanoid()

export const handlers = [
  http.get('/protected', ({ request }) => {
    const headers = headersToObject(request.headers)
    if (headers.authorization !== `Bearer ${token}`) {
      return HttpResponse.json(
        {
          message: 'You shall not pass. Please login first.',
        },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      message:
        'Join us on the Reactiflux Discord server in #redux if you have any questions.',
    })
  }),
  http.post('/login', () => {
    return HttpResponse.json({
      user: {
        first_name: 'Test',
        last_name: 'User',
      },
      token,
    })
  }),
]
