import { useCallback, useRef } from "react";
import { BehaviorSubject } from "rxjs";

/**
 * @function 使用rxjs创建一个可观察值
 * @description 
 * - 区别于useState，该函数返回可观察值的监听和变更方法，且变更该值时不会触发组件重新渲染
 * - 建议在hook函数中使用（替代useState），可避免hook函数内部触发组件渲染，导致渲染次数不可控而引起性能问题
 * @param initValue 
 * @returns 
 *  - watchValue 用于监听值的变化，返回一个取消监听的函数
 *  - pushValue 用于设置值，可以传入一个新值或者一个函数，函数接受旧值并返回新值
 * @example
 * const [count, setCount] = useObservable(0);
 * const [watchValue, pushValue] = useObservable(count);
 * watchValue((value) => setCount(value));
 * setValue(1);
 */
export function useObservable<T>(initValue: T) {
  const value = useRef( new BehaviorSubject<T>(initValue) );

  const watchValue = useCallback((callback?: (value: T) => void) => {
    const subscription = value.current.subscribe(callback);
    return {
      current: value.current.getValue(),
      unsubscribe: () => {
        subscription.unsubscribe();
      }
    };
  }, []);

  const pushValue = useCallback((newValue: T | ((oldVal: T) => T)) => {
    if (newValue instanceof Function) {
      value.current.next(newValue(value.current.getValue()));
    } else {
      value.current.next(newValue);
    }
  }, []);

  return [watchValue, pushValue] as const;
}


// function watchValue() {
//   throw new Error("Function not implemented.");
// }