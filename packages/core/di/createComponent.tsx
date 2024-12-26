import React, { PropsWithChildren } from "react";
import { useContext } from "react";
import { ComponentInjector, ProviderHook, SERVICE_CONTEXT, ACTIVE_CACHE, ComponentProvider } from "../../../domain/di";
import { useSymbol } from "../../common/useSymbol";

export function createComponent<C = { [prop: string]: unknown }>(Comp: React.FC<C>, hooks: ProviderHook<unknown>[]) {
  return React.memo((props: PropsWithChildren<C>) => {
    const id = useSymbol();

    // 获取父级注入器
    const parentInjector = useContext(SERVICE_CONTEXT);

    // 为当前组件上下文创建注入器
    const injector: ComponentInjector = {
      id,
      name: Comp.name,
      providers: new Map(),
      parent: parentInjector,
    }

    // 创建注入器providers
    for (let hook of hooks) {
      if (!hook.token) hook.token = Symbol(hook.name);
      const token = hook.token as symbol;
      const provider: ComponentProvider = { token, value: {}, origin: hook, status: 'idle', type: 'hook' };
      injector.providers.set(token, provider);
    }

    // 将当前组件注入器的providers赋值给ACTIVE_INJECTOR作为临时存储
    ACTIVE_CACHE.providers = injector.providers;

    /** 解析并执行providers中的hook函数，并将调用结果存入dependsMap与CACHE_MAP */
    ACTIVE_CACHE.providers.forEach(__runProvider);
    // 执行完毕后需要清空临时存储
    ACTIVE_CACHE.providers = null;

    return (
      <SERVICE_CONTEXT.Provider value={injector}>
        <Comp {...props} />
      </SERVICE_CONTEXT.Provider>
    )
  })
}

export const __runProvider = (provider: ComponentProvider) => {
  if (provider.status !== 'idle') return;
  provider.status = 'pending';
  if (provider.type === 'hook') {
    const hook = provider.origin as ProviderHook<unknown>;
    const result = hook();
    // 若result类型为对象，则将其合并到provider.value中，否则抛出错误
    if (typeof result === 'object' && result !== null) {
       Object.assign(provider.value, result);      
    } else {
      throw new Error('provider hook函数必须返回一个对象')
    }
    
  } else {
    throw new Error('暂不支持的provider类型')
  }
  provider.status = 'committed';
  return provider.value;
}