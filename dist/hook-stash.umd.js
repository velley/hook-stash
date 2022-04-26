(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.index = {}, global.React));
})(this, (function (exports, React) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  const SERVICE_CONTEXT = React.createContext(null);
  const CACHE_MAP = {};

  function createServiceComponent(Comp, hooks) {
      return React__default["default"].memo((props) => {
          const topContextVal = React.useContext(SERVICE_CONTEXT);
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
          return (React__default["default"].createElement(SERVICE_CONTEXT.Provider, { value: dependsMap },
              React__default["default"].createElement(Comp, Object.assign({}, props))));
      });
  }

  function useServiceHook(input, optional) {
      const token = typeof input === 'symbol' ? input : input.token;
      const contextVal = React.useContext(SERVICE_CONTEXT);
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
      const timeRef = React.useRef(null);
      const runner = React.useCallback(callback, deps);
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
      const prevRef = React.useRef();
      const curRef = React.useRef();
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
      const [state, setState] = React.useState(refState);
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
      const [logs, setLogs] = React.useState([]);
      React.useEffect(() => {
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
      const counter = React.useRef(0);
      const changesRef = React.useRef([]);
      deps.forEach((dep, index) => {
          changesRef.current[index] = usePrevious(dep);
      });
      React.useEffect(() => {
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
      const runCount = React.useRef(0);
      const caches = React.useRef([]);
      React.useEffect(() => {
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
      const [count, setCount] = React.useState(0);
      const before = usePrevious(state);
      useUpdateEffect(() => {
          if (options === null || options === void 0 ? void 0 : options.deep) {
              let changed;
              for (let key in state) {
                  if (state[key] !== before[key]) {
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
      const [res, setRes] = React.useState();
      const [err, setErr] = React.useState();
      const [state, setState] = React.useState('ready');
      const request = (query = {}) => {
          setState('pending');
          return new Promise(resolve => {
              if (intercept === null || intercept === void 0 ? void 0 : intercept.requestIntercept) {
                  intercept.requestIntercept(localOption).then(final => resolve(final));
              }
              else
                  resolve(localOption);
          })
              .then(options => {
              let reqData = Object.assign(Object.assign({}, options.reqData), query);
              if (customeReq) {
                  return customeReq(options.url, Object.assign(Object.assign({}, options), { reqData }));
              }
              else {
                  if (['GET', 'HEAD'].includes(options.method)) {
                      const searchKeys = `?${objectToUrlSearch(reqData)}`;
                      options.url += searchKeys;
                  }
                  else {
                      options.body = JSON.stringify(reqData);
                      delete options.reqData;
                  }
                  return fetch(options.url, options);
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
              console.log(err);
              setState('failed');
              setErr(err);
          });
      };
      React.useEffect(() => {
          if (options.auto)
              request();
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
      const globalSetting = useServiceHook(PAGING_SETTING, 'optional');
      const setting = Object.assign(Object.assign(Object.assign({}, LocalPagingSetting), (globalSetting || {})), localSetting);
      /** 初始化条件查询对象 */
      const querysRef = React.useRef(querys);
      /** 初始化分页信息 */
      const pageRef = React.useRef({});
      React.useLayoutEffect(() => {
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
      const [res, request, httpState] = useHttp(url, Object.assign(Object.assign({}, setting), { auto: false }));
      const loadData = () => {
          if (httpState === 'pending')
              return;
          return request(Object.assign(Object.assign({}, querysRef.current), { [setting['indexKey']]: pageRef.current.target, [setting['sizeKey']]: pageRef.current.__size }));
      };
      const refresh = (param = {}) => {
          querysRef.current = Object.assign(Object.assign(Object.assign({}, querys), querysRef.current), param);
          pageRef.current.target = setting.start;
          loadData();
      };
      const reset = () => {
          querysRef.current = querys;
          pageRef.current.target = setting.start;
          loadData();
      };
      const nextPage = () => {
          if (pagingState === 'fulled')
              return;
          pageRef.current.target = pageRef.current.__index + 1;
          loadData();
      };
      React.useEffect(() => {
          if (setting.auto)
              loadData();
      }, []);
      /** 根据请求结果设置分页数据 */
      const currentPagingData = React.useMemo(() => res ? setting.dataPlucker(res) : [], [res]);
      const concatedRef = React.useRef([]);
      useUpdateEffect(() => {
          httpState === 'success' && (pageRef.current.__index = pageRef.current.target); // 只有在请求成功时才能将当前页index值更新为目标页target 
      }, [httpState]);
      useUpdateEffect(() => {
          if (pageRef.current.target === setting.start) {
              concatedRef.current = currentPagingData;
          }
          else {
              if (setting.scrollLoading)
                  concatedRef.current = concatedRef.current.concat(currentPagingData);
          }
      }, [currentPagingData]);
      useUpdateEffect(() => {
          pageRef.current.total = setting.totalPlucker(res);
      }, [res]);
      /** 根据请求结果设置分页请求状态 */
      const pagingState = React.useMemo(() => {
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
                  if (concatedRef.current.length >= pageRef.current.total)
                      return 'fulled';
                  return 'unfulled';
          }
      }, [httpState]);
      return [
          setting.scrollLoading ? concatedRef.current : currentPagingData,
          { refresh, reset, nextPage },
          { pagingState, httpState }
      ];
  }

  exports.CACHE_MAP = CACHE_MAP;
  exports.CUSTOME_REQUEST = CUSTOME_REQUEST;
  exports.HTTP_INTERCEPT = HTTP_INTERCEPT;
  exports.PAGING_SETTING = PAGING_SETTING;
  exports.SERVICE_CONTEXT = SERVICE_CONTEXT;
  exports.createServiceComponent = createServiceComponent;
  exports.useDebounceCallback = useDebounceCallback;
  exports.useHistoryState = useHistoryState;
  exports.useHttp = useHttp;
  exports.usePaging = usePaging;
  exports.usePrevious = usePrevious;
  exports.useRefState = useRefState;
  exports.useServiceHook = useServiceHook;
  exports.useUpdateCount = useUpdateCount;
  exports.useUpdateEffect = useUpdateEffect;
  exports.useWatchEffect = useWatchEffect;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=hook-stash.umd.js.map
