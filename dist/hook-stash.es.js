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

/**
 * @description 防抖函数
 * @param callback 初始回调函数
 * @param deps 依赖值
 * @param debounceTime 防抖时间
 * @returns debouncer
 */
function useDebounceCallback(callback, deps, debounceTime) {
    const timeRef = useRef(null);
    const runner = useCallback(callback, deps);
    const debouncer = (...params) => {
        clearTimeout(timeRef.current);
        const runTimeout = () => {
            return setTimeout(() => { runner(...params); }, debounceTime);
        };
        timeRef.current = runTimeout();
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
 * @description 保存状态的历史变化记录
 * @param state 状态变量
 * @returns state历史值，最新值在末尾
 */
function useHistoryState(state) {
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        setLogs(logs => logs.concat([state]));
    }, [state]);
    return logs;
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

const HTTP_INTERCEPT = Symbol('供useHttp使用的请求拦截器');
const CUSTOME_REQUEST = Symbol('自定义请求函数，以覆盖默认的fetch函数');

const DEFAULT_HTTP_OPTIONS = {
    auto: true,
    method: 'GET',
    reqData: {}
};
/**
 * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入提供自定义请求方法覆盖
 * @param url
 * @param options
 * @returns
 */
function useHttp(url, options = {}) {
    /** 设置请求配置以及上层组件注入进来的依赖项 */
    const localOption = Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), options, { url });
    const intercept = useServiceHook(HTTP_INTERCEPT, 'optional');
    const customeReq = useServiceHook(CUSTOME_REQUEST, 'optional');
    /** 定义http请求的相关状态变量 */
    const [res, setRes] = useState();
    const [err, setErr] = useState();
    const [state, setState] = useState('ready');
    const request = (query = {}) => {
        setState('pending');
        return new Promise(resolve => {
            if (intercept?.requestIntercept) {
                intercept.requestIntercept(localOption).then(final => resolve(final));
            }
            else
                resolve(localOption);
        })
            .then(options => {
            let reqData = { ...options.reqData, ...query };
            let url = options.url;
            if (customeReq) {
                return customeReq(url, { ...options, reqData });
            }
            else {
                return fetch(url, { ...options, body: JSON.stringify(options.reqData) });
            }
        })
            .then(response => {
            const res = response;
            const resIntercept = intercept?.responseIntercept;
            if (customeReq) {
                return resIntercept ? resIntercept(res) : res;
            }
            else {
                return res.json().then((re) => resIntercept ? resIntercept(re) : re);
            }
        })
            .then(res => {
            setRes(res);
            setState('success');
            return res;
        })
            .catch(err => {
            console.log(err);
            setState('failed');
            setErr(err);
        });
    };
    useEffect(() => {
        if (options.auto)
            request();
    }, []);
    return [request, res, state, err];
}

export { CACHE_MAP, CUSTOME_REQUEST, HTTP_INTERCEPT, SERVICE_CONTEXT, createServiceComponent, useDebounceCallback, useHistoryState, useHttp, usePrevious, useRefState, useServiceHook, useUpdateEffect, useWatchEffect };
//# sourceMappingURL=hook-stash.es.js.map
