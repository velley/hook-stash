/**
 * @function 将普通对象变为由Proxy包装的代理对象，更新对象中的属性值时，会自动触发setState方法并引起函数式组件重新执行
 * @param state 初始对象
 * @returns proxy 代理对象
 */
export declare function useReactive<T extends object>(state?: Partial<T>): Partial<T>;
