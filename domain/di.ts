import { createContext } from "react";

export interface ServiceHook<C> {
  (): C;
  token?: symbol;
}


export const SERVICE_CONTEXT = createContext<any>(null);
export const CACHE_MAP = {} as Record<symbol, any>;