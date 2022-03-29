import { useEffect, useRef } from "react";

/**
 * @description 依赖值更新时执行的副作用函数，并将函数上一次调用时的所有依赖值传给当前调用(注意与useUpdateEffect的区别)
 * @param callback 要执行的回调函数
 * @param deps 状态依赖
 */
export function useWatchEffect(callback: ((changes?: unknown[]) => () => void) | ((changes?: unknown[]) => void), deps: unknown[]) {
  const runCount = useRef(0);
  const caches = useRef([]);

  useEffect(() => {
    caches.current.push(deps);    
    runCount.current ++;
    if(runCount.current  === 1) return;
    return callback(caches.current.shift());    
  }, deps)
}