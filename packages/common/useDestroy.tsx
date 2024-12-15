import { useEffect } from "react";

export function useDestroy(callback: () => void) {
  useEffect(() => {
    return () => {
      callback();
    }
  }, [])
}