
export interface HttpIntercept {
  requestIntercept?: (request: RequestOptions) => Promise<RequestOptions>;
  responseIntercept?: (res: any) => Promise<any>;
}

export interface HttpResponse extends Response {  
  data: any;
}

export interface RequesterFunc {
  (input: RequestInfo, opt?: RequestOptions): Promise<HttpResponse>
}

export interface RequestOptions {
  baseUr: string;
  reqData: any;
  auto: boolean;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'DELETE';
  headers: any;
  extract: any;
}

export interface HttpState {
  ready: boolean;
  pending: boolean;
  refreshing: boolean;
  success: boolean;
  failed: boolean;
  name: 'ready' | 'pending' | 'refreshing' | 'success' | 'failed';
}

export type RequestStatus = 'ready' | 'pending' | 'failed' | 'success';

export const HTTP_INTERCEPT = Symbol('供useHttp使用的请求拦截器');
export const CUSTOME_REQUEST = Symbol('自定义请求函数，以覆盖默认的fetch函数');