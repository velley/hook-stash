import { useCallback, useRef } from "react";

/**
 * @description 防抖函数
 * @param callback 初始回调函数
 * @param deps 依赖值
 * @param debounceTime 防抖时间
 * @returns 
 */
export function useDebounceCallback<T extends []>(callback: (...params: T) => void, deps: unknown[], debounceTime: number) {

  const timeRef = useRef<NodeJS.Timeout>(null);
  const runner  = useCallback(callback, deps);

  const debouncer = (...params:T) => {
    clearTimeout(timeRef.current);
    const runTimeout = () => {
      return setTimeout(() => { runner(...params) }, debounceTime)
    }
    timeRef.current = runTimeout();
  }

  return debouncer;
}