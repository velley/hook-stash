import { useEffect, useState } from "react";
import { CUSTOME_REQUEST, HttpIntercept, HttpState, HTTP_INTERCEPT, RequesterFunc, RequestOptions } from "../../domain/http";
import { useReactive } from "../common/useReactive";
import { useServiceHook } from "../di/useServiceHook";

const DEFAULT_HTTP_OPTIONS: Partial<RequestOptions> = {
  auto: true,
  method: 'GET',
}

export function useHttp<T>(url: string, options: Partial<RequestOptions> ) {

  /** 设置请求配置以及上层组件注入进来的依赖项 */
  const finalOption   = Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), options);
  const intercept     = useServiceHook<HttpIntercept>(HTTP_INTERCEPT, 'optional');
  const customeReq    = useServiceHook<RequesterFunc>(CUSTOME_REQUEST, 'optional');

  /** 定义http请求的相关状态变量 */
  const [res, setRes] = useState<T>();
  const httpState     = useReactive<HttpState>();

  const request = () => {
    const req = fetch || customeReq
  }

  useEffect(() => {
    // if()
  }, [])
} 