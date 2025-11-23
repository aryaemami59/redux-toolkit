import type { ActionCreatorInvariantMiddlewareOptions } from './actionCreatorInvariantMiddleware'
import { createActionCreatorInvariantMiddleware } from './actionCreatorInvariantMiddleware'
import type { ImmutableStateInvariantMiddlewareOptions } from './immutableStateInvariantMiddleware'
import { createImmutableStateInvariantMiddleware } from './immutableStateInvariantMiddleware'
import type { Middleware, UnknownAction } from './reduxImports'
import type { ThunkMiddleware } from './reduxThunkImports'
import {
  thunk as thunkMiddleware,
  withExtraArgument,
} from './reduxThunkImports'
import type { SerializableStateInvariantMiddlewareOptions } from './serializableStateInvariantMiddleware'
import { createSerializableStateInvariantMiddleware } from './serializableStateInvariantMiddleware'
import type { ExcludeFromTuple } from './tsHelpers'
import { Tuple } from './utils'

function isBoolean(x: any): x is boolean {
  return typeof x === 'boolean'
}

type ThunkOptions<ExtraArgumentType = any> = {
  extraArgument: ExtraArgumentType
}

interface GetDefaultMiddlewareOptions {
  thunk?: boolean | ThunkOptions
  immutableCheck?: boolean | ImmutableStateInvariantMiddlewareOptions
  serializableCheck?: boolean | SerializableStateInvariantMiddlewareOptions
  actionCreatorCheck?: boolean | ActionCreatorInvariantMiddlewareOptions
}

export type ThunkMiddlewareFor<
  StateType,
  DefaultMiddlewareOptionsType extends GetDefaultMiddlewareOptions = {},
> = DefaultMiddlewareOptionsType extends {
  thunk: false
}
  ? never
  : DefaultMiddlewareOptionsType extends {
        thunk: { extraArgument: infer InferredExtraArgumentType }
      }
    ? ThunkMiddleware<StateType, UnknownAction, InferredExtraArgumentType>
    : ThunkMiddleware<StateType, UnknownAction>

export type GetDefaultMiddleware<StateType = any> = <
  DefaultMiddlewareOptionsType extends GetDefaultMiddlewareOptions = {
    thunk: true
    immutableCheck: true
    serializableCheck: true
    actionCreatorCheck: true
  },
>(
  options?: DefaultMiddlewareOptionsType,
) => Tuple<
  ExcludeFromTuple<
    [ThunkMiddlewareFor<StateType, DefaultMiddlewareOptionsType>],
    never
  >
>

export const buildGetDefaultMiddleware = <
  StateType = any,
>(): GetDefaultMiddleware<StateType> =>
  function getDefaultMiddleware(options) {
    const {
      thunk = true,
      immutableCheck = true,
      serializableCheck = true,
      actionCreatorCheck = true,
    } = options ?? {}

    const middlewareArray = new Tuple<Middleware[]>()

    if (thunk) {
      if (isBoolean(thunk)) {
        middlewareArray.push(thunkMiddleware)
      } else {
        middlewareArray.push(withExtraArgument(thunk.extraArgument))
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (immutableCheck) {
        let immutableOptions: ImmutableStateInvariantMiddlewareOptions = {}

        if (!isBoolean(immutableCheck)) {
          immutableOptions = immutableCheck
        }

        middlewareArray.unshift(
          createImmutableStateInvariantMiddleware(immutableOptions),
        )
      }

      if (serializableCheck) {
        let serializableOptions: SerializableStateInvariantMiddlewareOptions =
          {}

        if (!isBoolean(serializableCheck)) {
          serializableOptions = serializableCheck
        }

        middlewareArray.push(
          createSerializableStateInvariantMiddleware(serializableOptions),
        )
      }
      if (actionCreatorCheck) {
        let actionCreatorOptions: ActionCreatorInvariantMiddlewareOptions = {}

        if (!isBoolean(actionCreatorCheck)) {
          actionCreatorOptions = actionCreatorCheck
        }

        middlewareArray.unshift(
          createActionCreatorInvariantMiddleware(actionCreatorOptions),
        )
      }
    }

    return middlewareArray as any
  }
