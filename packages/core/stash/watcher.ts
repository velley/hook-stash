import { Subject, Subscription, combineLatest, skip } from "rxjs";
import { Stash } from "../../../domain/stash";

export function __createEffectWatcher<T = unknown>(id: symbol, callback: (symbol?: symbol) => any, listener?: Subject<T>) {
	const exit = EffectWatcher.EFFECT_WATCHER.find(watcher => watcher.id === id);
	if (exit) return exit	
	const watcher = new EffectWatcher({id, callback, listener});
	return watcher;
}

export function __findEffectWatcher(id?: symbol) {
	if (id) {
		return EffectWatcher.EFFECT_WATCHER.find(watcher => watcher.id === id);
	} else {
		return EffectWatcher.ACTIVE_WATCHER;
	}
}


interface EffectWatcherConstructor {
	id: symbol;
	callback: (symbol?: symbol) => any;
	listener?: Subject<any>;
}
export class EffectWatcher<T = unknown> {
	static EFFECT_WATCHER: EffectWatcher<any>[] = [];
	static ACTIVE_WATCHER: EffectWatcher<any> | null = null;

	id: symbol;
	private callback: (symbol?: symbol) => any;
	private stashArray: Stash<unknown>[] = [];

	private __listener?: Subject<T>;
	private __subscription: Subscription;

	constructor({ id, callback, listener }: EffectWatcherConstructor) {
		this.id = id;
		this.callback = callback;
		EffectWatcher.EFFECT_WATCHER.push(this);
		EffectWatcher.ACTIVE_WATCHER = this;
		const result = callback(id); //watcher实例创建完毕后默认执行回调函数，用于触发函数中的stash getter以便进行依赖注册
		EffectWatcher.ACTIVE_WATCHER = null; // 执行完毕后需要将activeWatcher置空
		if (listener) {
			this.__listener = listener;
			this.__listener.next(result);
		}
	}

	registerStash(stash: Stash<unknown>) {
		if (this.stashArray.includes(stash)) return;
		this.stashArray.push(stash);
	}

	load() {
		const observables = this.stashArray.map(stash => stash.observable);
		this.__subscription = combineLatest(observables).pipe(skip(1)).subscribe(
			() => {
				const res = this.callback(this.id);
				if (this.__listener) this.__listener.next(res);
			}
		);
	}	

	unload() {
		const index = EffectWatcher.EFFECT_WATCHER.findIndex(watcher => watcher.id === this.id);
		if (index > -1) EffectWatcher.EFFECT_WATCHER.splice(index, 1);
		this.__subscription.unsubscribe();
	}
}