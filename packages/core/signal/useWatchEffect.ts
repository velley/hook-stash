import { useRef } from "react";
import { useSymbol } from "../../common/useSymbol";
import { useReady } from "../../common/useReady";
import { EffectWatcher, __createEffectWatcher } from "./watcher";
import { useDestroy } from "../../common/useDestroy";

export function useWatchEffect(callback: (symbol?: symbol) => void) {
	const id = useSymbol();   
	const watcher = useRef<EffectWatcher>()

	useReady(() => {
		watcher.current = __createEffectWatcher(id, callback);
		watcher.current?.load();
	})

	useDestroy(() => {
		watcher.current?.unload();
	})	
}