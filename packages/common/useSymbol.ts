import { useRef } from "react";

/** 
 * @description 在组件声明周期内生成一个唯一symbol标识
 */
export function useSymbol () {
  const symbol = useRef(
    Symbol('a unique symbol id for current functional component')
  )
  return symbol.current;
}