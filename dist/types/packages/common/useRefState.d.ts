/**
 * @description 使用引用类型的状态变量，并返回状态值和状态变更函数
 * @param refState
 * @returns
 */
export declare function useRefState<T extends object>(refState: T): [T, (v: Partial<T>) => void];
