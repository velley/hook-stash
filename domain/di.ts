import { createContext } from "react";

export interface ServiceHook<C> {
  (): C;
  token?: symbol;
}

export type ChainNodes<T = any> = {data: T; id: symbol; name: string; parent: ChainNodes<T> | null};

export const SERVICE_CONTEXT = createContext<ChainNodes<any> | null>(null);
export const CACHE_MAP = {} as Record<symbol, any>;