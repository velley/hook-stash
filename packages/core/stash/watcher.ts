import { Subject, Subscription, combineLatest, skip } from "rxjs";
import { Stash } from "../../../domain/stash";

export function __createWatcher<T = unknown>(id: symbol, callback: () => any, listener?: Subject<T>) {
	const exit = EffectWatcher.EFFECT_WATCHER.find(watcher => watcher.id === id);
	if (exit) {
		exit.callback = callback;
		return exit
	}
	const watcher = new EffectWatcher(id, callback, listener);
	return watcher;
}

export function __findWatcher(id?: symbol) {
	if (id) {
		return EffectWatcher.EFFECT_WATCHER.find(watcher => watcher.id === id);
	} else {
		return EffectWatcher.EFFECT_WATCHER[EffectWatcher.EFFECT_WATCHER.length - 1];
	}
}

export class EffectWatcher<T = unknown> {
	static EFFECT_WATCHER: EffectWatcher<any>[] = [];

	id: symbol;
	callback: () => any;	
	stashArray: Stash<unknown>[] = [];

	private __listener?: Subject<T>;
	private __subscription: Subscription;

	constructor(id: symbol, callback: () => any, listener?: Subject<T>) {
		this.id = id;   
		this.callback = callback;
		EffectWatcher.EFFECT_WATCHER.push(this);
		const result = callback(); //watcher实例创建完毕后默认执行回调函数，用于触发函数中的stash进行依赖注册
		if(listener) {
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
				const res = this.callback();
				if (this.__listener) this.__listener.next(res);
			}
		);
	}

	unload() {
		const index = EffectWatcher.EFFECT_WATCHER.findIndex(watcher => watcher.id === this.id);
		if(index > -1) EffectWatcher.EFFECT_WATCHER.splice(index, 1);
		this.__subscription.unsubscribe();
	}
}