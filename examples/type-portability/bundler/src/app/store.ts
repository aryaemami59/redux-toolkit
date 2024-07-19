import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { authSlice } from '../features/auth/authSlice'
import { pollingSlice } from '../features/polling/pollingSlice'
import { apiSlice } from './services/api'

export const rootReducer = combineSlices(pollingSlice, authSlice, apiSlice)

export const { inject, selector, withLazyLoadedSlices } = rootReducer

export const { original } = selector

export type RootState = ReturnType<typeof rootReducer>

export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState,
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers(),
  })

export const store = setupStore()

export const { dispatch, getState, replaceReducer, subscribe } = store

export type AppStore = typeof store
export type AppDispatch = typeof store.dispatch