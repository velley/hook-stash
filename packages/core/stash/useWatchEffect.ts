import { EffectCallback, useEffect, useRef } from "react";
import { useSymbol } from "../../common/useSymbol";
import { useLoad } from "../../common/useLoad";
import { EffectWatcher, __createWatcher } from "./watcher";
import { useDestroy } from "../../common/useDestroy";

export function useWatchEffect(callback: (_watcher?: EffectWatcher) => void) {
	const id = useSymbol();   
	const watcher = useRef<EffectWatcher>()

	useLoad(() => {
		watcher.current = __createWatcher(id, callback);
		watcher.current.load();
	})

	useDestroy(() => {
		watcher.current?.unload();
	})	
}


