import { useCallback, useContext } from "react";
import { ComponentInjector, ComponentProvider, ProviderHook, SERVICE_CONTEXT } from "../../../domain/di";
import { findProviderSlot, PROVIDER_REGISTRY_CONTEXT } from "./registry";
import { getProviderToken } from "./token";

export interface EagerServiceOptions {
  optional?: boolean;
  skipOne?: boolean;
  lazy?: false;
}

export interface LazyServiceOptions {
  optional?: false;
  skipOne?: boolean;
  lazy: true;
}

export interface OptionalLazyServiceOptions {
  optional: true;
  skipOne?: boolean;
  lazy: true;
}

type ServiceOptions = EagerServiceOptions | LazyServiceOptions | OptionalLazyServiceOptions;

export function useInjector<C extends object>(input: ProviderHook<C> | symbol): C;
export function useInjector<C extends object>(
  input: ProviderHook<C> | symbol,
  options: LazyServiceOptions
): () => C;
export function useInjector<C extends object>(
  input: ProviderHook<C> | symbol,
  options: OptionalLazyServiceOptions
): () => C | null;
export function useInjector<C extends object>(
  input: ProviderHook<C> | symbol,
  options: EagerServiceOptions
): C | null;
export function useInjector<C extends object>(
  input: ProviderHook<C> | symbol,
  options?: ServiceOptions
): C | null | (() => C | null) {
  // 两个 Context 始终在固定位置读取，options.lazy 可安全地在不同渲染间切换。
  const injector = useContext(SERVICE_CONTEXT);
  const registry = useContext(PROVIDER_REGISTRY_CONTEXT);
  const token = typeof input === 'symbol' ? input : getProviderToken(input);
  const optional = options?.optional === true;
  const skipOne = options?.skipOne === true;
  const providerName = typeof input === 'function' ? input.name : token.description;

  const getLazyProvider = useCallback((): C | null => {
    const slot = registry ? findProviderSlot(registry, token, skipOne) : null;

    if (slot?.status === 'ready' && slot.current) {
      return slot.current as C;
    }
    if (optional) return null;

    if (!registry) {
      throw new Error('未找到Provider Registry，请在createComponent创建的组件树中使用lazy注入');
    }

    throw new Error(
      `Provider(${providerName || token.description || '指定 token'})尚未提交或已经卸载。` +
      'lazy Provider 只能在事件回调、异步方法或useEffect中读取，不能在渲染阶段立即执行。'
    );
  }, [optional, providerName, registry, skipOne, token]);

  if (options?.lazy) return getLazyProvider;

  const provider = injector ? findProviderByInjector(injector, token, skipOne) : null;
  if (provider) return provider.value as C;
  if (optional) return null;

  if (!injector) {
    throw new Error('未找到注入器，请使用createComponent创建组件并通过providers参数提供对应依赖');
  }

  throw new Error(
    `未找到${providerName || token.description || '指定 token'}的依赖值。` +
    '反向或循环依赖请使用useInjector(provider, { lazy: true })延迟解析。'
  );
}

function findProviderByInjector(
  node: ComponentInjector,
  token: symbol,
  skipCurrent: boolean
): ComponentProvider | null {
  if (!skipCurrent) {
    const provider = node.providers.get(token);
    if (provider) return provider;
  }

  return node.parent ? findProviderByInjector(node.parent, token, false) : null;
}
