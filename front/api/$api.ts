import type { AspidaClient } from 'aspida'
import { dataToURLString } from 'aspida'
import type { Methods as Methods0 } from './v1/conditions'
import type { Methods as Methods1 } from './v1/device'
import type { Methods as Methods2 } from './v1/device/conditions'

const api = <T>({ baseURL, fetch }: AspidaClient<T>) => {
  const prefix = (baseURL === undefined ? '' : baseURL).replace(/\/$/, '')
  const PATH0 = '/v1/conditions'
  const PATH1 = '/v1/device'
  const PATH2 = '/v1/device/conditions'
  const GET = 'GET'
  const POST = 'POST'

  return {
    v1: {
      conditions: {
        post: (option: { body: Methods0['post']['reqBody'], config?: T | undefined }) =>
          fetch<Methods0['post']['resBody']>(prefix, PATH0, POST, option).json(),
        $post: (option: { body: Methods0['post']['reqBody'], config?: T | undefined }) =>
          fetch<Methods0['post']['resBody']>(prefix, PATH0, POST, option).json().then(r => r.body),
        $path: () => `${prefix}${PATH0}`
      },
      device: {
        conditions: {
          get: (option: { query: Methods2['get']['query'], config?: T | undefined }) =>
            fetch<Methods2['get']['resBody']>(prefix, PATH2, GET, option).json(),
          $get: (option: { query: Methods2['get']['query'], config?: T | undefined }) =>
            fetch<Methods2['get']['resBody']>(prefix, PATH2, GET, option).json().then(r => r.body),
          $path: (option?: { method?: 'get' | undefined; query: Methods2['get']['query'] } | undefined) =>
            `${prefix}${PATH2}${option && option.query ? `?${dataToURLString(option.query)}` : ''}`
        },
        get: (option: { query: Methods1['get']['query'], config?: T | undefined }) =>
          fetch<Methods1['get']['resBody']>(prefix, PATH1, GET, option).json(),
        $get: (option: { query: Methods1['get']['query'], config?: T | undefined }) =>
          fetch<Methods1['get']['resBody']>(prefix, PATH1, GET, option).json().then(r => r.body),
        $path: (option?: { method?: 'get' | undefined; query: Methods1['get']['query'] } | undefined) =>
          `${prefix}${PATH1}${option && option.query ? `?${dataToURLString(option.query)}` : ''}`
      }
    }
  }
}

export type ApiInstance = ReturnType<typeof api>
export default api
