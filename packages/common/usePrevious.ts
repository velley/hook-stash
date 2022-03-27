import { useRef } from "react";

/**
 * @description 将最近两次变化的值并返回
 * @param value s状态变量（建议为useState函数返回的变量）
 * @returns 0-当前值 1-上一个值
 */
export function usePrevious<T>(state: T) {
  const prevRef = useRef<T>();
  const curRef = useRef<T>();

  prevRef.current = curRef.current;
  curRef.current = state;

  return prevRef.current;
}