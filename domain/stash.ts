import { DependencyList } from "react";
import { Observable, Subscription } from "rxjs";

export type EffectReturn = (() => void) | void;
export interface Stash<T> {
    (): T;
    (callback: (value: T) => void): Subscription;
    observable: Observable<T>;
    useState(): T;
    watchEffect(callback: (value: T) => EffectReturn, deps?: DependencyList): void;
  }
  
  export interface SetStash<T> {
    (newValue: T | ((oldVal: T) => T)): void;
  }