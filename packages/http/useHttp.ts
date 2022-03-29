import { useEffect, useState } from "react";
import { CUSTOME_REQUEST, HttpIntercept, HttpState, HTTP_INTERCEPT, RequesterFunc, RequestOptions } from "../../domain/http";
import { useReactive } from "../common/useReactive";
import { useServiceHook } from "../di/useServiceHook";

const DEFAULT_HTTP_OPTIONS: Partial<RequestOptions> = {
  auto: true,
  method: 'GET',
  reqData: {}
}

export function useHttp<T>(
  url: string, options: Partial<RequestOptions> = {}
): [(query?: any) => Promise<void | T>, T, HttpState, any] {

  /** 设置请求配置以及上层组件注入进来的依赖项 */
  const localOption   = Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), options, { url });
  const intercept     = useServiceHook<HttpIntercept>(HTTP_INTERCEPT, 'optional');
  const customeReq    = useServiceHook<RequesterFunc>(CUSTOME_REQUEST, 'optional');

  /** 定义http请求的相关状态变量 */
  const [res, setRes]        = useState<T>();
  const [err, setErr]        = useState<any>();
  const [state, setState]    = useState<HttpState>('ready');  

  const request = (query: any = {}) => {
    setState('pending');
    return new Promise<RequestOptions>(resolve => {
      if(intercept?.requestIntercept) {
        intercept.requestIntercept(localOption).then(final => resolve(final))
      } else resolve(localOption)
    })
    .then(options => {
      let reqData = {...options.reqData, ...query};
      let url = options.url;
      if(customeReq) {
        return customeReq(url, {...options, reqData})
      } else {
        return fetch(url, {...options, body: JSON.stringify(options.reqData)})
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
      console.log(err)
      setState('failed');
      setErr(err);
    })
  }

  useEffect(() => {
    if(options.auto) request()
  }, [])

  return [request, res, state, err]
} 