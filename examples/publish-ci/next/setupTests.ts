import { loadEnvConfig } from '@next/env'
import '@testing-library/jest-dom'

loadEnvConfig(__dirname, true, { info: () => null, error: console.error })
