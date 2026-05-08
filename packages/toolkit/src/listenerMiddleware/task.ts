import { TaskAbortError } from './exceptions'
import type { TaskResult } from './types'
import { addAbortSignalListener, catchRejection, noop } from './utils'

/**
 * Synchronously raises a {@linkcode TaskAbortError} if the task tied to the
 * input `signal` has been cancelled.
 *
 * @param signal - The {@linkcode AbortSignal} tied to the task to validate.
 * @throws A {@linkcode TaskAbortError} if the task tied to the input `signal` has been cancelled.
 *
 * @see {@linkcode TaskAbortError}
 */
export const validateActive = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw new TaskAbortError(signal.reason)
  }
}

/**
 * Generates a race between the promise(s) and the {@linkcode AbortSignal}. This
 * avoids {@linkcode Promise.race}-related memory leaks:
 * {@link https://github.com/nodejs/node/issues/17469#issuecomment-349794909}.
 */
export function raceWithSignal<T>(
  signal: AbortSignal,
  promise: Promise<T>,
): Promise<T> {
  let cleanup = noop
  return new Promise<T>((resolve, reject) => {
    const notifyRejection = () => reject(new TaskAbortError(signal.reason))

    if (signal.aborted) {
      notifyRejection()
      return
    }

    cleanup = addAbortSignalListener(signal, notifyRejection)
    promise.finally(() => cleanup()).then(resolve, reject)
  }).finally(() => {
    // after this point, replace `cleanup` with a noop, so there is no reference to `signal` any more
    cleanup = noop
  })
}

/**
 * Runs a task and returns a {@linkcode Promise | promise} that resolves to a
 * {@linkcode TaskResult}. Second argument is an optional `cleanUp` function
 * that always runs after task.
 *
 * **Note:** `runTask` runs the executor in the next microtask.
 *
 * @returns A {@linkcode Promise | promise} that resolves to the {@linkcode TaskResult} of the task.
 */
export const runTask = async <T>(
  task: () => Promise<T>,
  cleanUp?: () => void,
): Promise<TaskResult<T>> => {
  try {
    await Promise.resolve()
    const value = await task()
    return {
      status: 'ok',
      value,
    }
  } catch (error: any) {
    return {
      status: error instanceof TaskAbortError ? 'cancelled' : 'rejected',
      error,
    }
  } finally {
    cleanUp?.()
  }
}

/**
 * Given an input {@linkcode AbortSignal} and a promise returns another promise
 * that resolves as soon the input promise is provided or rejects as soon as
 * {@linkcode AbortSignal.abort} is `true`.
 *
 * @param signal - The {@linkcode AbortSignal} used to cancel the returned promise.
 * @returns A function that races the supplied promise against the `signal`.
 */
export const createPause = <T>(signal: AbortSignal) => {
  return (promise: Promise<T>): Promise<T> => {
    return catchRejection(
      raceWithSignal(signal, promise).then((output) => {
        validateActive(signal)
        return output
      }),
    )
  }
}

/**
 * Given an input {@linkcode AbortSignal} and `timeoutMs` returns a promise that
 * resolves after `timeoutMs` or rejects as soon as
 * {@linkcode AbortSignal.abort} is `true`.
 *
 * @param signal - The {@linkcode AbortSignal} used to cancel the returned delay.
 * @returns A function that resolves after the given `timeoutMs`, unless aborted first.
 */
export const createDelay = (signal: AbortSignal) => {
  const pause = createPause<void>(signal)
  return (timeoutMs: number): Promise<void> => {
    return pause(new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)))
  }
}
