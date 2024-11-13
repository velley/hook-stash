import React, { createContext, useRef, useContext, useCallback, useState, useEffect, useMemo, useLayoutEffect } from 'react';

const SERVICE_CONTEXT = createContext(null);
const CACHE_MAP = {};

/**
 * @description 在组件声明周期内生成一个唯一symbol标识
 */
function useSymbol() {
    const symbol = useRef(Symbol('a unique symbol id for current functional component'));
    return symbol.current;
}

function createServiceComponent(Comp, hooks) {
    return React.memo((props) => {
        const id = useSymbol();
        const topChainNode = useContext(SERVICE_CONTEXT);
        const chainNode = {
            data: {},
            id,
            name: Comp.name,
            parent: topChainNode
        };
        /** 初始化执行service hooks 并将调用结果存入dependsMap与CACHE_MAP */
        for (let hook of hooks) {
            if (!hook.token)
                hook.token = Symbol(hook.name);
            const token = hook.token;
            const res = hook();
            chainNode.data[token] = res;
            CACHE_MAP[token] = res;
        }
        /** 将service hooks遍历执行完毕后，需要立即清除在CACHE_MAP中缓存的依赖 */
        hooks.forEach(hook => {
            if (hook.token && CACHE_MAP[hook.token])
                delete CACHE_MAP[hook.token];
        });
        // console.log('chain node', chainNode)
        return (React.createElement(SERVICE_CONTEXT.Provider, { value: chainNode },
            React.createElement(Comp, Object.assign({}, props))));
    });
}
const createComponentWithProvider = createServiceComponent;

function useServiceHook(input, options) {
    const token = (typeof input === 'symbol' ? input : input.token);
    const chainNode = useContext(SERVICE_CONTEXT);
    const depends = CACHE_MAP[token] ? CACHE_MAP[token] : findDepsInChainNode(chainNode, token, options);
    if (depends) {
        return depends;
    }
    if (options && options.optional === true) {
        return null;
    }
    else {
        throw new Error(`未找到${token.description}的依赖值，请在上层servcieComponent中提供对应的service hook`);
    }
}
function findDepsInChainNode(node, token, options) {
    const deps = node.data[token];
    if (deps && !(options === null || options === void 0 ? void 0 : options.skipOne))
        return deps;
    if (node.parent)
        return findDepsInChainNode(node.parent, token);
    if (!node.parent)
        return null;
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
        setState(oldV => (Object.assign(Object.assign({}, oldV), newV)));
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

/**
 * @description 记录状态的变化次数(第一次初始化时记为第0次)
 * @param state 状态变量
 * @param options
 * deep: 是否为深度比较，state为对象时，会遍历其属性进行比较,全部相等时不会记为一次变化
 * @returns
 */
function useUpdateCount(state, options) {
    const [count, setCount] = useState(0);
    const before = usePrevious(state);
    useUpdateEffect(() => {
        if (options === null || options === void 0 ? void 0 : options.deep) {
            let changed = false;
            for (let key in state) {
                if (state[key] !== (before === null || before === void 0 ? void 0 : before[key])) {
                    changed = true;
                    break;
                }
            }
            changed && setCount(v => v + 1);
        }
        else {
            state !== before && setCount(v => v + 1);
        }
    }, [state, before]);
    return count;
}

/** HTTP拦截器token */
const HTTP_INTERCEPT = Symbol('供useHttp使用的请求拦截器');
/** 自定义HTTP函数token */
const CUSTOME_REQUEST = Symbol('自定义请求函数，以覆盖默认的fetch函数');
/** Paging分页请求token */
const PAGING_SETTING = Symbol('提供全局分页配置');

/**
 * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入方式提供自定义请求方法
 * @param url 请求地址，必传
 * @param localOptions 请求配置项 选传
 * @returns  [请求结果, 请求方法, 请求状态, 错误信息]
 */
function useHttp(url, localOptions = {}) {
    const DEFAULT_HTTP_OPTIONS = {
        auto: false,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        reqData: {}
    };
    /** 设置请求配置以及上层组件注入进来的配置项 */
    const options = useMemo(() => Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), localOptions, { url }), [localOptions, url]);
    const intercept = useServiceHook(HTTP_INTERCEPT, { optional: true });
    const customeReq = useServiceHook(CUSTOME_REQUEST, { optional: true });
    /** 定义http请求的相关状态变量 */
    const [res, setRes] = useState(options.defaultValue);
    const [err, setErr] = useState();
    const [state, setState] = useState('ready');
    const request = (query = {}) => {
        setState('pending');
        return new Promise(resolve => {
            if (intercept === null || intercept === void 0 ? void 0 : intercept.requestIntercept) {
                intercept.requestIntercept(Object.assign(Object.assign({}, options), { reqData: query })).then(finalOptions => resolve(finalOptions));
            }
            else {
                resolve(Object.assign(Object.assign({}, options), { reqData: query }));
            }
        })
            .then(options2 => {
            let reqData = options2.reqData;
            if (customeReq) {
                return customeReq(options2.url, Object.assign(Object.assign({}, options2), { reqData }));
            }
            else {
                if (['GET', 'HEAD'].includes(options2.method) || !options2.method) {
                    const searchKeys = `?${objectToUrlSearch(reqData)}`;
                    options2.url += searchKeys;
                    delete options2.body;
                }
                else {
                    options2.body = reqData instanceof FormData ? reqData : JSON.stringify(reqData);
                    delete options2.reqData;
                }
                return fetch(options2.url, options2);
            }
        })
            .then(response => {
            const res = response;
            const resIntercept = intercept === null || intercept === void 0 ? void 0 : intercept.responseIntercept;
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
            setState('failed');
            setErr(err);
            throw new Error(err);
        });
    };
    useEffect(() => {
        if (options.auto)
            request(options.reqData);
    }, []);
    return [res, request, state, err];
}
function objectToUrlSearch(obj) {
    console.log(obj);
    if (!obj)
        return '';
    let str = '';
    for (let key in obj) {
        str += `${key}=${obj[key]}&`;
    }
    return str;
}

const LocalPagingSetting = {
    method: 'POST',
    sizeKey: 'pageSize',
    indexKey: 'pageNo',
    size: 10,
    start: 1,
    scrollLoading: true,
    dataPlucker: res => res.data,
    totalPlucker: res => (res === null || res === void 0 ? void 0 : res.total) || 0
};
function usePaging(url, querys = {}, localSetting = {}) {
    /** 初始化分页请求配置 */
    const globalSetting = useServiceHook(PAGING_SETTING, { optional: true });
    const setting = Object.assign(Object.assign(Object.assign({}, LocalPagingSetting), (globalSetting || {})), localSetting);
    /** 初始化条件查询对象 */
    const querysRef = useRef(querys);
    /** 初始化分页信息 */
    const pageRef = useRef({});
    useLayoutEffect(() => {
        pageRef.current.target = setting.start;
        pageRef.current[setting['indexKey']] = setting.start;
        pageRef.current[setting['sizeKey']] = setting.size;
        !pageRef.current.hasOwnProperty('__index') &&
            Object.defineProperty(pageRef.current, '__index', {
                get: () => pageRef.current[setting['indexKey']],
                set: (num) => { pageRef.current[setting['indexKey']] = num; }
            });
        !pageRef.current.hasOwnProperty('__size') &&
            Object.defineProperty(pageRef.current, '__size', {
                get: () => pageRef.current[setting['sizeKey']]
            });
    }, []);
    /** 定义分页请求逻辑 */
    const [, request, httpState] = useHttp(url, Object.assign(Object.assign({}, setting), { auto: false }));
    const [currentPagingData, setCurrentPagingData] = useState([]);
    const loadData = () => {
        if (httpState === 'pending')
            return;
        return request(Object.assign(Object.assign({}, querysRef.current), { [setting['indexKey']]: pageRef.current.target, [setting['sizeKey']]: pageRef.current.__size }))
            .then(res => {
            if (!res)
                return;
            pageRef.current.total = setting.totalPlucker(res);
            const list = setting.dataPlucker(res);
            if (pageRef.current.target === setting.start || !setting.scrollLoading) {
                setCurrentPagingData(list);
            }
            else {
                setCurrentPagingData(val => val.concat(list));
            }
        });
    };
    const fresh = (param = {}) => {
        querysRef.current = Object.assign(Object.assign({}, querys), param);
        pageRef.current.target = setting.start;
        setCurrentPagingData([]);
        loadData();
    };
    const refresh = (param = {}) => {
        querysRef.current = Object.assign(Object.assign(Object.assign({}, querys), querysRef.current), param);
        pageRef.current.target = setting.start;
        setCurrentPagingData([]);
        loadData();
    };
    const reset = () => {
        querysRef.current = querys;
        pageRef.current.target = setting.start;
        setCurrentPagingData([]);
        loadData();
    };
    const nextPage = () => {
        if (pagingState === 'fulled')
            return;
        pageRef.current.target = pageRef.current.__index + 1;
        loadData();
    };
    useEffect(() => {
        if (setting.auto)
            loadData();
    }, []);
    useUpdateEffect(() => {
        httpState === 'success' && (pageRef.current.__index = pageRef.current.target); // 只有在请求成功时才能将当前页index值更新为目标页target 
    }, [httpState]);
    /** 根据请求结果设置分页请求状态 */
    const pagingState = useMemo(() => {
        switch (httpState) {
            default:
                return 'refreshing';
            case 'pending':
                if (pageRef.current.target === setting.start) {
                    return 'refreshing';
                }
                else {
                    return 'loading';
                }
            case 'success':
                if (pageRef.current.target === setting.start && !(currentPagingData === null || currentPagingData === void 0 ? void 0 : currentPagingData.length))
                    return 'empty';
                if (currentPagingData.length < pageRef.current.__size)
                    return 'fulled';
                if (currentPagingData.length >= pageRef.current.total)
                    return 'fulled';
                return 'unfulled';
        }
    }, [httpState]);
    return [
        currentPagingData,
        { fresh, refresh, reset, nextPage },
        { pagingState, httpState, pageInfo: pageRef.current }
    ];
}

export { CACHE_MAP, CUSTOME_REQUEST, HTTP_INTERCEPT, PAGING_SETTING, SERVICE_CONTEXT, createComponentWithProvider, createServiceComponent, useDebounceCallback, useHistoryState, useHttp, usePaging, usePrevious, useRefState, useServiceHook, useUpdateCount, useUpdateEffect, useWatchEffect };
//# sourceMappingURL=hook-stash.es.js.map
