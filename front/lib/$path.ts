/* eslint-disable */
// prettier-ignore
export const pagesPath = {
  conditions: {
    $url: (url?: { hash?: string }) => ({ pathname: '/conditions' as const, hash: url?.hash })
  },
  $url: (url?: { hash?: string }) => ({ pathname: '/' as const, hash: url?.hash })
}

// prettier-ignore
export type PagesPath = typeof pagesPath
