import { jsx } from 'react/jsx-runtime';
import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';

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
        return (jsx(SERVICE_CONTEXT.Provider, { value: dependsMap, children: jsx(Comp, { ...props }) }));
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

/**
 * @description 防抖函数
 * @param callback 初始回调函数
 * @param deps 依赖值
 * @param debounceTime 防抖时间
 * @returns
 */
function useDebounceCallback(callback, deps, debounceTime) {
    let timer;
    const timeRef = useRef(debounceTime);
    const runner = useCallback(callback, deps);
    const debouncer = (...params) => {
        clearTimeout(timer);
        timeRef.current = debounceTime;
        const runTimeout = () => {
            return setTimeout(() => {
                if (timeRef.current <= 0) {
                    runner(...params);
                }
                else {
                    timeRef.current = timeRef.current - 1000;
                    runTimeout();
                }
            }, 1000);
        };
        timer = runTimeout();
    };
    return debouncer;
}

/**
 * @description 将最近两次变化的值并返回(只有输入值变化时，返回值才会相应地更新)
 * @param state 状态变量（建议为useState函数返回的变量）
 * @returns 上一个值
 */
function usePrevious(state) {
    const prevRef = useRef();
    const curRef = useRef();
    if (curRef.current !== state) {
        prevRef.current = curRef.current;
        curRef.current = state;
    }
    return prevRef.current;
}

/**
 * @description 使用引用类型的状态变量，并返回状态值和状态变更函数
 * @param refState
 * @returns
 */
function useRefState(refState) {
    const [state, setState] = useState(refState);
    const setRefState = (newV) => {
        setState(oldV => ({ ...oldV, ...newV }));
    };
    return [state, setRefState];
}

/**
 * @function 将普通对象变为由Proxy包装的代理对象，更新对象中的属性值时，会自动触发setState方法并引起函数式组件重新执行
 * @param state 初始对象
 * @returns proxy 代理对象
 */
function useReactive(state = {}) {
    const [pState, setState] = useRefState(state);
    const proxy = new Proxy(pState, {
        set(target, prop, value) {
            if (target[prop] !== value) {
                const nv = { [prop]: value };
                setState(nv);
            }
            return true;
        },
        get(obj, prop) {
            return obj[prop];
        }
    });
    return proxy;
}

/**
 * @description 依赖值更新时执行副作用函数（忽略组件第一次渲染后的副作用），并将每个依赖上一次变更的值传给副作用函数
 * @param callback 要执行的回调函数
 * @param deps 状态依赖
 */
function useUpdateEffect(callback, deps) {
    const counter = useRef(0);
    const changesRef = useRef([]);
    deps.forEach((dep, index) => {
        changesRef.current[index] = usePrevious(dep);
    });
    useEffect(() => {
        counter.current++;
        if (counter.current == 1)
            return;
        return callback(changesRef.current);
    }, deps);
}

/**
 * @description 依赖值更新时执行的副作用函数，并将函数上一次调用时的所有依赖值传给当前调用(注意与useUpdateEffect的区别)
 * @param callback 要执行的回调函数
 * @param deps 状态依赖
 */
function useWatchEffect(callback, deps) {
    const runCount = useRef(0);
    const caches = useRef([]);
    useEffect(() => {
        caches.current.push(deps);
        runCount.current++;
        if (runCount.current === 1)
            return;
        return callback(caches.current.shift());
    }, deps);
}

export { createServiceComponent, useDebounceCallback, usePrevious, useReactive, useRefState, useServiceHook, useUpdateEffect, useWatchEffect };
//# sourceMappingURL=hook-stash.es.js.map
