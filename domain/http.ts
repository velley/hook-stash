
export interface HttpIntercept {
  requestIntercept?: (request: RequestOptions) => Promise<RequestOptions>;
  responseIntercept?: (res: any) => Promise<any>;
}

export interface HttpResponse extends Response {  
  data: any;
}

export interface RequesterFunc {
  (input: RequestInfo, init?: RequestOptions): Promise<HttpResponse>
}

export interface RequestOptions<B = any> {
  baseUr?: string;
  path: string;
  reqData: B;
  auto: boolean;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'DELETE';
  headers: any;
}

export type RequestStatus = 'ready' | 'pending' | 'failed' | 'success';

export const HTTP_INTERCEPT = Symbol('供useHttp使用的请求拦截器');