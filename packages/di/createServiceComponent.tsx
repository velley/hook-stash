import React, { PropsWithChildren } from "react";
import { useContext } from "react";
import { CACHE_MAP, ServiceHook, SERVICE_CONTEXT } from "../../domain/di";

export function createServiceComponent<C = {[prop: string]: any}>(Comp: React.FC<C>, hooks: ServiceHook<unknown>[]) {
  return React.memo((props: PropsWithChildren<C>) => {
    const topContextVal = useContext(SERVICE_CONTEXT);
    let dependsMap      =  {} as any;
    if(topContextVal) dependsMap = Object.create(topContextVal) ;

    /** 初始化执行service hooks 并将调用结果存入dependsMap与CACHE_MAP */
    for(let hook of hooks) {   
      if(!hook.token) hook.token = Symbol(hook.name);
      const token = hook.token as symbol;  
      const res = hook();      
      dependsMap[token] = res;
      CACHE_MAP[token]  = dependsMap[token]
    }

    /** 将service hooks遍历执行完毕后，需要立即清除在CACHE_MAP中缓存的依赖 */
    hooks.forEach(hook => {
      if(CACHE_MAP[hook.token]) delete CACHE_MAP[hook.token];
    })

    return (
      <SERVICE_CONTEXT.Provider value={ dependsMap }>
        <Comp {...props} />
      </SERVICE_CONTEXT.Provider>
    )
  })
}

