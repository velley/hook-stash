import { createContext } from "react";

export interface ProviderSlot {
  token: symbol;
  current: object | null;
  status: 'pending' | 'ready';
}

export interface ProviderRegistry {
  parent: ProviderRegistry | null;
  providers: Map<symbol, ProviderSlot>;
}

export const PROVIDER_REGISTRY_CONTEXT = createContext<ProviderRegistry | null>(null);

export function createProviderRegistry(
  parent: ProviderRegistry | null,
  tokens: readonly symbol[]
): ProviderRegistry {
  return {
    parent,
    providers: new Map(tokens.map(token => [
      token,
      { token, current: null, status: 'pending' } as ProviderSlot,
    ])),
  };
}

export function findProviderSlot(
  registry: ProviderRegistry,
  token: symbol,
  skipCurrent: boolean
): ProviderSlot | null {
  if (!skipCurrent) {
    const slot = registry.providers.get(token);
    if (slot) return slot;
  }

  return registry.parent ? findProviderSlot(registry.parent, token, false) : null;
}
