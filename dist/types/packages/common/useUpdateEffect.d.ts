/**
 * @description 依赖值更新时执行副作用函数（忽略组件第一次渲染后的副作用），并将每个依赖上一次变更的值传给副作用函数
 * @param callback 要执行的回调函数
 * @param deps 状态依赖
 */
export declare function useUpdateEffect(callback: ((changes?: unknown[]) => () => void) | ((changes?: unknown[]) => void), deps: unknown[]): void;
