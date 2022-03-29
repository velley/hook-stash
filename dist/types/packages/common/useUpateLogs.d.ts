/**
 * @function 保存状态的历史变化记录
 * @param state 状态变量
 * @returns state历史值，最新值在末尾
 */
export declare function useUpdateLogs<T>(state: T): T[];
