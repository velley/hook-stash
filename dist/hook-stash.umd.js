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
              React__default["default"].createElement(Comp, { ...props })));
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

  exports.createServiceComponent = createServiceComponent;
  exports.useServiceHook = useServiceHook;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=hook-stash.umd.js.map
