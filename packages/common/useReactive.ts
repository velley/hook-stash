import { useRefState } from "./useRefState"

/**
 * @function 将普通对象变为由Proxy包装的代理对象，更改对象中的属性值时，会自动触发setState方法并引起函数式组件重新执行
 * @param state 初始对象
 * @returns proxy 代理对象
 */
export function useReactive<T extends object>(state: T) {
  const [pState, setState] = useRefState(state)
  const proxy = new Proxy(pState, {
    set(target, prop, value) {
      if(target[prop] !== value) {
        const nv = { [prop]: value } as Partial<T>
        setState(nv)
      }
      return true
    },
    get(obj, prop) {
      return prop in obj ? obj[prop] : 37;
    }
  })

  return proxy
}