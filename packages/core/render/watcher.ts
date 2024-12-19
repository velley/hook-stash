import { Subject, Subscription, combineLatest, skip } from "rxjs";
import { Stash } from "../../../domain/stash";
import { createContext } from "react";

export function __createRenderWatcher(id: symbol, callback: (symbol?: symbol) => any) {
	const exit = RenderWatcher.RENDER_WATCHER.find(watcher => watcher.id === id);
	if (exit) return exit;
	const watcher = new RenderWatcher({id, callback});
	return watcher;
}

export function __findRenderWatcher(id?: symbol) {
	console.log('find find', RenderWatcher.RENDER_WATCHER)
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
export class RenderWatcher<T = unknown> {
	static RENDER_WATCHER: RenderWatcher<any>[] = [];

	id: symbol;
	private callback: (symbol?: symbol) => any;
	context: React.Context<any>;
	stashArray: Stash<unknown>[] = [];
	private __subscription: Subscription;

	constructor({ id, callback }: RenderWatcherConstructor) {
		this.id = id;
		this.callback = callback;
		RenderWatcher.RENDER_WATCHER.push(this);
		this.context = createContext(this);
	}

	registerStash(stash: Stash<unknown>) {
		if (this.stashArray.includes(stash)) return;
		this.stashArray.push(stash);
	}

	load() {		
		const observables = this.stashArray.map(stash => stash.observable);
		this.__subscription = combineLatest(observables).pipe(skip(1)).subscribe(
			() => {
				this.callback();
			}
		);
		RenderWatcher.RENDER_WATCHER.pop(); //订阅后需要立即移除最新的watcher
	}

	unload() {
		const index = RenderWatcher.RENDER_WATCHER.findIndex(watcher => watcher.id === this.id);
		this.__subscription.unsubscribe();
	}
}