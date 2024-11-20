import { useRef } from "react";

export function useLoad(callback: () => void) {
  const hasLoaded = useRef(false);

  if (!hasLoaded.current) {
    callback();
    hasLoaded.current = true;
  }
}