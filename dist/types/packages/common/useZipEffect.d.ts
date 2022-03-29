/**
 * @description 当所有依赖项变更次数相同时，则执行副作用函数
 * @param callback
 * @param deps
 */
export declare function useZipEffect(callback: () => () => void, deps: unknown[]): void;
