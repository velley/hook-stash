import { DependencyList } from "react";
import { Observable } from "rxjs";

export type EffectReturn = (() => void) | void;
export interface Signal<T> {
  (symbol?: symbol): T;
  observable: Observable<T>;
  useState(): T;
  watchEffect(callback: (value: T) => EffectReturn, deps?: DependencyList): void;
}

export interface SetSignal<T> {
  (newValue: T | ((oldVal: T) => T)): void;
}