import { useState } from "react";

export function useCount() {
  const [count, setCount] = useState(0);

  return {
    count,
    setCount
  }
}