import { useRef } from "react";

/** 
 * @description 生成一个symbol标识
 */
export function useSymbol () {
  const symbol = useRef(
    Symbol('a unique symbol id for current functional component')
  )
  return symbol.current;
}