import { Subscription, combineLatest, skip } from "rxjs";
import { Signal } from "../../../domain/signal";
import {
  findActiveCollector,
  SignalCollector,
  withSignalCollector,
} from "../signal/collector";

export function __createRenderWatcher(id: symbol, callback: () => void) {
  return new RenderWatcher({ id, callback });
}

/** @deprecated 内部兼容方法，活动状态现在由同步 collector 栈管理。 */
export function __findRenderWatcher(id?: symbol) {
  const collector = findActiveCollector('render', id);
  return collector instanceof RenderWatcher ? collector : undefined;
}

interface RenderWatcherConstructor {
  id: symbol;
  callback: () => void;
}

export class RenderWatcher implements SignalCollector {
  readonly kind = 'render' as const;
  readonly id: symbol;

  private readonly callback: () => void;
  private signals = new Set<Signal<unknown>>();
  private collectingSignals: Set<Signal<unknown>> | null = null;
  private subscription?: Subscription;

  constructor({ id, callback }: RenderWatcherConstructor) {
    this.id = id;
    this.callback = callback;
  }

  collect<T>(callback: () => T): T {
    const nextSignals = new Set<Signal<unknown>>();
    this.collectingSignals = nextSignals;

    try {
      const result = withSignalCollector(this, callback);
      this.signals = nextSignals;
      return result;
    } finally {
      this.collectingSignals = null;
    }
  }

  registerSignal(signal: Signal<unknown>) {
    this.collectingSignals?.add(signal);
  }

  load() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;

    const observables = Array.from(this.signals, signal => signal.observable);
    if (!observables.length) return;

    this.subscription = combineLatest(observables).pipe(skip(1)).subscribe(
      this.callback
    );
  }

  unload() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.signals.clear();
  }
}
