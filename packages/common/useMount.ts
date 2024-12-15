import { useEffect } from "react";

export function useMount(callback: React.EffectCallback) {
	useEffect(() => {
		return callback();
	}, []);
}