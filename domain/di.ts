import { createContext } from "react";


export interface ComponentInjector {
  id: symbol;
  name: string;
  parent: ComponentInjector | null;
  providers: Map<symbol, ComponentProvider>;
};

export interface ComponentProvider<T extends object = object> {
  token: symbol;
  value: T;
  origin: ProviderHook<unknown>;
  type: 'hook' | 'constant' | 'component';
  status: 'idle' | 'pending' | 'committed';
}

export interface ProviderHook<C> {
  (): C;
  token?: symbol;
}

export interface InputProviderDepends {

}

export const SERVICE_CONTEXT = createContext<ComponentInjector | null>(null);
export const ACTIVE_CACHE: { providers: ComponentInjector['providers'] | null } = { providers: null };