import type { CreateApi } from '../createApi'
import { buildCreateApi } from '../createApi'
import type { CoreModule } from './module'
import { coreModule, coreModuleName } from './module'

const createApi: CreateApi<CoreModule> = buildCreateApi(coreModule())

export { coreModule, coreModuleName, createApi }
