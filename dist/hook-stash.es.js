import React, { createContext, useContext } from 'react';

const SERVICE_CONTEXT = createContext(null);
const CACHE_MAP = {};

function createServiceComponent(Comp, hooks) {
    return React.memo((props) => {
        const topContextVal = useContext(SERVICE_CONTEXT);
        let dependsMap = {};
        if (topContextVal)
            dependsMap = Object.create(topContextVal);
        /** 初始化执行service hooks 并将调用结果存入dependsMap与CACHE_MAP */
        for (let hook of hooks) {
            if (!hook.token)
                hook.token = Symbol(hook.name);
            const token = hook.token;
            const res = hook();
            dependsMap[token] = res;
            CACHE_MAP[token] = dependsMap[token];
        }
        /** 将service hooks遍历执行完毕后，需要立即清除在CACHE_MAP中缓存的依赖 */
        hooks.forEach(hook => {
            if (CACHE_MAP[hook.token])
                delete CACHE_MAP[hook.token];
        });
        return (React.createElement(SERVICE_CONTEXT.Provider, { value: dependsMap },
            React.createElement(Comp, { ...props })));
    });
}

function useServiceHook(input, optional) {
    const token = typeof input === 'symbol' ? input : input.token;
    const contextVal = useContext(SERVICE_CONTEXT);
    const depends = contextVal ? contextVal[token] : CACHE_MAP[token];
    if (depends) {
        return depends;
    }
    else if (optional === 'optional') {
        return null;
    }
    else {
        throw new Error(`未找到${name}的依赖值，请在上层servcieComponent中提供对应的service hook`);
    }
}

export { createServiceComponent, useServiceHook };
//# sourceMappingURL=hook-stash.es.js.map
