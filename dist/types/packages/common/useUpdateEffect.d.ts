/**
 * @description 状态更新时的副作用函数（忽略组件第一次渲染后的副作用）
 * @param callback 要执行的回调函数
 * @param deps 状态依赖
 */
export declare function useUpdateEffect(callback: ((changes?: unknown[]) => () => void) | (() => void), deps: unknown[]): void;
