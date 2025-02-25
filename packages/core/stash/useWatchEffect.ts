import { useRef } from "react";
import { useSymbol } from "../../common/useSymbol";
import { useLoad } from "../../common/useLoad";
import { EffectWatcher, __createEffectWatcher } from "./watcher";
import { useDestroy } from "../../common/useDestroy";

export function useWatchEffect(callback: (symbol?: symbol) => void) {
	const id = useSymbol();   
	const watcher = useRef<EffectWatcher>()

	useLoad(() => {
		watcher.current = __createEffectWatcher(id, callback);
		watcher.current.load();
	})

	useDestroy(() => {
		watcher.current?.unload();
	})	
}