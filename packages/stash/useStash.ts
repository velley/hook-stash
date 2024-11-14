import { useCallback, useEffect, useRef, useState } from "react";
import { BehaviorSubject, Observable } from "rxjs";

/**
 * @function 创建一个可观察值
 * @description 
 * - 内部基于rxjs的BehaviorSubject实现
 * - 返回可观察值的监听与变更方法，区别于useState，调用变更方法时不会触发函数组件重新调用
 * - 建议在hook函数中替代原本使用useState的场景，可避免hook函数内部触发组件渲染，导致渲染次数不可控而引起性能问题
 * @param initValue 
 * @returns 
 *  - getValue 用于获取值，可以传入一个回调函数，回调函数会在值变更时被调用
 *  - pushValue 用于设置值，可以传入一个新值或者一个函数，函数接受旧值并返回新值
 * @example
 * const [count, setCount] = useStash(0);
 * const [getValue, pushValue] = useStash(count);
 * getValue(setCount);
 * setValue(1);
 */
export function useStash<T>(initValue: T) {
  const subject = useRef( new BehaviorSubject<T>(initValue) );

  function getValueFunc(): T;
  function getValueFunc(callback: (value: T) => void): WatchValuerReturn;
  function getValueFunc(callback?: (value: T) => void): WatchValuerReturn | T {
    if(!callback) {
      return subject.current.getValue();
    } else {
      const subscription = subject.current.subscribe(callback);
      return () => {
        subscription.unsubscribe();
      };
    }    
  }
  getValueFunc.observable = subject.current.asObservable();
  getValueFunc.useState = function() {
    const [state, setState] = useState(subject.current.getValue());
    useEffect(() => {
      const subscription = subject.current.subscribe(setState);
      return () => {
        subscription.unsubscribe();
      };
    }, []);
    return [state, pushValue] as const;
  }
  const getValue = useCallback(getValueFunc, []);

  function pushValueFunc(newValue: T | ((oldVal: T) => T)) {
    if (newValue instanceof Function) {
      subject.current.next(newValue(subject.current.getValue()));
    } else {
      subject.current.next(newValue);
    }
  }
  const pushValue = useCallback(pushValueFunc, []);

  return [getValue, pushValue] as const;
}

interface WatchValuerReturn {
  (): void;  
}