import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Post {
  id: string
  name: string
}

type PostsResponse = Post[]

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Post'],
  endpoints: (build) => ({
    getPosts: build.query<PostsResponse, void>({
      query: () => 'posts',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    addPost: build.mutation<Post, Partial<Post>>({
      query: (body) => ({
        url: `posts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    getPost: build.query<Post, string>({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    updatePost: build.mutation<void, Pick<Post, 'id'> & Partial<Post>>({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
    deletePost: build.mutation<{ success: boolean; id: number }, number>({
      query(id) {
        return {
          url: `posts/${id}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
  }),
})

export const {
  useGetPostQuery,
  useGetPostsQuery,
  useAddPostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  endpoints,
  enhanceEndpoints,
  usePrefetch,
  injectEndpoints,
  internalActions,
  middleware,
  reducerPath,
  reducer,
  util,
  useLazyGetPostQuery,
  useLazyGetPostsQuery,
} = api

export const { addPost, deletePost, getPost, getPosts, updatePost } = endpoints

export const {
  Types,
  initiate,
  matchFulfilled,
  matchPending,
  matchRejected,
  name,
  select,
  useMutation,
} = addPost

export const {
  Types: _Types,
  initiate: _initiate,
  matchFulfilled: _matchFulfilled,
  matchPending: _matchPending,
  matchRejected: _matchRejected,
  name: _name,
  select: _select,
  useMutation: _useMutation,
} = deletePost

export const {
  Types: ___Types,
  initiate: ___initiate,
  matchFulfilled: ___matchFulfilled,
  matchPending: ___matchPending,
  matchRejected: ___matchRejected,
  name: ___name,
  select: ___select,
  useQueryState: ___useQueryState,
  useLazyQuery: ___useLazyQuery,
  useLazyQuerySubscription: ___useLazyQuerySubscription,
  useQuery: ___useQuery,
  useQuerySubscription: ___useQuerySubscription,
} = getPost

export const {
  Types: _____Types,
  initiate: _____initiate,
  matchFulfilled: _____matchFulfilled,
  matchPending: _____matchPending,
  matchRejected: _____matchRejected,
  name: _____name,
  select: _____select,
  useMutation: _____useMutation,
} = updatePost

export const {
  internal_getRTKQSubscriptions,
  middlewareRegistered,
  onFocus,
  onFocusLost,
  onOffline,
  onOnline,
  queryResultPatched,
  removeMutationResult,
  removeQueryResult,
  resetApiState: _resetApiState,
  subscriptionsUpdated,
  unsubscribeQueryResult,
  updateProvidedBy,
  updateSubscriptionOptions,
} = internalActions

export const {
  getRunningMutationThunk,
  getRunningMutationsThunk,
  getRunningQueriesThunk,
  getRunningQueryThunk,
  invalidateTags,
  patchQueryData,
  prefetch,
  resetApiState,
  selectCachedArgsForQuery,
  selectInvalidatedBy,
  updateQueryData,
  upsertQueryData,
} = util
