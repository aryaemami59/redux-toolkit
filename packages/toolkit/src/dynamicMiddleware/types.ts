import { GetDispatch, GetState } from '@internal/createAsyncThunk'
import type { Dispatch, Middleware, MiddlewareAPI, UnknownAction } from 'redux'
import type { BaseActionCreator, PayloadAction } from '../createAction'
import type { ExtractDispatchExtensions } from '../tsHelpers'

export type { GetDispatch, GetState } from '@internal/createAsyncThunk'

export type GetMiddlewareApi<MiddlewareApiConfig> = MiddlewareAPI<
  GetDispatch<MiddlewareApiConfig>,
  GetState<MiddlewareApiConfig>
>

export type MiddlewareApiConfig = {
  state?: unknown
  dispatch?: Dispatch
}

// TODO: consolidate with cAT helpers?
// export type GetState<MiddlewareApiConfig> = MiddlewareApiConfig extends {
//   state: infer State
// }
//   ? State
//   : unknown

// export type GetDispatch<MiddlewareApiConfig> = MiddlewareApiConfig extends {
//   dispatch: infer Dispatch
// }
//   ? FallbackIfUnknown<Dispatch, Dispatch>
//   : Dispatch

export type AddMiddleware<
  State = any,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> = {
  (...middlewares: Middleware<any, State, DispatchType>[]): void
  withTypes<MiddlewareConfig extends MiddlewareApiConfig>(): AddMiddleware<
    GetState<MiddlewareConfig>,
    GetDispatch<MiddlewareConfig>
  >
}

export interface WithMiddleware<
  State = any,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> extends BaseActionCreator<
    Middleware<any, State, DispatchType>[],
    'dynamicMiddleware/add',
    { instanceId: string }
  > {
  <Middlewares extends Middleware<any, State, DispatchType>[]>(
    ...middlewares: Middlewares
  ): PayloadAction<Middlewares, 'dynamicMiddleware/add', { instanceId: string }>
  withTypes<MiddlewareConfig extends MiddlewareApiConfig>(): WithMiddleware<
    GetState<MiddlewareConfig>,
    GetDispatch<MiddlewareConfig>
  >
}

export interface DynamicDispatch {
  // return a version of dispatch that knows about middleware
  <Middlewares extends Middleware<any>[]>(
    action: PayloadAction<Middlewares, 'dynamicMiddleware/add'>,
  ): ExtractDispatchExtensions<Middlewares> & this
}

export type MiddlewareEntry<
  State = unknown,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> = {
  id: string
  middleware: Middleware<any, State, DispatchType>
  applied: Map<
    MiddlewareAPI<DispatchType, State>,
    ReturnType<Middleware<any, State, DispatchType>>
  >
}

export type DynamicMiddleware<
  State = unknown,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> = Middleware<DynamicDispatch, State, DispatchType>

export type DynamicMiddlewareInstance<
  State = unknown,
  DispatchType extends Dispatch<UnknownAction> = Dispatch<UnknownAction>,
> = {
  middleware: DynamicMiddleware<State, DispatchType>
  addMiddleware: AddMiddleware<State, DispatchType>
  withMiddleware: WithMiddleware<State, DispatchType>
  instanceId: string
}
