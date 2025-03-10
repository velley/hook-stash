import { Subject, Subscription, combineLatest, skip } from "rxjs";
import { Signal } from "../../../domain/signal";
import { createContext } from "react";

export function __createRenderWatcher(id: symbol, callback: (symbol?: symbol) => any) {
	const exit = RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
	if (exit) return exit;
	const watcher = new RenderWatcher({id, callback});
	return watcher;
}

export function __findRenderWatcher(id?: symbol) {
	if (id) {
		return RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
	} else {
		return RenderWatcher.RENDER_WATCHER[RenderWatcher.RENDER_WATCHER.length - 1];
	}
}


interface RenderWatcherConstructor {
	id: symbol;
	callback: (symbol?: symbol) => any;
}
export class RenderWatcher {
	static RENDER_WATCHER: RenderWatcher[] = [];

	id: symbol;
	private callback: (symbol?: symbol) => any;
	context: React.Context<any>;
	signalArray: Signal<unknown>[] = [];
	private __subscription: Subscription;

	constructor({ id, callback }: RenderWatcherConstructor) {
		this.id = id;
		this.callback = callback;
		RenderWatcher.RENDER_WATCHER.push(this);
		this.context = createContext(this);
	}

	registerSignal(signal: Signal<unknown>) {
		if (this.signalArray.includes(signal)) return;
		this.signalArray.push(signal);
	}

	load() {		
		const observables = this.signalArray.map(signal => signal.observable);
		this.__subscription = combineLatest(observables).pipe(skip(1)).subscribe(
			() => {
				this.callback();
			}
		);
		RenderWatcher.RENDER_WATCHER.pop(); //订阅后需要立即移除最新的watcher
	}

	unload() {
		this.__subscription.unsubscribe();
	}
}