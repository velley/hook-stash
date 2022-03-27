import { useState } from "react";

/**
 * @description 使用引用类型的状态变量，并返回状态值和状态变更函数
 * @param refState 
 * @returns 
 */
export function useRefState<T extends object>(refState: T): [T, (v: Partial<T>) => void] {
  const [state, setState] = useState(refState);

  const setRefState = (newV: Partial<T>) => {
    setState(oldV => ({ ...oldV, ...newV }));
  }

  return [state, setRefState]
}