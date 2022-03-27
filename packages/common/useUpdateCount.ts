import { useState } from "react";
import { usePrevious } from "./usePrevious";
import { useUpdateEffect } from "./useUpdateEffect";

/**
 * @function 记录状态的变化次数(第一次初始化时记为第0次)
 * @param state 状态变量
 * @param options
 * deep: 是否为深度比较，state为对象时，会遍历其属性进行比较,全部相等时不会记为一次变化
 * @returns 
 */
export function useUpdateCount<T>(state: T, options?: {deep: boolean}) {
  const[count, setCount] = useState(0);
  const before = usePrevious(state);

  useUpdateEffect(() => {
    if(options?.deep) {
      let changed: boolean;
      for(let key in state) {
        if(state[key] !== before[key]) {
          changed = true;
          break;
        }
      }
      changed && setCount(v => v + 1)
    } else {
      state !== before && setCount(v => v + 1)
    }
  }, [state, before])

  return count
}