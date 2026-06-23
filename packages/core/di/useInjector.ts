import { useContext } from "react";
import { ComponentInjector, ComponentProvider, ProviderHook, SERVICE_CONTEXT } from "../../../domain/di";
import { getProviderToken } from "./token";

interface ServiceOptions {
  optional?: boolean;
  skipOne?: boolean;
}

export function useInjector<C>(input: ProviderHook<C> | symbol): C;
export function useInjector<C>(input: ProviderHook<C> | symbol, options: ServiceOptions): C | null;
export function useInjector<C>(input: ProviderHook<C> | symbol, options?: ServiceOptions): C | null {
  // 始终在固定位置读取 Context，不再根据模块级活动状态条件调用 Hook。
  const injector = useContext(SERVICE_CONTEXT);
  const token = typeof input === 'symbol' ? input : getProviderToken(input);
  const provider = injector ? findProviderByInjector(injector, token, options?.skipOne === true) : null;

  if (provider) return provider.value as C;
  if (options?.optional) return null;

  if (!injector) {
    throw new Error('未找到注入器，请使用createComponent创建组件并通过providers参数提供对应依赖');
  }

  const providerName = typeof input === 'function' ? input.name : token.description;
  throw new Error(
    `未找到${providerName || token.description || '指定 token'}的依赖值。` +
    '同一 createComponent 中，Provider Hook 只能注入排列在它前面的 Hook。'
  );
}

function findProviderByInjector(
  node: ComponentInjector,
  token: symbol,
  skipCurrent: boolean
): ComponentProvider<unknown> | null {
  if (!skipCurrent) {
    const provider = node.providers.get(token);
    if (provider) return provider;
  }

  return node.parent ? findProviderByInjector(node.parent, token, false) : null;
}
