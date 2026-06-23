import { Signal } from "../../../domain/signal";

export type SignalCollectorKind = 'effect' | 'render';

export interface SignalCollector {
  id: symbol;
  kind: SignalCollectorKind;
  registerSignal(signal: Signal<unknown>): void;
}

const COLLECTOR_STACK: SignalCollector[] = [];

/**
 * Dependency collection is active only while the callback runs synchronously.
 * `finally` prevents thrown or interrupted renders from leaking active state.
 */
export function withSignalCollector<T>(
  collector: SignalCollector,
  callback: () => T
): T {
  COLLECTOR_STACK.push(collector);

  try {
    return callback();
  } finally {
    const index = COLLECTOR_STACK.lastIndexOf(collector);
    if (index >= 0) COLLECTOR_STACK.splice(index, 1);
  }
}

/**
 * Preserve the old behavior: an unscoped read is registered with the nearest
 * active effect collector and the nearest active render collector.
 */
export function trackSignal(signal: Signal<unknown>, id?: symbol): void {
  if (id) {
    for (let index = COLLECTOR_STACK.length - 1; index >= 0; index -= 1) {
      const collector = COLLECTOR_STACK[index];
      if (collector.id === id) collector.registerSignal(signal);
    }
    return;
  }

  let effectTracked = false;
  let renderTracked = false;

  for (let index = COLLECTOR_STACK.length - 1; index >= 0; index -= 1) {
    const collector = COLLECTOR_STACK[index];

    if (collector.kind === 'effect' && !effectTracked) {
      collector.registerSignal(signal);
      effectTracked = true;
    }
    if (collector.kind === 'render' && !renderTracked) {
      collector.registerSignal(signal);
      renderTracked = true;
    }
    if (effectTracked && renderTracked) return;
  }
}

export function findActiveCollector(
  kind: SignalCollectorKind,
  id?: symbol
): SignalCollector | undefined {
  for (let index = COLLECTOR_STACK.length - 1; index >= 0; index -= 1) {
    const collector = COLLECTOR_STACK[index];
    if (collector.kind === kind && (!id || collector.id === id)) return collector;
  }
}
