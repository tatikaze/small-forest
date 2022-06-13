import type { AspidaClient } from 'aspida'
import { dataToURLString } from 'aspida'
import type { Methods as Methods0 } from './v1/_device@string/conditions'
import type { Methods as Methods1 } from './v1/conditions'

const api = <T>({ baseURL, fetch }: AspidaClient<T>) => {
  const prefix = (baseURL === undefined ? '' : baseURL).replace(/\/$/, '')
  const PATH0 = '/v1'
  const PATH1 = '/conditions'
  const PATH2 = '/v1/conditions'
  const GET = 'GET'
  const POST = 'POST'

  return {
    v1: {
      _device: (val1: string) => {
        const prefix1 = `${PATH0}/${val1}`

        return {
          conditions: {
            get: (option: { query: Methods0['get']['query'], config?: T | undefined }) =>
              fetch<Methods0['get']['resBody']>(prefix, `${prefix1}${PATH1}`, GET, option).json(),
            $get: (option: { query: Methods0['get']['query'], config?: T | undefined }) =>
              fetch<Methods0['get']['resBody']>(prefix, `${prefix1}${PATH1}`, GET, option).json().then(r => r.body),
            $path: (option?: { method?: 'get' | undefined; query: Methods0['get']['query'] } | undefined) =>
              `${prefix}${prefix1}${PATH1}${option && option.query ? `?${dataToURLString(option.query)}` : ''}`
          }
        }
      },
      conditions: {
        post: (option: { body: Methods1['post']['reqBody'], config?: T | undefined }) =>
          fetch<Methods1['post']['resBody']>(prefix, PATH2, POST, option).json(),
        $post: (option: { body: Methods1['post']['reqBody'], config?: T | undefined }) =>
          fetch<Methods1['post']['resBody']>(prefix, PATH2, POST, option).json().then(r => r.body),
        $path: () => `${prefix}${PATH2}`
      }
    }
  }
}

export type ApiInstance = ReturnType<typeof api>
export default api
