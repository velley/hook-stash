import { DependencyList } from "react";
import { Observable } from "rxjs";

export type EffectReturn = (() => void) | void;
export interface Stash<T> {
  (symbol?: symbol): T;
  observable: Observable<T>;
  useState(): T;
  watchEffect(callback: (value: T) => EffectReturn, deps?: DependencyList): void;
}

export interface SetStash<T> {
  (newValue: T | ((oldVal: T) => T)): void;
}