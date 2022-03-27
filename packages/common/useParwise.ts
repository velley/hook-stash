import { useEffect, useState } from "react";

/**
 * @description 记录状态最近两次变化的值并返回
 * @param value s状态变量（建议为useState函数返回的变量）
 * @returns 0-当前值 1-上一个值
 */
export function useParwise<T>(state: T) {
  const [current, setCurrent] = useState<T>(state);
  const [before, setBefore] = useState<T>();

  useEffect(() => {
    setCurrent(state);
    setBefore(current);
  }, [state])
  
  return [current, before]
}