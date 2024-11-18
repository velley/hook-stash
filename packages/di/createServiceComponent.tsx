import React, { PropsWithChildren } from "react";
import { useContext } from "react";
import { CACHE_MAP, ChainNodes, ServiceHook, SERVICE_CONTEXT } from "../../domain/di";
import { useSymbol } from "../common/useSymbol";

export function createComponent<C = {[prop: string]: any}>(Comp: React.FC<C>, hooks: ServiceHook<unknown>[]) {
  return React.memo((props: PropsWithChildren<C>) => {
    const id = useSymbol()
    const topChainNode = useContext(SERVICE_CONTEXT);
    const chainNode: ChainNodes<any> = {
      data: {},
      id,
      name: Comp.name,
      parent: topChainNode
    }

    /** 初始化执行service hooks 并将调用结果存入dependsMap与CACHE_MAP */
    for(let hook of hooks) {   
      if(!hook.token) hook.token = Symbol(hook.name);
      const token = hook.token as symbol;  
      const res = hook();      
      chainNode.data[token] = res;
      CACHE_MAP[token]  = res;
    }

    /** 将service hooks遍历执行完毕后，需要立即清除在CACHE_MAP中缓存的依赖 */
    hooks.forEach(hook => {
      if(hook.token && CACHE_MAP[hook.token]) delete CACHE_MAP[hook.token];
    })

    // console.log('chain node', chainNode)

    return (
      <SERVICE_CONTEXT.Provider value={ chainNode }>
        <Comp {...props} />
      </SERVICE_CONTEXT.Provider>
    )
  })
}

export const createServiceComponent = createComponent;