import { useEffect, useRef } from "react";

/**
 * @description 状态更新时的副作用函数（忽略组件第一次渲染后的副作用）
 * @param callback 要执行的回调函数
 * @param deps 状态依赖
 */
export function useUpdateEffect(callback: (() => () => void) | (() => void), deps: unknown[]) {
  const counter = useRef(0);

  useEffect(() => {
    counter.current ++;
    if(counter.current == 1) return;
    return callback();
  }, deps)
}