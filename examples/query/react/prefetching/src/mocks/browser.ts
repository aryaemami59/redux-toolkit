import { handlers } from './db'
import { setupWorker } from 'msw/browser'

export const worker = setupWorker(...(handlers as any))
