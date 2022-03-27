import { useEffect } from "react";
import { HttpIntercept, HTTP_INTERCEPT, RequestOptions } from "../../domain/http";
import { useServiceHook } from "../di/useServiceHook";


export function useHttp(url: string, options: RequestOptions) {

  const intercept = useServiceHook<HttpIntercept>(HTTP_INTERCEPT, 'optional')

  useEffect(() => {
    // if()
  }, [])
} 