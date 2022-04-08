// export type Method = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
// export const HTTP_METHODS: readonly Method[] = ['all', 'get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

export enum HTTP_METHOD {
  ALL = 'all',
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  OPTIONS = 'options',
  HEAD = 'head',
  TRACE = 'trace',
}
