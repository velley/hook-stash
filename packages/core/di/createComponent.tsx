import React, { PropsWithChildren, ReactElement, ReactNode, useContext } from "react";
import { ComponentInjector, ComponentProvider, ProviderHook, SERVICE_CONTEXT } from "../../../domain/di";
import { useSymbol } from "../../common/useSymbol";
import { getProviderToken } from "./token";

interface HookProviderProps {
  children?: ReactNode;
}

/**
 * 将一个普通 Hook 固定到独立的 React 组件中。
 * Hook 的状态归当前 Provider 组件实例所有，返回值通过 Context 向下共享。
 */
function createHookProvider(useProvider: ProviderHook<unknown>) {
  const token = getProviderToken(useProvider);

  const HookProvider = ({ children }: HookProviderProps) => {
    const parentInjector = useContext(SERVICE_CONTEXT);
    const id = useSymbol();
    const value = useProvider();

    const provider: ComponentProvider<unknown> = {
      token,
      value,
      origin: useProvider,
      status: 'committed',
      type: 'hook',
    };

    // 每次 Provider Hook 的返回值变化时创建新的 Context value，
    // 从而让直接返回 useState 值的普通 Hook 也能正确通知消费者。
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
  hooks: readonly ProviderHook<unknown>[]
) {
  // 在组件工厂阶段生成稳定的 Provider 组件类型，不能放到渲染函数内部。
  // Map 同时保持旧实现中“相同 token 只注册一次”的行为。
  const hooksByToken = new Map<symbol, ProviderHook<unknown>>();
  hooks.forEach(hook => hooksByToken.set(getProviderToken(hook), hook));
  const ProviderComponents = Array.from(hooksByToken.values()).map(createHookProvider);

  const ComponentWithProviders = (props: PropsWithChildren<C>) => {
    let content: ReactElement = <Comp {...props} />;

    // hooks[0] 位于最外层，因此后面的 Provider Hook 可以注入前面的 Hook。
    for (let index = ProviderComponents.length - 1; index >= 0; index -= 1) {
      const Provider = ProviderComponents[index];
      content = <Provider>{content}</Provider>;
    }

    return content;
  };

  ComponentWithProviders.displayName = `WithProviders(${Comp.displayName || Comp.name || 'Component'})`;
  return React.memo(ComponentWithProviders);
}

/**
 * @deprecated Provider Hook 现在由独立组件执行。
 * 保留该函数仅兼容旧版本中意外暴露的内部符号。
 */
export const __runProvider = <T,>(provider: ComponentProvider<T>) => provider.value;
