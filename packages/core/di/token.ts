
import { ProviderHook } from "../../../domain/di";

const PROVIDER_TOKENS = new WeakMap<ProviderHook<unknown>, symbol>();

export function createToken(name: string) {
  return Symbol(name);
}

/**
 * 根据 Hook 函数引用获取稳定 token。
 * WeakMap 只保存 Hook 到 token 的静态映射，不记录任何渲染中的活动状态。
 */
export function getProviderToken<C>(hook: ProviderHook<C>): symbol {
  if (hook.token) return hook.token;

  const target = hook as ProviderHook<unknown>;
  let token = PROVIDER_TOKENS.get(target);
  if (!token) {
    token = createToken(hook.name || 'anonymous provider hook');
    PROVIDER_TOKENS.set(target, token);
  }
  return token;
}
