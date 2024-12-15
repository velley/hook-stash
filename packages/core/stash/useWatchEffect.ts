import { EffectCallback, useEffect, useRef } from "react";
import { useSymbol } from "../../common/useSymbol";
import { useLoad } from "../../common/useLoad";
import { EffectWatcher, __createWatcher } from "./watcher";

export function useWatchEffect(callback: EffectCallback) {
	const id = useSymbol();   
	const watcher = useRef<EffectWatcher>()

	useLoad(() => {
		watcher.current = __createWatcher(id, callback);
		watcher.current.load();
	})

	useEffect(() => {
		return () => {
			watcher.current?.unload();
		}
	}, [])
}


