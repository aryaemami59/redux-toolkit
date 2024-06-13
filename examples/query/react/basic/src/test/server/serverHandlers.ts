import { http, HttpResponse } from 'msw'

const handlers = [
  http.get('https://pokeapi.co/api/v2/pokemon/bulbasaur', () => {
    const mockApiResponse = {
      species: {
        name: 'bulbasaur',
      },
      sprites: {
        front_shiny:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png',
      },
    }
    return HttpResponse.json(mockApiResponse)
  }),
]

export { handlers }
