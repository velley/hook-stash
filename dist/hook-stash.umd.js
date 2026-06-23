(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('rxjs')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'rxjs'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.index = {}, global.React, global.rxjs));
})(this, (function (exports, React, rxjs) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  const SERVICE_CONTEXT = React.createContext(null);
  /**
   * @deprecated Provider 的解析已改由 SERVICE_CONTEXT 完成。
   * 保留该导出仅用于兼容旧版本，不再参与依赖注入流程。
   */
  const ACTIVE_CACHE = { providers: null };

  /**
   * @description 生成一个symbol标识
   */
  function useSymbol() {
      const symbol = React.useRef(Symbol('a unique symbol id for current functional component'));
      return symbol.current;
  }

  const PROVIDER_REGISTRY_CONTEXT = React.createContext(null);
  function createProviderRegistry(parent, tokens) {
      return {
          parent,
          providers: new Map(tokens.map(token => [
              token,
              { token, current: null, status: 'pending' },
          ])),
      };
  }
  function findProviderSlot(registry, token, skipCurrent) {
      if (!skipCurrent) {
          const slot = registry.providers.get(token);
          if (slot)
              return slot;
      }
      return registry.parent ? findProviderSlot(registry.parent, token, false) : null;
  }

  const PROVIDER_TOKENS = new WeakMap();
  function createToken(name) {
      return Symbol(name);
  }
  /**
   * 根据 Hook 函数引用获取稳定 token。
   * WeakMap 只保存 Hook 到 token 的静态映射，不记录任何渲染中的活动状态。
   */
  function getProviderToken(hook) {
      if (hook.token)
          return hook.token;
      const target = hook;
      let token = PROVIDER_TOKENS.get(target);
      if (!token) {
          token = createToken(hook.name || 'anonymous provider hook');
          PROVIDER_TOKENS.set(target, token);
      }
      return token;
  }

  const useProviderCommitEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
  function isProviderObject(value) {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  /**
   * 将一个普通 Hook 固定到独立的 React 组件中。
   * Hook 的状态归当前 Provider 组件实例所有，返回值通过 Context 向下共享。
   */
  function createHookProvider(useProvider, token) {
      const HookProvider = ({ children }) => {
          const parentInjector = React.useContext(SERVICE_CONTEXT);
          const registry = React.useContext(PROVIDER_REGISTRY_CONTEXT);
          const id = useSymbol();
          const value = useProvider();
          const validProviderValue = isProviderObject(value);
          const provider = {
              token,
              value,
              origin: useProvider,
              status: 'committed',
              type: 'hook',
          };
          // lazy 注入只能读取已提交的 Provider，避免中断渲染污染当前实例。
          useProviderCommitEffect(() => {
              if (!registry || !validProviderValue)
                  return;
              const slot = registry.providers.get(token);
              if (!slot)
                  return;
              slot.current = value;
              slot.status = 'ready';
              return () => {
                  if (slot.current === value) {
                      slot.current = null;
                      slot.status = 'pending';
                  }
              };
          }, [registry, validProviderValue, value]);
          if (!validProviderValue) {
              throw new TypeError(`Provider Hook(${useProvider.name || token.description || 'anonymous'})必须返回非 null、非数组的 object 对象`);
          }
          if (!registry) {
              throw new Error('Provider Registry 未创建，请通过createComponent注册Provider Hook');
          }
          const injector = {
              id,
              name: useProvider.name || token.description || 'AnonymousProvider',
              providers: new Map([[token, provider]]),
              parent: parentInjector,
          };
          return (React__default["default"].createElement(SERVICE_CONTEXT.Provider, { value: injector }, children));
      };
      HookProvider.displayName = `${useProvider.name || 'Anonymous'}Provider`;
      return HookProvider;
  }
  function createComponent(Comp, hooks) {
      // 在组件工厂阶段生成稳定的 Provider 组件类型，不能放到渲染函数内部。
      // Map 同时保持旧实现中“相同 token 只注册一次”的行为。
      const hooksByToken = new Map();
      hooks.forEach(hook => hooksByToken.set(getProviderToken(hook), hook));
      const providerEntries = Array.from(hooksByToken.entries());
      const providerTokens = providerEntries.map(([token]) => token);
      const ProviderComponents = providerEntries.map(([token, hook]) => createHookProvider(hook, token));
      const ComponentWithProviders = (props) => {
          const parentRegistry = React.useContext(PROVIDER_REGISTRY_CONTEXT);
          const registry = React.useMemo(() => createProviderRegistry(parentRegistry, providerTokens), [parentRegistry]);
          let content = React__default["default"].createElement(Comp, Object.assign({}, props));
          // hooks[0] 位于最外层；立即注入仍然遵循由前向后的依赖顺序。
          for (let index = ProviderComponents.length - 1; index >= 0; index -= 1) {
              const Provider = ProviderComponents[index];
              content = React__default["default"].createElement(Provider, null, content);
          }
          return (React__default["default"].createElement(PROVIDER_REGISTRY_CONTEXT.Provider, { value: registry }, content));
      };
      ComponentWithProviders.displayName = `WithProviders(${Comp.displayName || Comp.name || 'Component'})`;
      return React__default["default"].memo(ComponentWithProviders);
  }
  /**
   * @deprecated Provider Hook 现在由独立组件执行。
   * 保留该函数仅兼容旧版本中意外暴露的内部符号。
   */
  const __runProvider = (provider) => provider.value;

  function useInjector(input, options) {
      // 两个 Context 始终在固定位置读取，options.lazy 可安全地在不同渲染间切换。
      const injector = React.useContext(SERVICE_CONTEXT);
      const registry = React.useContext(PROVIDER_REGISTRY_CONTEXT);
      const token = typeof input === 'symbol' ? input : getProviderToken(input);
      const optional = (options === null || options === void 0 ? void 0 : options.optional) === true;
      const skipOne = (options === null || options === void 0 ? void 0 : options.skipOne) === true;
      const providerName = typeof input === 'function' ? input.name : token.description;
      const getLazyProvider = React.useCallback(() => {
          const slot = registry ? findProviderSlot(registry, token, skipOne) : null;
          if ((slot === null || slot === void 0 ? void 0 : slot.status) === 'ready' && slot.current) {
              return slot.current;
          }
          if (optional)
              return null;
          if (!registry) {
              throw new Error('未找到Provider Registry，请在createComponent创建的组件树中使用lazy注入');
          }
          throw new Error(`Provider(${providerName || token.description || '指定 token'})尚未提交或已经卸载。` +
              'lazy Provider 只能在事件回调、异步方法或useEffect中读取，不能在渲染阶段立即执行。');
      }, [optional, providerName, registry, skipOne, token]);
      if (options === null || options === void 0 ? void 0 : options.lazy)
          return getLazyProvider;
      const provider = injector ? findProviderByInjector(injector, token, skipOne) : null;
      if (provider)
          return provider.value;
      if (optional)
          return null;
      if (!injector) {
          throw new Error('未找到注入器，请使用createComponent创建组件并通过providers参数提供对应依赖');
      }
      throw new Error(`未找到${providerName || token.description || '指定 token'}的依赖值。` +
          '反向或循环依赖请使用useInjector(provider, { lazy: true })延迟解析。');
  }
  function findProviderByInjector(node, token, skipCurrent) {
      if (!skipCurrent) {
          const provider = node.providers.get(token);
          if (provider)
              return provider;
      }
      return node.parent ? findProviderByInjector(node.parent, token, false) : null;
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
          this.signalArray = [];
          this.id = id;
          this.callback = callback;
          EffectWatcher.EFFECT_WATCHER.push(this);
          EffectWatcher.ACTIVE_WATCHER = this;
          const result = callback(id); //watcher实例创建完毕后默认执行回调函数，用于触发函数中的signal getter以便进行依赖注册
          EffectWatcher.ACTIVE_WATCHER = null; // 执行完毕后需要将activeWatcher置空
          if (listener) {
              this.__listener = listener;
              this.__listener.next(result);
          }
      }
      registerSignal(signal) {
          if (this.signalArray.includes(signal))
              return;
          this.signalArray.push(signal);
      }
      load() {
          const observables = this.signalArray.map(signal => signal.observable);
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

  function __createRenderWatcher(id, callback) {
      const exit = RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
      if (exit) {
          RenderWatcher.ACTIVE_WATCHER = exit;
          return exit;
      }
      const watcher = new RenderWatcher({ id, callback });
      return watcher;
  }
  function __findRenderWatcher(id) {
      if (id)
          return RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
      const watcher = RenderWatcher.ACTIVE_WATCHER || RenderWatcher.RENDER_WATCHER[RenderWatcher.RENDER_WATCHER.length - 1];
      return watcher;
  }
  class RenderWatcher {
      constructor({ id, callback }) {
          this.signalArray = [];
          this.id = id;
          this.callback = callback;
          RenderWatcher.RENDER_WATCHER.push(this);
          RenderWatcher.ACTIVE_WATCHER = this;
          this.context = React.createContext(this);
      }
      registerSignal(signal) {
          if (this.signalArray.includes(signal))
              return;
          this.signalArray.push(signal);
      }
      load() {
          const observables = this.signalArray.map(signal => signal.observable);
          this.__subscription = rxjs.combineLatest(observables).pipe(rxjs.skip(1)).subscribe(() => {
              this.callback();
          });
          //订阅后需要立即将当前watcher移除
          RenderWatcher.ACTIVE_WATCHER = null;
          const index = RenderWatcher.RENDER_WATCHER.findIndex(watcher => watcher.id === this.id);
          if (index > -1)
              RenderWatcher.RENDER_WATCHER.splice(index, 1);
      }
      unload() {
          this.__subscription.unsubscribe();
      }
  }
  RenderWatcher.RENDER_WATCHER = [];
  RenderWatcher.ACTIVE_WATCHER = null;

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
   * const [getValue, setValue] = useSignal(0);
   * cont count = getValue.useState();
   * useEffect(() => {
   *  setTimeout(() => {
   *    setValue(value => value + 1);
   *  }, 1000)
   * }, [setValue])
   * return <div>{count}</div>
   */
  function useSignal(initValue) {
      const subject = React.useRef(new rxjs.BehaviorSubject(initValue));
      const getValue = React.useRef(getValueFunc);
      const setValue = React.useRef(setValueFunc);
      function getValueFunc(symbol) {
          //获取effectWatcher，将当前的signal注册到watcher中
          const effectWatcher = __findEffectWatcher(symbol);
          effectWatcher === null || effectWatcher === void 0 ? void 0 : effectWatcher.registerSignal(getValue.current);
          //获取renderWatcher，将当前的signal注册到watcher中
          const renderWathcer = __findRenderWatcher(symbol);
          if (renderWathcer)
              renderWathcer.registerSignal(getValue.current);
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

  const Render = React.memo((props) => {
      const { children } = props;
      const id = useSymbol();
      const [_trigger, setTrigger] = React.useState(0);
      const handler = () => {
          setTrigger(v => v + 1);
      };
      const watcherRef = __createRenderWatcher(id, handler);
      React.useEffect(() => {
          watcherRef.load();
          return () => watcherRef.unload();
      });
      return children(id);
  });
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

  function useComputed(inputFn) {
      const subject = React.useRef(new rxjs.BehaviorSubject(null));
      const getValue = React.useRef(getValueFunc);
      function getValueFunc(symbol) {
          //获取effectWatcher，将当前的signal注册到watcher中
          const watcher = __findEffectWatcher(symbol);
          watcher === null || watcher === void 0 ? void 0 : watcher.registerSignal(getValue.current);
          //获取renderWatcher，将当前的signal注册到watcher中
          const renderWathcer = __findRenderWatcher(symbol);
          if (renderWathcer)
              renderWathcer.registerSignal(getValue.current);
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
      React.useEffect(() => {
          watcher.current = __createEffectWatcher(id, inputFn, subject.current);
          watcher.current.load();
          return () => { var _a; return (_a = watcher.current) === null || _a === void 0 ? void 0 : _a.unload(); };
      }, []);
      return getValue.current;
  }

  function useReady(callback) {
      const hasLoaded = React.useRef(false);
      if (!hasLoaded.current) {
          callback();
          hasLoaded.current = true;
      }
  }

  function useDestroy(callback) {
      React.useEffect(() => {
          return () => {
              callback();
          };
      }, []);
  }

  function useWatchEffect(callback) {
      const id = useSymbol();
      const watcher = React.useRef();
      useReady(() => {
          var _a;
          watcher.current = __createEffectWatcher(id, callback);
          (_a = watcher.current) === null || _a === void 0 ? void 0 : _a.load();
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
          const fn = callback();
          return () => {
              if (typeof fn === "function")
                  fn();
          };
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
      if (!obj)
          return '';
      let str = '';
      for (let key in obj) {
          str += `${key}=${obj[key]}&`;
      }
      return str;
  }

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  function __rest(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
              if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
          }
      return t;
  }

  const DEFAULT_HTTP_OPTIONS = {
      auto: false,
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      },
      reqData: {}
  };
  /**
   * @description ajax请求，默认通过fetch发送请求，可通过di依赖注入方式提供自定义请求方法
   * @param url 请求地址，必传
   * @param localOptions 请求配置项 选传
   * @returns  [请求结果, 请求方法, 请求状态, 错误信息]
   */
  function useHttpClient(url, localOptions = {}) {
      /** 设置请求配置以及上层组件注入进来的配置项 */
      const options = Object.assign(Object.assign(Object.assign({}, DEFAULT_HTTP_OPTIONS), localOptions), { url });
      const intercept = useInjector(HTTP_INTERCEPT, { optional: true });
      const customeReq = useInjector(CUSTOME_REQUEST, { optional: true });
      /** 定义http请求的相关状态变量 */
      const [res, setRes] = useSignal(options.defaultValue);
      const [err, setErr] = useSignal(null);
      const [state, setState] = useSignal('ready');
      const request = React.useRef((query = {}) => {
          setState('pending');
          setErr(null);
          return new Promise(resolve => {
              if (intercept === null || intercept === void 0 ? void 0 : intercept.requestIntercept) {
                  intercept.requestIntercept(Object.assign(Object.assign({}, options), { reqData: query })).then(finalOptions => resolve(finalOptions));
              }
              else {
                  resolve(Object.assign(Object.assign({}, options), { reqData: query }));
              }
          })
              .then(options2 => {
              const method = normalizeMethod(options2.method);
              const normalizedOptions = Object.assign(Object.assign({}, options2), { method });
              const reqData = normalizedOptions.reqData;
              if (customeReq) {
                  return customeReq.req(normalizedOptions.url, normalizedOptions);
              }
              else {
                  const { url: requestUrl, reqData: _reqData, auto: _auto, defaultValue: _defaultValue } = normalizedOptions, fetchOptions = __rest(normalizedOptions, ["url", "reqData", "auto", "defaultValue"]);
                  let finalUrl = requestUrl;
                  if (['GET', 'HEAD'].includes(method)) {
                      const search = objectToUrlSearch(reqData);
                      if (search) {
                          finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${search}`;
                      }
                      delete fetchOptions.body;
                  }
                  else {
                      if (reqData instanceof FormData) {
                          fetchOptions.body = reqData;
                          fetchOptions.headers = withoutJsonContentType(fetchOptions.headers);
                      }
                      else {
                          fetchOptions.body = JSON.stringify(reqData);
                      }
                  }
                  return fetch(finalUrl, fetchOptions);
              }
          })
              .then(response => {
              const res = response;
              const resIntercept = intercept === null || intercept === void 0 ? void 0 : intercept.responseIntercept;
              if (customeReq) {
                  return resIntercept ? resIntercept(res) : res;
              }
              else {
                  return parseResponse(res).then((re) => resIntercept ? resIntercept(re) : re);
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
              if (intercept === null || intercept === void 0 ? void 0 : intercept.errorIntercept) {
                  intercept.errorIntercept(err);
              }
              throw err instanceof Error ? err : new Error(String(err));
          });
      });
      useReady(() => {
          if (options.auto)
              request.current(options.reqData);
      });
      return [res, request.current, state, err];
  }
  function objectToUrlSearch(obj) {
      if (!obj)
          return '';
      return Object.keys(obj)
          .filter(key => obj[key] !== undefined)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key] == null ? '' : String(obj[key]))}`)
          .join('&');
  }
  function normalizeMethod(method) {
      return (method || 'GET').toUpperCase();
  }
  function parseResponse(response) {
      if (response.status === 204 || response.status === 205) {
          return Promise.resolve(undefined);
      }
      return response.text().then(text => {
          const body = text.trim();
          return body ? JSON.parse(body) : undefined;
      });
  }
  function withoutJsonContentType(headers) {
      var _a;
      if (!headers)
          return headers;
      if (headers instanceof Headers) {
          const finalHeaders = new Headers(headers);
          if (((_a = finalHeaders.get('Content-Type')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'application/json') {
              finalHeaders.delete('Content-Type');
          }
          return finalHeaders;
      }
      const finalHeaders = Object.assign({}, headers);
      const contentTypeKey = Object.keys(finalHeaders)
          .find(key => key.toLowerCase() === 'content-type');
      if (contentTypeKey && String(finalHeaders[contentTypeKey]).toLowerCase() === 'application/json') {
          delete finalHeaders[contentTypeKey];
      }
      return finalHeaders;
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
      const [currentPagingData, setCurrentPagingData] = useSignal([]);
      const loadData = () => {
          if (httpState() === 'pending')
              return Promise.resolve();
          return request(Object.assign(Object.assign({}, querysRef.current), { [setting['indexKey']]: pageRef.current.target, [setting['sizeKey']]: pageRef.current.__size }))
              .then(res => {
              if (!res)
                  return;
              pageRef.current.total = setting.totalPlucker(res);
              const list = setting.dataPlucker(res);
              pageRef.current.__index = pageRef.current.target;
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
          loadData();
      };
      const refresh = (param = {}) => {
          querysRef.current = Object.assign(Object.assign(Object.assign({}, querys), querysRef.current), param);
          pageRef.current.target = setting.start;
          return loadData();
      };
      const reset = () => {
          querysRef.current = querys;
          pageRef.current.target = setting.start;
          return loadData();
      };
      const nextPage = () => {
          if (pagingState() === 'fulled')
              return;
          pageRef.current.target = pageRef.current.__index + 1;
          return loadData();
      };
      useReady(() => {
          if (setting.auto)
              loadData();
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
  exports.useSignal = useSignal;
  exports.useWatchEffect = useWatchEffect;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=hook-stash.umd.js.map
