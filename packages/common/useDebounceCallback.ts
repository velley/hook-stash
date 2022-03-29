import { useCallback, useRef } from "react";

/**
 * @description 防抖函数
 * @param callback 初始回调函数
 * @param deps 依赖值
 * @param debounceTime 防抖时间
 * @returns debouncer 
 */
export function useDebounceCallback<T extends []>(callback: (...params: T) => void, deps: unknown[], debounceTime: number) {

  let timer: any;
  const timeRef = useRef(debounceTime);

  const runner = useCallback(callback, deps);

  const debouncer = (...params:T) => {
    clearTimeout(timer);
    timeRef.current = debounceTime;    
    const runTimeout = () => {
      return setTimeout(() => {
        if(timeRef.current <= 0) {
          runner(...params);          
        } else {
          timeRef.current = timeRef.current - 1000;
          runTimeout();
        }        
      }, 1000)
    }
    timer = runTimeout();
  }

  return debouncer;
}