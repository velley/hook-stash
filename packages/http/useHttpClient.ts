import { useRef } from "react";
import { CUSTOME_REQUEST, HttpIntercept, HttpState, HTTP_INTERCEPT, RequesterFunc, RequestOptions } from "../../domain/http";
import { useReady } from "../common/useReady";
import { useSignal } from "../core/signal/useSignal";
import { useInjector } from "../core/di/useInjector";

const DEFAULT_HTTP_OPTIONS: Partial<RequestOptions> = {
  auto: false,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  reqData: {}
};

/**
 * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入方式提供自定义请求方法
 * @param url 请求地址，必传
 * @param localOptions 请求配置项 选传
 * @returns  [请求结果, 请求方法, 请求状态, 错误信息]
 */
export function useHttpClient<T>(
  url: string, localOptions: Partial<RequestOptions> = {}
) {
  /** 设置请求配置以及上层组件注入进来的配置项 */
  const options       = { ...DEFAULT_HTTP_OPTIONS, ...localOptions, url } as RequestOptions;
  const intercept     = useInjector<HttpIntercept>(HTTP_INTERCEPT, {optional: true});
  const customeReq    = useInjector<{req: RequesterFunc}>(CUSTOME_REQUEST, {optional: true});

  /** 定义http请求的相关状态变量 */
  const [res, setRes]        = useSignal<T>(options.defaultValue as T);
  const [err, setErr]        = useSignal<Error | null>(null);
  const [state, setState]    = useSignal<HttpState>('ready');  

  const request =  useRef(
    (query: any = {}) => {
      setState('pending');
      setErr(null);
      return new Promise<RequestOptions>(resolve => {
        if(intercept?.requestIntercept) {        
          intercept.requestIntercept({ ...options, reqData: query }).then(finalOptions => resolve(finalOptions))
        } else {
          resolve({ ...options, reqData: query })
        } 
      })
      .then(options2 => {
        const method = normalizeMethod(options2.method);
        const normalizedOptions = { ...options2, method };
        const reqData = normalizedOptions.reqData;
        if(customeReq) {
          return customeReq.req(normalizedOptions.url, normalizedOptions)
        } else {
          const {
            url: requestUrl,
            reqData: _reqData,
            auto: _auto,
            defaultValue: _defaultValue,
            ...fetchOptions
          } = normalizedOptions;
          let finalUrl = requestUrl;

          if(['GET', 'HEAD'].includes(method)) {
            const search = objectToUrlSearch(reqData);
            if(search) {
              finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${search}`;
            }
            delete fetchOptions.body;
          } else {
            if(reqData instanceof FormData) {
              fetchOptions.body = reqData;
              fetchOptions.headers = withoutJsonContentType(fetchOptions.headers);
            } else {
              fetchOptions.body = JSON.stringify(reqData);
            }
          }
          return fetch(finalUrl, fetchOptions)
        }
      })
      .then(response => {
        const res = response;
        const resIntercept = intercept?.responseIntercept
        if(customeReq) {
          return resIntercept ? resIntercept(res) : res;
        } else {
          return parseResponse(res).then((re: any) => resIntercept ? resIntercept(re) : re)
        }
      })
      .then(res => {
        setRes(res);
        setState('success');
        return res as T;
      })
      .catch(err => {      
        setState('failed');
        setErr(err);
        if(intercept?.errorIntercept) {
          intercept.errorIntercept(err);
        }
        throw err instanceof Error ? err : new Error(String(err));
      })
    }  
  )

  useReady(() => {
    if(options.auto) request.current(options.reqData)
  })

  return [res, request.current, state, err] as const
} 

function objectToUrlSearch(obj: object) {
  if(!obj) return '';
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key] == null ? '' : String(obj[key]))}`)
    .join('&');
}

function normalizeMethod(method?: RequestOptions['method']) {
  return (method || 'GET').toUpperCase() as Uppercase<RequestOptions['method']>;
}

function parseResponse(response: Response): Promise<any> {
  if(response.status === 204 || response.status === 205) {
    return Promise.resolve(undefined);
  }

  return response.text().then(text => {
    const body = text.trim();
    return body ? JSON.parse(body) : undefined;
  });
}

function withoutJsonContentType(headers: any) {
  if(!headers) return headers;

  if(headers instanceof Headers) {
    const finalHeaders = new Headers(headers);
    if(finalHeaders.get('Content-Type')?.toLowerCase() === 'application/json') {
      finalHeaders.delete('Content-Type');
    }
    return finalHeaders;
  }

  const finalHeaders = { ...headers };
  const contentTypeKey = Object.keys(finalHeaders)
    .find(key => key.toLowerCase() === 'content-type');
  if(contentTypeKey && String(finalHeaders[contentTypeKey]).toLowerCase() === 'application/json') {
    delete finalHeaders[contentTypeKey];
  }
  return finalHeaders;
}
