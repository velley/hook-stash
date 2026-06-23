import React, {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { ComponentInjector, ComponentProvider, ProviderHook, SERVICE_CONTEXT } from "../../../domain/di";
import { useSymbol } from "../../common/useSymbol";
import {
  createProviderRegistry,
  PROVIDER_REGISTRY_CONTEXT,
  ProviderRegistry,
} from "./registry";
import { getProviderToken } from "./token";

interface HookProviderProps {
  children?: ReactNode;
}

const useProviderCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function isProviderObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 将一个普通 Hook 固定到独立的 React 组件中。
 * Hook 的状态归当前 Provider 组件实例所有，返回值通过 Context 向下共享。
 */
function createHookProvider(useProvider: ProviderHook<object>, token: symbol) {
  const HookProvider = ({ children }: HookProviderProps) => {
    const parentInjector = useContext(SERVICE_CONTEXT);
    const registry = useContext(PROVIDER_REGISTRY_CONTEXT);
    const id = useSymbol();
    const value = useProvider();
    const validProviderValue = isProviderObject(value);

    const provider: ComponentProvider = {
      token,
      value,
      origin: useProvider,
      status: 'committed',
      type: 'hook',
    };

    // lazy 注入只能读取已提交的 Provider，避免中断渲染污染当前实例。
    useProviderCommitEffect(() => {
      if (!registry || !validProviderValue) return;
      const slot = registry.providers.get(token);
      if (!slot) return;

      slot.current = value;
      slot.status = 'ready';

      return () => {
        if (slot.current === value) {
          slot.current = null;
          slot.status = 'pending';
        }
      };
    }, [registry, validProviderValue, value]);

    if (!validProviderValue) {
      throw new TypeError(
        `Provider Hook(${useProvider.name || token.description || 'anonymous'})必须返回非 null、非数组的 object 对象`
      );
    }

    if (!registry) {
      throw new Error('Provider Registry 未创建，请通过createComponent注册Provider Hook');
    }

    const injector: ComponentInjector = {
      id,
      name: useProvider.name || token.description || 'AnonymousProvider',
      providers: new Map([[token, provider]]),
      parent: parentInjector,
    };

    return (
      <SERVICE_CONTEXT.Provider value={injector}>
        {children}
      </SERVICE_CONTEXT.Provider>
    );
  };

  HookProvider.displayName = `${useProvider.name || 'Anonymous'}Provider`;
  return HookProvider;
}

export function createComponent<C extends object = Record<string, unknown>>(
  Comp: React.FC<C>,
  hooks: readonly ProviderHook<object>[]
) {
  // 在组件工厂阶段生成稳定的 Provider 组件类型，不能放到渲染函数内部。
  // Map 同时保持旧实现中“相同 token 只注册一次”的行为。
  const hooksByToken = new Map<symbol, ProviderHook<object>>();
  hooks.forEach(hook => hooksByToken.set(getProviderToken(hook), hook));
  const providerEntries = Array.from(hooksByToken.entries());
  const providerTokens = providerEntries.map(([token]) => token);
  const ProviderComponents = providerEntries.map(
    ([token, hook]) => createHookProvider(hook, token)
  );

  const ComponentWithProviders = (props: PropsWithChildren<C>) => {
    const parentRegistry = useContext(PROVIDER_REGISTRY_CONTEXT);
    const registry = useMemo<ProviderRegistry>(
      () => createProviderRegistry(parentRegistry, providerTokens),
      [parentRegistry]
    );
    let content: ReactElement = <Comp {...props} />;

    // hooks[0] 位于最外层；立即注入仍然遵循由前向后的依赖顺序。
    for (let index = ProviderComponents.length - 1; index >= 0; index -= 1) {
      const Provider = ProviderComponents[index];
      content = <Provider>{content}</Provider>;
    }

    return (
      <PROVIDER_REGISTRY_CONTEXT.Provider value={registry}>
        {content}
      </PROVIDER_REGISTRY_CONTEXT.Provider>
    );
  };

  ComponentWithProviders.displayName = `WithProviders(${Comp.displayName || Comp.name || 'Component'})`;
  return React.memo(ComponentWithProviders);
}

/**
 * @deprecated Provider Hook 现在由独立组件执行。
 * 保留该函数仅兼容旧版本中意外暴露的内部符号。
 */
export const __runProvider = <T extends object>(provider: ComponentProvider<T>) => provider.value;
