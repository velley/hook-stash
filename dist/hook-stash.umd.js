(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('rxjs')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'rxjs'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.index = {}, global.React, global.rxjs));
})(this, (function (exports, React, rxjs) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  const SERVICE_CONTEXT = React.createContext(null);
  const ACTIVE_CACHE = { providers: null };

  /**
   * @description 生成一个symbol标识
   */
  function useSymbol() {
      const symbol = React.useRef(Symbol('a unique symbol id for current functional component'));
      return symbol.current;
  }

  function createComponent(Comp, hooks) {
      return React__default["default"].memo((props) => {
          const id = useSymbol();
          // 获取父级注入器
          const parentInjector = React.useContext(SERVICE_CONTEXT);
          // 为当前组件上下文创建注入器
          const injector = {
              id,
              name: Comp.name,
              providers: new Map(),
              parent: parentInjector,
          };
          // 创建注入器providers
          for (let hook of hooks) {
              if (!hook.token)
                  hook.token = Symbol(hook.name);
              const token = hook.token;
              const provider = { token, value: {}, origin: hook, status: 'idle', type: 'hook' };
              injector.providers.set(token, provider);
          }
          // 将当前组件注入器的providers赋值给ACTIVE_INJECTOR作为临时存储
          ACTIVE_CACHE.providers = injector.providers;
          /** 解析并执行providers中的hook函数，并将调用结果存入dependsMap与CACHE_MAP */
          ACTIVE_CACHE.providers.forEach(__runProvider);
          // 执行完毕后需要清空临时存储
          ACTIVE_CACHE.providers = null;
          return (React__default["default"].createElement(SERVICE_CONTEXT.Provider, { value: injector },
              React__default["default"].createElement(Comp, Object.assign({}, props))));
      });
  }
  const __runProvider = (provider) => {
      if (provider.status !== 'idle')
          return;
      provider.status = 'pending';
      if (provider.type === 'hook') {
          const hook = provider.origin;
          const result = hook();
          // 若result类型为对象，则将其合并到provider.value中，否则抛出错误
          if (typeof result === 'object' && result !== null) {
              Object.assign(provider.value, result);
          }
          else {
              throw new Error('provider hook函数必须返回一个对象');
          }
      }
      else {
          throw new Error('暂不支持的provider类型');
      }
      provider.status = 'committed';
      return provider.value;
  };

  function useInjector(input, options) {
      const token = (typeof input === 'symbol' ? input : input.token);
      let depends;
      if (ACTIVE_CACHE.providers && ACTIVE_CACHE.providers.has(token)) {
          const provider = ACTIVE_CACHE.providers.get(token);
          depends = provider.value;
          if (provider.status === 'idle') {
              __runProvider(provider);
          }
          if (provider.status === 'pending') {
              console.error(`hook函数(${provider.origin.name})存在循环依赖，可能导致无法正常获取依赖值`);
          }
      }
      else {
          const injector = React.useContext(SERVICE_CONTEXT);
          if (!injector)
              throw new Error('未找到注入器，请使用createComponent创建组件并通过provider参数提供对应依赖');
          depends = findDepsByInjector(injector, token, options);
      }
      if (depends) {
          return depends;
      }
      if (options && options.optional === true) {
          return null;
      }
      else {
          throw new Error(`未找到${token.description}的依赖值，请在上层Component中提供对应的providers`);
      }
  }
  function findDepsByInjector(node, token, options) {
      var _a;
      const deps = (_a = node.providers.get(token)) === null || _a === void 0 ? void 0 : _a.value;
      if (deps && !(options === null || options === void 0 ? void 0 : options.skipOne))
          return deps;
      if (node.parent)
          return findDepsByInjector(node.parent, token);
      if (!node.parent)
          return null;
  }

  function __createEffectWatcher(id, callback, listener) {
      const exit = EffectWatcher.EFFECT_WATCHER.find(watcher => watcher.id === id);
      if (exit)
          return exit;
      const watcher = new EffectWatcher({ id, callback, listener });
      return watcher;
  }
  function __findEffectWatcher(id) {
      if (id) {
          return EffectWatcher.EFFECT_WATCHER.find(watcher => watcher.id === id);
      }
      else {
          return EffectWatcher.ACTIVE_WATCHER;
      }
  }
  class EffectWatcher {
      constructor({ id, callback, listener }) {
          this.stashArray = [];
          this.id = id;
          this.callback = callback;
          EffectWatcher.EFFECT_WATCHER.push(this);
          EffectWatcher.ACTIVE_WATCHER = this;
          const result = callback(id); //watcher实例创建完毕后默认执行回调函数，用于触发函数中的stash getter以便进行依赖注册
          EffectWatcher.ACTIVE_WATCHER = null; // 执行完毕后需要将activeWatcher置空
          if (listener) {
              this.__listener = listener;
              this.__listener.next(result);
          }
      }
      registerStash(stash) {
          if (this.stashArray.includes(stash))
              return;
          this.stashArray.push(stash);
      }
      load() {
          const observables = this.stashArray.map(stash => stash.observable);
          this.__subscription = rxjs.combineLatest(observables).pipe(rxjs.skip(1)).subscribe(() => {
              const res = this.callback(this.id);
              if (this.__listener)
                  this.__listener.next(res);
          });
      }
      unload() {
          const index = EffectWatcher.EFFECT_WATCHER.findIndex(watcher => watcher.id === this.id);
          if (index > -1)
              EffectWatcher.EFFECT_WATCHER.splice(index, 1);
          this.__subscription.unsubscribe();
      }
  }
  EffectWatcher.EFFECT_WATCHER = [];
  EffectWatcher.ACTIVE_WATCHER = null;

  function useDestroy(callback) {
      React.useEffect(() => {
          return () => {
              callback();
          };
      }, []);
  }

  function __createRenderWatcher(id, callback) {
      const exit = RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
      if (exit)
          return exit;
      const watcher = new RenderWatcher({ id, callback });
      return watcher;
  }
  function __findRenderWatcher(id) {
      if (id) {
          return RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
      }
      else {
          return RenderWatcher.RENDER_WATCHER[RenderWatcher.RENDER_WATCHER.length - 1];
      }
  }
  class RenderWatcher {
      constructor({ id, callback }) {
          this.stashArray = [];
          this.id = id;
          this.callback = callback;
          RenderWatcher.RENDER_WATCHER.push(this);
          this.context = React.createContext(this);
      }
      registerStash(stash) {
          if (this.stashArray.includes(stash))
              return;
          this.stashArray.push(stash);
      }
      load() {
          const observables = this.stashArray.map(stash => stash.observable);
          this.__subscription = rxjs.combineLatest(observables).pipe(rxjs.skip(1)).subscribe(() => {
              this.callback();
          });
          RenderWatcher.RENDER_WATCHER.pop(); //订阅后需要立即移除最新的watcher
      }
      unload() {
          this.__subscription.unsubscribe();
      }
  }
  RenderWatcher.RENDER_WATCHER = [];

  /**
   * @function 创建一个可观察值
   * @description
   * - 内部基于rxjs的BehaviorSubject实现
   * - 返回可观察值的监听与变更方法，区别于useState，调用变更方法时不会触发函数组件重新调用
   * - 可在hook函数中替代原本使用useState的场景
   * @param initValue
   * @returns
   *  - getValue 用于获取实时值
   *  - setValue 用于设置值，可以传入一个新值或者一个函数，函数接受旧值并返回新值
   * @example
   * const [getValue, setValue] = useStash(0);
   * cont count = getValue.useState();
   * useEffect(() => {
   *  setTimeout(() => {
   *    setValue(value => value + 1);
   *  }, 1000)
   * }, [setValue])
   * return <div>{count}</div>
   */
  function useStash(initValue) {
      const subject = React.useRef(new rxjs.BehaviorSubject(initValue));
      const getValue = React.useRef(getValueFunc);
      const setValue = React.useRef(setValueFunc);
      useDestroy(() => {
          var _a;
          (_a = subject.current) === null || _a === void 0 ? void 0 : _a.complete();
      });
      function getValueFunc(symbol) {
          //获取effectWatcher，将当前的stash注册到watcher中
          const effectWatcher = __findEffectWatcher(symbol);
          effectWatcher === null || effectWatcher === void 0 ? void 0 : effectWatcher.registerStash(getValue.current);
          //获取renderWatcher，将当前的stash注册到watcher中
          const renderWathcer = __findRenderWatcher(symbol);
          if (renderWathcer)
              renderWathcer.registerStash(getValue.current);
          return subject.current.getValue();
      }
      getValueFunc.observable = subject.current.asObservable();
      getValueFunc.useState = function () {
          const [state, setState] = React.useState(subject.current.getValue());
          React.useEffect(() => {
              const subscription = subject.current.subscribe(setState);
              return () => {
                  subscription.unsubscribe();
              };
          }, []);
          return state;
      };
      getValueFunc.watchEffect = function (callback) {
          React.useEffect(() => {
              let effectReturn;
              const subscription = subject.current.subscribe(value => {
                  effectReturn = callback(value);
                  if (effectReturn instanceof Function)
                      effectReturn();
              });
              return () => {
                  subscription.unsubscribe();
              };
          }, []);
      };
      function setValueFunc(newValue) {
          if (newValue instanceof Function) {
              subject.current.next(newValue(subject.current.getValue()));
          }
          else {
              subject.current.next(newValue);
          }
      }
      return [getValue.current, setValue.current];
  }

  function Render(props) {
      const id = useSymbol();
      const [trigger, setTrigger] = React.useState(0);
      const handler = () => {
          setTrigger(v => v + 1);
      };
      const watcher = __createRenderWatcher(id, handler);
      React.useEffect(() => {
          watcher.load();
          return () => watcher.unload();
      }, [trigger]);
      return props.children();
  }
  function render(nodeFn) {
      return React__default["default"].createElement(Render, null, nodeFn);
  }
  function SingleRender(props) {
      const { target, children, placeholder } = props;
      const value = target.useState();
      return (isNullOrUndefined(value) && placeholder) ? placeholder() : children(value);
  }
  function _singRender(target, map, placeholder) {
      const renderValue = (_value, _map) => {
          const result = _map ? _map(_value) : _value;
          if (!isValidReactNode(result) && typeof result === "object" && result !== null) {
              console.warn("render方法无法直接渲染引用类型，已自动转化为json字符串", _value);
              return JSON.stringify(result);
          }
          else {
              return result;
          }
      };
      return React__default["default"].createElement(SingleRender, { target: target, children: x => renderValue(x, map), placeholder: placeholder });
  }
  const $ = _singRender;
  // 判断输入值是否为合法的ReactNode
  function isValidReactNode(value) {
      if (Array.isArray(value)) {
          return value.every(React__default["default"].isValidElement);
      }
      return React__default["default"].isValidElement(value);
  }
  function isNullOrUndefined(value) {
      return value === null || value === undefined;
  }

  function useReady(callback) {
      const hasLoaded = React.useRef(false);
      if (!hasLoaded.current) {
          callback();
          hasLoaded.current = true;
      }
  }

  function useComputed(inputFn) {
      const subject = React.useRef(new rxjs.BehaviorSubject(null));
      const getValue = React.useRef(getValueFunc);
      useDestroy(() => {
          var _a;
          (_a = subject.current) === null || _a === void 0 ? void 0 : _a.complete();
      });
      function getValueFunc(symbol) {
          //获取effectWatcher，将当前的stash注册到watcher中
          const watcher = __findEffectWatcher(symbol);
          watcher === null || watcher === void 0 ? void 0 : watcher.registerStash(getValue.current);
          //获取renderWatcher，将当前的stash注册到watcher中
          const renderWathcer = __findRenderWatcher(symbol);
          if (renderWathcer)
              renderWathcer.registerStash(getValue.current);
          return subject.current.getValue();
      }
      getValueFunc.observable = subject.current.asObservable();
      getValueFunc.useState = function () {
          const [state, setState] = React.useState(subject.current.getValue());
          React.useEffect(() => {
              const subscription = subject.current.subscribe(setState);
              return () => {
                  subscription.unsubscribe();
              };
          }, []);
          return state;
      };
      getValueFunc.watchEffect = function (callback) {
          React.useEffect(() => {
              let effectReturn;
              const subscription = subject.current.subscribe(value => {
                  effectReturn = callback(value);
                  if (effectReturn instanceof Function)
                      effectReturn();
              });
              return () => {
                  subscription.unsubscribe();
              };
          }, []);
      };
      const id = useSymbol();
      const watcher = React.useRef();
      useReady(() => {
          watcher.current = __createEffectWatcher(id, inputFn, subject.current);
          watcher.current.load();
      });
      useDestroy(() => {
          var _a;
          (_a = watcher.current) === null || _a === void 0 ? void 0 : _a.unload();
      });
      return getValue.current;
  }

  function useWatchEffect(callback) {
      const id = useSymbol();
      const watcher = React.useRef();
      useReady(() => {
          watcher.current = __createEffectWatcher(id, callback);
          watcher.current.load();
      });
      useDestroy(() => {
          var _a;
          (_a = watcher.current) === null || _a === void 0 ? void 0 : _a.unload();
      });
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

  function useMounted(callback) {
      React.useEffect(() => {
          callback();
      }, []);
  }

  /** HTTP拦截器token */
  const HTTP_INTERCEPT = Symbol('供useHttp使用的请求拦截器');
  /** 自定义HTTP函数token */
  const CUSTOME_REQUEST = Symbol('自定义请求函数，以覆盖默认的fetch函数');
  /** Paging分页请求token */
  const PAGING_SETTING = Symbol('提供全局分页配置');

  /**
   * @deprecated useHttp方法即将废弃，请改用useHttpClient
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
      const options = React.useMemo(() => Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), localOptions, { url }), [localOptions, url]);
      const intercept = useInjector(HTTP_INTERCEPT, { optional: true });
      const customeReq = useInjector(CUSTOME_REQUEST, { optional: true });
      /** 定义http请求的相关状态变量 */
      const [res, setRes] = React.useState(options.defaultValue);
      const [err, setErr] = React.useState();
      const [state, setState] = React.useState('ready');
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
                  return customeReq.req(options2.url, Object.assign(Object.assign({}, options2), { reqData }));
              }
              else {
                  if (['GET', 'HEAD'].includes(options2.method) || !options2.method) {
                      const searchKeys = `?${objectToUrlSearch$1(reqData)}`;
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
      useReady(() => {
          if (options.auto)
              request(options.reqData);
      });
      return [res, request, state, err];
  }
  function objectToUrlSearch$1(obj) {
      console.log(obj);
      if (!obj)
          return '';
      let str = '';
      for (let key in obj) {
          str += `${key}=${obj[key]}&`;
      }
      return str;
  }

  /**
   * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入方式提供自定义请求方法
   * @param url 请求地址，必传
   * @param localOptions 请求配置项 选传
   * @returns  [请求结果, 请求方法, 请求状态, 错误信息]
   */
  function useHttpClient(url, localOptions = {}) {
      const DEFAULT_HTTP_OPTIONS = {
          auto: false,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          },
          reqData: {}
      };
      /** 设置请求配置以及上层组件注入进来的配置项 */
      const options = Object.assign(Object.create(DEFAULT_HTTP_OPTIONS), localOptions, { url });
      const intercept = useInjector(HTTP_INTERCEPT, { optional: true });
      const customeReq = useInjector(CUSTOME_REQUEST, { optional: true });
      /** 定义http请求的相关状态变量 */
      const [res, setRes] = useStash(options.defaultValue);
      const [err, setErr] = useStash(null);
      const [state, setState] = useStash('ready');
      const request = React.useRef((query = {}) => {
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
                  return customeReq.req(options2.url, Object.assign(Object.assign({}, options2), { reqData }));
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
      });
      useReady(() => {
          if (options.auto)
              request.current(options.reqData);
      });
      return [res, request.current, state, err];
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
      const globalSetting = useInjector(PAGING_SETTING, { optional: true });
      const setting = Object.assign(Object.assign(Object.assign({}, LocalPagingSetting), (globalSetting || {})), localSetting);
      /** 初始化条件查询对象 */
      const querysRef = React.useRef(querys);
      /** 初始化分页信息 */
      const pageRef = React.useRef({});
      useReady(() => {
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
      });
      /** 定义分页请求逻辑 */
      const [, request, httpState] = useHttpClient(url, Object.assign(Object.assign({}, setting), { auto: false }));
      const [currentPagingData, setCurrentPagingData] = useStash([]);
      const loadData = () => {
          if (httpState() === 'pending')
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
          if (pagingState() === 'fulled')
              return;
          pageRef.current.target = pageRef.current.__index + 1;
          loadData();
      };
      useReady(() => {
          if (setting.auto)
              loadData();
      });
      httpState.watchEffect(val => {
          if (val === 'success') {
              pageRef.current.__index = pageRef.current.target;
          }
      });
      /** 根据请求结果设置分页请求状态 */
      const pagingState = useComputed(() => {
          var _a;
          const dataLen = ((_a = currentPagingData()) === null || _a === void 0 ? void 0 : _a.length) || 0;
          switch (httpState()) {
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
                  if (pageRef.current.target === setting.start && !dataLen)
                      return 'empty';
                  if (dataLen < pageRef.current.__size)
                      return 'fulled';
                  if (dataLen >= pageRef.current.total)
                      return 'fulled';
                  return 'unfulled';
          }
      });
      return [
          currentPagingData,
          { fresh, refresh, reset, nextPage },
          { pagingState, httpState, pageInfo: pageRef.current }
      ];
  }

  exports.$ = $;
  exports.ACTIVE_CACHE = ACTIVE_CACHE;
  exports.CUSTOME_REQUEST = CUSTOME_REQUEST;
  exports.HTTP_INTERCEPT = HTTP_INTERCEPT;
  exports.PAGING_SETTING = PAGING_SETTING;
  exports.Render = Render;
  exports.SERVICE_CONTEXT = SERVICE_CONTEXT;
  exports.__runProvider = __runProvider;
  exports.createComponent = createComponent;
  exports.render = render;
  exports.useComputed = useComputed;
  exports.useDestroy = useDestroy;
  exports.useHttp = useHttp;
  exports.useHttpClient = useHttpClient;
  exports.useInjector = useInjector;
  exports.useMounted = useMounted;
  exports.usePaging = usePaging;
  exports.useReady = useReady;
  exports.useRefState = useRefState;
  exports.useStash = useStash;
  exports.useWatchEffect = useWatchEffect;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=hook-stash.umd.js.map
