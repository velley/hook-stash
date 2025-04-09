import { useEffect } from "react";

export function useMounted(callback: React.EffectCallback) {
	useEffect(() => {
		const fn = callback();		
		return () => {
			if (typeof fn === "function")fn();		
		}
	}, []);
}