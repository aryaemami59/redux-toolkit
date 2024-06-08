import type {
  Action as ReduxAction,
  UnknownAction,
  Dispatch,
  Middleware,
} from 'redux'
import type { TSHelpersExtractDispatchExtensions } from '@reduxjs/toolkit'
import { createDynamicMiddleware as cDM } from '@reduxjs/toolkit'
import type { ReactReduxContextValue } from 'react-redux'
import {
  ReactReduxContext,
  useDispatch as useDefaultDispatch,
  createDispatchHook,
} from 'react-redux'
import type { Context } from 'react'
import type {
  DynamicMiddlewareInstance,
  GetDispatch,
  GetState,
  MiddlewareApiConfig,
} from '@reduxjs/toolkit'

export type UseDispatchWithMiddlewareHook<
  Middlewares extends Middleware<any, State, DispatchType>[] = [],
  State = any,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> = () => TSHelpersExtractDispatchExtensions<Middlewares> & DispatchType

export type CreateDispatchWithMiddlewareHook<
  State = any,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> = {
  <
    Middlewares extends [
      Middleware<any, State, DispatchType>,
      ...Middleware<any, State, DispatchType>[],
    ],
  >(
    ...middlewares: Middlewares
  ): UseDispatchWithMiddlewareHook<Middlewares, State, DispatchType>
  withTypes<
    MiddlewareConfig extends MiddlewareApiConfig,
  >(): CreateDispatchWithMiddlewareHook<
    GetState<MiddlewareConfig>,
    GetDispatch<MiddlewareConfig>
  >
}

type ActionFromDispatch<DispatchType extends Dispatch<ReduxAction>> =
  DispatchType extends Dispatch<infer Action> ? Action : never

interface ReactDynamicMiddlewareInstance<
  State = any,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> extends DynamicMiddlewareInstance<State, DispatchType> {
  createDispatchWithMiddlewareHookFactory: (
    context?: Context<ReactReduxContextValue<
      State,
      ActionFromDispatch<DispatchType>
    > | null>,
  ) => CreateDispatchWithMiddlewareHook<State, DispatchType>
  createDispatchWithMiddlewareHook: CreateDispatchWithMiddlewareHook<
    State,
    DispatchType
  >
}

export const createDynamicMiddleware = <
  State = any,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
>(): ReactDynamicMiddlewareInstance<State, DispatchType> => {
  const instance = cDM<State, DispatchType>()
  const createDispatchWithMiddlewareHookFactory = (
    // @ts-ignore
    context: Context<ReactReduxContextValue<
      State,
      ActionFromDispatch<DispatchType>
    > | null> = ReactReduxContext,
  ) => {
    const useDispatch =
      context === ReactReduxContext
        ? useDefaultDispatch
        : createDispatchHook(context)
    function createDispatchWithMiddlewareHook<
      Middlewares extends Middleware<any, State, DispatchType>[],
    >(...middlewares: Middlewares) {
      instance.addMiddleware(...middlewares)
      return useDispatch
    }
    createDispatchWithMiddlewareHook.withTypes = () =>
      createDispatchWithMiddlewareHook
    return createDispatchWithMiddlewareHook as CreateDispatchWithMiddlewareHook<
      State,
      DispatchType
    >
  }

  const createDispatchWithMiddlewareHook =
    createDispatchWithMiddlewareHookFactory()

  return {
    ...instance,
    createDispatchWithMiddlewareHookFactory,
    createDispatchWithMiddlewareHook,
  }
}
