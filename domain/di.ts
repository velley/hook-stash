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
  origin: ProviderHook<T>;
  type: 'hook' | 'constant' | 'component';
  status: 'idle' | 'pending' | 'committed';
}

export interface ProviderHook<C extends object = object> {
  (): C;
  token?: symbol;
}

export interface InputProviderDepends {

}

export const SERVICE_CONTEXT = createContext<ComponentInjector | null>(null);

/**
 * @deprecated Provider 的解析已改由 SERVICE_CONTEXT 完成。
 * 保留该导出仅用于兼容旧版本，不再参与依赖注入流程。
 */
export const ACTIVE_CACHE: { providers: ComponentInjector['providers'] | null } = { providers: null };
