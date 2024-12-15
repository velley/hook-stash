import { useEffect } from "react";

export function useMounted(callback: React.EffectCallback) {
	useEffect(() => {
		callback();		
	}, []);
}