import { useContext } from "react";
import { ACTIVE_CACHE, ComponentInjector, ComponentProvider, ProviderHook, SERVICE_CONTEXT } from "../../../domain/di";
import { __runProvider } from "./createComponent";

interface ServiceOptions {
	optional?: boolean;
	skipOne?: boolean;
}

export function useInjector<C>(input: ProviderHook<C> | symbol,): C;
export function useInjector<C>(input: ProviderHook<C> | symbol, options: ServiceOptions): C | null;
export function useInjector<C>(input: ProviderHook<C> | symbol, options?: ServiceOptions) {
	const token = (typeof input === 'symbol' ? input : input.token) as unknown as symbol;
	let depends: C;
	if (ACTIVE_CACHE.providers && ACTIVE_CACHE.providers.has(token)) {
		const provider = ACTIVE_CACHE.providers.get(token) as ComponentProvider;
		depends = provider.value as C;
		if(provider.status === 'idle') {
			__runProvider(provider);
		}		
		if(provider.status === 'pending') {
			console.error(`hook函数(${provider.origin.name})存在循环依赖，可能导致无法正常获取依赖值`)
		}
	} else {
		const injector = useContext(SERVICE_CONTEXT);
		if(!injector) throw new Error('未找到注入器，请使用createComponent创建组件并通过provider参数提供对应依赖');
		depends = findDepsByInjector(injector, token, options);
	}
	if (depends) {
		return depends
	}
	if (options && options.optional === true) {
		return null
	} else {
		throw new Error(`未找到${token.description}的依赖值，请在上层Component中提供对应的providers`)
	}
}

function findDepsByInjector(node: ComponentInjector, token: symbol, options?: ServiceOptions): any {
	const deps = node.providers.get(token)?.value;
	if (deps && !options?.skipOne) return deps;
	if (node.parent) return findDepsByInjector(node.parent, token);
	if (!node.parent) return null;
}