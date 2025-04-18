import { configureStore, isAllOf } from '@reduxjs/toolkit'
import { createApi } from '@reduxjs/toolkit/query/react'
import { renderHook, waitFor } from '@testing-library/react'
import { actionsReducer, withProvider } from '../../tests/utils/helpers'
import type { BaseQueryApi } from '../baseQueryTypes'

test('handles a non-async baseQuery without error', async () => {
  const baseQuery = (args?: any) => ({ data: args })
  const api = createApi({
    baseQuery,
    endpoints: (build) => ({
      getUser: build.query<unknown, number>({
        query(id) {
          return { url: `user/${id}` }
        },
      }),
    }),
  })
  const { getUser } = api.endpoints
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (gDM) => gDM().concat(api.middleware),
  })

  const promise = store.dispatch(getUser.initiate(1))
  const { data } = await promise

  expect(data).toEqual({
    url: 'user/1',
  })

  const storeResult = getUser.select(1)(store.getState())
  expect(storeResult).toEqual({
    data: {
      url: 'user/1',
    },
    endpointName: 'getUser',
    isError: false,
    isLoading: false,
    isSuccess: true,
    isUninitialized: false,
    originalArgs: 1,
    requestId: expect.any(String),
    status: 'fulfilled',
    startedTimeStamp: expect.any(Number),
    fulfilledTimeStamp: expect.any(Number),
  })
})

test('passes the extraArgument property to the baseQueryApi', async () => {
  const baseQuery = (_args: any, api: BaseQueryApi) => ({ data: api.extra })
  const api = createApi({
    baseQuery,
    endpoints: (build) => ({
      getUser: build.query<unknown, void>({
        query: () => '',
      }),
    }),
  })
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (gDM) =>
      gDM({ thunk: { extraArgument: 'cakes' } }).concat(api.middleware),
  })
  const { getUser } = api.endpoints
  const { data } = await store.dispatch(getUser.initiate())
  expect(data).toBe('cakes')
})

describe('re-triggering behavior on arg change', () => {
  const api = createApi({
    baseQuery: () => ({ data: null }),
    endpoints: (build) => ({
      getUser: build.query<any, any>({
        query: (obj) => obj,
      }),
    }),
  })
  const { getUser } = api.endpoints
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (gDM) => gDM().concat(api.middleware),
  })

  const spy = vi.spyOn(getUser, 'initiate')
  beforeEach(() => void spy.mockClear())

  test('re-trigger on literal value change', async () => {
    const { result, rerender } = renderHook(
      (props) => getUser.useQuery(props),
      {
        wrapper: withProvider(store),
        initialProps: 5,
      },
    )

    await waitFor(() => {
      expect(result.current.status).not.toBe('pending')
    })

    expect(spy).toHaveBeenCalledOnce()

    for (let x = 1; x < 3; x++) {
      rerender(6)
      await waitFor(() => {
        expect(result.current.status).not.toBe('pending')
      })
      expect(spy).toHaveBeenCalledTimes(2)
    }

    for (let x = 1; x < 3; x++) {
      rerender(7)
      await waitFor(() => {
        expect(result.current.status).not.toBe('pending')
      })
      expect(spy).toHaveBeenCalledTimes(3)
    }
  })

  test('only re-trigger on shallow-equal arg change', async () => {
    const { result, rerender } = renderHook(
      (props) => getUser.useQuery(props),
      {
        wrapper: withProvider(store),
        initialProps: { name: 'Bob', likes: 'iceCream' },
      },
    )

    await waitFor(() => {
      expect(result.current.status).not.toBe('pending')
    })
    expect(spy).toHaveBeenCalledOnce()

    for (let x = 1; x < 3; x++) {
      rerender({ name: 'Bob', likes: 'waffles' })
      await waitFor(() => {
        expect(result.current.status).not.toBe('pending')
      })
      expect(spy).toHaveBeenCalledTimes(2)
    }

    for (let x = 1; x < 3; x++) {
      rerender({ name: 'Alice', likes: 'waffles' })
      await waitFor(() => {
        expect(result.current.status).not.toBe('pending')
      })
      expect(spy).toHaveBeenCalledTimes(3)
    }
  })

  test('re-triggers every time on deeper value changes', async () => {
    const name = 'Tim'

    const { result, rerender } = renderHook(
      (props) => getUser.useQuery(props),
      {
        wrapper: withProvider(store),
        initialProps: { person: { name } },
      },
    )

    await waitFor(() => {
      expect(result.current.status).not.toBe('pending')
    })
    expect(spy).toHaveBeenCalledOnce()

    for (let x = 1; x < 3; x++) {
      rerender({ person: { name: name + x } })
      await waitFor(() => {
        expect(result.current.status).not.toBe('pending')
      })
      expect(spy).toHaveBeenCalledTimes(x + 1)
    }
  })

  test('do not re-trigger if the order of keys change while maintaining the same values', async () => {
    const { result, rerender } = renderHook(
      (props) => getUser.useQuery(props),
      {
        wrapper: withProvider(store),
        initialProps: { name: 'Tim', likes: 'Bananas' },
      },
    )

    await waitFor(() => {
      expect(result.current.status).not.toBe('pending')
    })
    expect(spy).toHaveBeenCalledOnce()

    for (let x = 1; x < 3; x++) {
      rerender({ likes: 'Bananas', name: 'Tim' })
      await waitFor(() => {
        expect(result.current.status).not.toBe('pending')
      })
      expect(spy).toHaveBeenCalledOnce()
    }
  })
})

describe('prefetch', () => {
  const baseQuery = () => ({ data: null })
  const api = createApi({
    baseQuery,
    endpoints: (build) => ({
      getUser: build.query<any, any>({
        query: (obj) => obj,
      }),
    }),
  })

  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer, ...actionsReducer },
    middleware: (gDM) => gDM().concat(api.middleware),
  })
  it('should attach isPrefetch if prefetching', async () => {
    store.dispatch(api.util.prefetch('getUser', 1, {}))

    await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()))

    const isPrefetch = (
      action: any,
    ): action is { meta: { arg: { isPrefetch: true } } } =>
      action?.meta?.arg?.isPrefetch

    expect(store.getState().actions).toMatchSequence(
      api.internalActions.middlewareRegistered.match,
      isAllOf(api.endpoints.getUser.matchPending, isPrefetch),
      isAllOf(api.endpoints.getUser.matchFulfilled, isPrefetch),
    )

    // compare against a regular initiate call
    await store.dispatch(
      api.endpoints.getUser.initiate(1, { forceRefetch: true }),
    )

    const isNotPrefetch = (action: any): action is unknown =>
      !isPrefetch(action)

    expect(store.getState().actions).toMatchSequence(
      api.internalActions.middlewareRegistered.match,
      isAllOf(api.endpoints.getUser.matchPending, isPrefetch),
      isAllOf(api.endpoints.getUser.matchFulfilled, isPrefetch),
      isAllOf(api.endpoints.getUser.matchPending, isNotPrefetch),
      isAllOf(api.endpoints.getUser.matchFulfilled, isNotPrefetch),
    )
  })
})
