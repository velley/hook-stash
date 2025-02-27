import { useRef } from "react";
import { CUSTOME_REQUEST, HttpIntercept, HttpState, HTTP_INTERCEPT, RequesterFunc, RequestOptions } from "../../domain/http";
import { useReady } from "../common/useReady";
import { useStash } from "../core/stash/useStash";
import { useInjector } from "../core/di/useInjector";

/**
 * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入方式提供自定义请求方法
 * @param url 请求地址，必传
 * @param localOptions 请求配置项 选传
 * @returns  [请求结果, 请求方法, 请求状态, 错误信息]
 */
export function useHttpClient<T>(
  url: string, localOptions: Partial<RequestOptions> = {}
) {

  const DEFAULT_HTTP_OPTIONS: Partial<RequestOptions> = {
    auto: false,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    reqData: {}
  }

  /** 设置请求配置以及上层组件注入进来的配置项 */
  const options       = Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), localOptions, { url });
  const intercept     = useInjector<HttpIntercept>(HTTP_INTERCEPT, {optional: true});
  const customeReq    = useInjector<{req: RequesterFunc}>(CUSTOME_REQUEST, {optional: true});

  /** 定义http请求的相关状态变量 */
  const [res, setRes]        = useStash<T>(options.defaultValue as T);
  const [err, setErr]        = useStash<Error | null>(null);
  const [state, setState]    = useStash<HttpState>('ready');  

  const request =  useRef(
    (query: any = {}) => {
      setState('pending');
      return new Promise<RequestOptions>(resolve => {
        if(intercept?.requestIntercept) {        
          intercept.requestIntercept({ ...options, reqData: query }).then(finalOptions => resolve(finalOptions))
        } else {
          resolve({ ...options, reqData: query })
        } 
      })
      .then(options2 => {
        let reqData = options2.reqData;
        if(customeReq) {
          return customeReq.req(options2.url, {...options2, reqData})
        } else {
          if(['GET', 'HEAD'].includes(options2.method) || !options2.method) {
            const searchKeys = `?${objectToUrlSearch(reqData)}`;
            options2.url += searchKeys;  
            delete options2.body;
          } else {
            options2.body = reqData instanceof FormData ? reqData : JSON.stringify(reqData);
            delete options2.reqData;
          }
          return fetch(options2.url, options2)
        }
      })
      .then(response => {
        const res = response;
        const resIntercept = intercept?.responseIntercept
        if(customeReq) {
          return resIntercept ? resIntercept(res) : res;
        } else {
          return res.json().then((re: any) => resIntercept ? resIntercept(re) : re)
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
        throw new Error(err);
      })
    }  
  )

  useReady(() => {
    if(options.auto) request.current(options.reqData)
  })

  return [res, request.current, state, err] as const
} 

function objectToUrlSearch(obj: object) {
  console.log(obj)
  if(!obj) return '';
  let str = '';
  for(let key in obj) {
    str += `${key}=${obj[key]}&`
  }
  return str
}