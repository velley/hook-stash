import { Subject, Subscription, combineLatest, skip } from "rxjs";
import { Signal } from "../../../domain/signal";
import {
  findActiveCollector,
  SignalCollector,
  withSignalCollector,
} from "./collector";

export function __createEffectWatcher<T = unknown>(
  id: symbol,
  callback: (symbol?: symbol) => unknown,
  listener?: Subject<T>
) {
  return new EffectWatcher<T>({ id, callback, listener });
}

/** @deprecated 内部兼容方法，活动状态现在由同步 collector 栈管理。 */
export function __findEffectWatcher(id?: symbol) {
  const collector = findActiveCollector('effect', id);
  return collector instanceof EffectWatcher ? collector : undefined;
}

interface EffectWatcherConstructor<T> {
  id: symbol;
  callback: (symbol?: symbol) => unknown;
  listener?: Subject<T>;
}

export class EffectWatcher<T = unknown> implements SignalCollector {
  readonly kind = 'effect' as const;
  readonly id: symbol;

  private readonly callback: (symbol?: symbol) => unknown;
  private readonly listener?: Subject<T>;
  private signals = new Set<Signal<unknown>>();
  private collectingSignals: Set<Signal<unknown>> | null = null;
  private subscription?: Subscription;
  private loaded = false;

  constructor({ id, callback, listener }: EffectWatcherConstructor<T>) {
    this.id = id;
    this.callback = callback;
    this.listener = listener;

    const result = this.collectCallback();
    this.listener?.next(result as T);
  }

  registerSignal(signal: Signal<unknown>) {
    this.collectingSignals?.add(signal);
  }

  load() {
    this.loaded = true;
    this.bindSignals();
  }

  unload() {
    this.loaded = false;
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.signals.clear();
  }

  private collectCallback() {
    const nextSignals = new Set<Signal<unknown>>();
    this.collectingSignals = nextSignals;

    try {
      const result = withSignalCollector(this, () => this.callback(this.id));
      this.signals = nextSignals;
      return result;
    } finally {
      this.collectingSignals = null;
    }
  }

  private bindSignals() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;

    const observables = Array.from(this.signals, signal => signal.observable);
    if (!observables.length || !this.loaded) return;

    this.subscription = combineLatest(observables).pipe(skip(1)).subscribe(() => {
      // 回调执行期间先解除旧订阅，避免回调中的同步写入造成重入。
      this.subscription?.unsubscribe();
      this.subscription = undefined;

      const result = this.collectCallback();
      this.listener?.next(result as T);
      this.bindSignals();
    });
  }
}
