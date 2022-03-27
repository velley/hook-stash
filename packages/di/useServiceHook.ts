import { useContext } from "react";
import { CACHE_MAP, ServiceHook, SERVICE_CONTEXT } from "../../domain/di";

export function useServiceHook<C>(input: ServiceHook<C> | symbol, optional: 'optional'): C | null;
export function useServiceHook<C>(input: ServiceHook<C> | symbol): C;
export function useServiceHook<C>(input: ServiceHook<C> | symbol, optional?: 'optional') {
  const token = typeof input === 'symbol' ? input : input.token;
  const contextVal = useContext(SERVICE_CONTEXT);
  const depends = contextVal ? contextVal[token] : CACHE_MAP[token];
  if(depends) {
    return depends
  } else if(optional === 'optional') {
    return null
  } else {
    throw new Error(`未找到${name}的依赖值，请在上层servcieComponent中提供对应的service hook`)
  }
}