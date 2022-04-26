
/** http拦截器函数 */
export interface HttpIntercept {
  /** http请求拦截器 */
  requestIntercept?: (request: RequestOptions) => Promise<RequestOptions>;
  /** http响应拦截器 */
  responseIntercept?: (res: any) => Promise<any>;
}

/** 自定义http请求函数 */
export interface RequesterFunc {
  (input: string, opt?: RequestOptions): Promise<Record<string, any>>;
}

/** 请求配置项 */
export interface RequestOptions {
  url: string;
  reqData: any;
  auto: boolean;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'DELETE';
  headers: any;
  [prop: string]: any;
}

/** http请求状态 */
export type HttpState = 'ready' | 'pending' | 'refreshing' | 'success' | 'failed';

/** HTTP拦截器token */
export const HTTP_INTERCEPT = Symbol('供useHttp使用的请求拦截器');

/** 自定义HTTP函数token */
export const CUSTOME_REQUEST = Symbol('自定义请求函数，以覆盖默认的fetch函数');

/** Paging分页请求配置 */
export interface PagingSetting<T = any> {
  start: 0 | 1;
  size: number;
  sizeKey: string;
  indexKey: string;
  method: 'GET' | 'POST';
  scrollLoading: boolean;
  dataPlucker: (res: any) => T[];
  totalPlucker: (res: any) => number;
}

/** 分页请求状态） */
export type PagingState = 'empty' | 'unfulled' | 'fulled' | 'refreshing' | 'loading';

/** Paging分页请求token */
export const PAGING_SETTING = Symbol('提供全局分页配置');