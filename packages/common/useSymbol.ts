import { useRef } from "react";

export function useSymbol () {
  const symbol = useRef(
    Symbol('a unique symbol id for current functional component')
  )
  return symbol.current;
}