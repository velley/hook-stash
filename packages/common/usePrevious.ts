import { useRef } from "react";

/** @deprecated 将废弃
 * @description 将最近两次变化的值并返回(只有输入值变化时，返回值才会相应地更新)
 * @param state 状态变量（建议为useState函数返回的变量）
 * @returns 上一个值
 */
export function usePrevious<T>(state: T) {
  const prevRef = useRef<T>();
  const curRef = useRef<T>();

  if(curRef.current !== state) {
    prevRef.current = curRef.current;
    curRef.current = state;
  }  

  return prevRef.current;
}