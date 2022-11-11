import { useContext } from "react";
import { CACHE_MAP, ChainNodes, ServiceHook, SERVICE_CONTEXT } from "../../domain/di";

interface ServiceOptions {
  optional?: boolean;
  skipOne?: boolean;
}


// export function useServiceHook<C>(input: ServiceHook<C> | symbol,): C;
// export function useServiceHook<C>(input: ServiceHook<C> | symbol, options: {optional: true}): C | null;
export function useServiceHook<C>(input: ServiceHook<C> | symbol, options?: ServiceOptions): C {
  const token = (typeof input === 'symbol' ? input : input.token) as unknown as symbol;
  const chainNode = useContext(SERVICE_CONTEXT);
  const depends = CACHE_MAP[token] ? CACHE_MAP[token] : findDepsInChainNode(chainNode as ChainNodes, token, options);
  if(depends) {
    return depends
  } 
  if(options && options.optional === true) {
    return null
  } else {
    throw new Error(`未找到${token.description}的依赖值，请在上层servcieComponent中提供对应的service hook`)
  }
}

function findDepsInChainNode(node: ChainNodes, token: symbol, options?: ServiceOptions): any {
  const deps  = node.data[token];
  if(deps && !options?.skipOne) return deps;
  if(node.parent) return findDepsInChainNode(node.parent, token);
  if(!node.parent) return null;
}


function checkOption(option: object): option is ServiceOptions {
  return option.hasOwnProperty('skipOne')
}