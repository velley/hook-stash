/**
 * @description 防抖函数
 * @param callback 初始回调函数
 * @param deps 依赖值
 * @param debounceTime 防抖时间
 * @returns debouncer
 */
export declare function useDebounceCallback<T extends []>(callback: (...params: T) => void, deps: unknown[], debounceTime: number): (...params: T) => void;
