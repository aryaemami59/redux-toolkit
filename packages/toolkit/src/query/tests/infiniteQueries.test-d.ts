import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setupApiStore } from '../../tests/utils/helpers'

describe('Infinite queries', () => {
  test('Basic infinite query behavior', async () => {
    type Pokemon = {
      id: string
      name: string
    }

    type PokemonQueryArg = {
      type: string
      page: number
    }

    const pokemonApi = createApi({
      baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
      endpoints: (builder) => ({
        // GOAL: Specify both the query arg (for cache key serialization)
        // and the page param type (for feeding into the query URL)
        getInfinitePokemon: builder.infiniteQuery<Pokemon[], string, number>({
          infiniteQueryOptions: {
            getNextPageParam: (
              lastPage,
              allPages,
              // ✅Currently: page param type is `number`
              lastPageParam,
              allPageParams,
            ) => {
              expectTypeOf(lastPage).toEqualTypeOf<Pokemon[]>()

              expectTypeOf(allPages).toEqualTypeOf<Pokemon[][]>()

              expectTypeOf(lastPageParam).toBeNumber()

              expectTypeOf(allPageParams).toEqualTypeOf<number[]>()

              return lastPageParam + 1
            },
          },
          // ❌ This seems to be controlled by `BaseEndpointDefinition`
          // GOAL: should be `pageParam: number`
          query(pageParam) {
            expectTypeOf(pageParam).toBeNumber()

            return `https://example.com/listItems?page=${pageParam}`
          },
        }),
      }),
    })

    const storeRef = setupApiStore(pokemonApi, undefined, {
      withoutTestLifecycles: true,
    })

    expectTypeOf(pokemonApi.endpoints.getInfinitePokemon.initiate)
      .parameter(0)
      .toBeString()

    const res = storeRef.store.dispatch(
      // ❌ This seems to be controlled by `BaseEndpointDefinition`.
      // GOAL: should be `arg: string`
      pokemonApi.endpoints.getInfinitePokemon.initiate('fire', {}),
    )

    const firstResult = await res

    storeRef.store.dispatch(
      pokemonApi.endpoints.getInfinitePokemon.initiate('fire', {
        direction: 'forward',
        data: firstResult.data,
      }),
    )
  })
})
