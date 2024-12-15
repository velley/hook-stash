import { useEffect, useRef, useState } from "react";
import { BehaviorSubject, Subscription } from "rxjs";
import { EffectReturn, SetStash, Stash } from "../../../domain/stash";
import { __findWatcher } from "./watcher";
import { useDestroy } from "../../common/useDestroy";


/**
 * @function 创建一个可观察值
 * @description 
 * - 内部基于rxjs的BehaviorSubject实现
 * - 返回可观察值的监听与变更方法，区别于useState，调用变更方法时不会触发函数组件重新调用
 * - 可在hook函数中替代原本使用useState的场景
 * @param initValue 
 * @returns 
 *  - getValue 用于获取值，可以传入一个回调函数，回调函数会在值变更时被调用
 *  - setValue 用于设置值，可以传入一个新值或者一个函数，函数接受旧值并返回新值
 * @example 
 * const [getValue, setValue] = useStash(0);
 * cont count = getValue.useState(); 
 * useEffect(() => {
 *  setTimeout(() => {
 *    setValue(value => value + 1);
 *  }, 1000)
 * }, [setValue])
 * return <div>{count}</div>
 */
export function useStash<T>(initValue: T): [Stash<T>, SetStash<T>] {
  const subject   = useRef( new BehaviorSubject<T>(initValue) );   
  const getValue  = useRef(getValueFunc);
  const setValue  = useRef(setValueFunc);

  useDestroy(() => {
    subject.current?.complete();
  })

  function getValueFunc(): T;
  function getValueFunc(callback: (value: T) => void): Subscription;
  function getValueFunc(callback?: (value: T) => void): Subscription | T {
    if(!callback) {
      const watcher = __findWatcher();
      if(watcher) watcher.registerStash(getValue.current);      
      return subject.current.getValue();
    } else {
      const subscription = subject.current.subscribe(callback);
      return subscription;
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
    return state;
  }
  getValueFunc.watchEffect = function(callback: (value: T) => EffectReturn) {    
    useEffect(() => {
      let effectReturn: EffectReturn;
      const subscription = subject.current.subscribe(
        value => {
          effectReturn = callback(value);
          if(effectReturn instanceof Function) effectReturn();
        }
      );
      return () => {          
        subscription.unsubscribe();
      };
    }, []);
  }  

  function setValueFunc(newValue: T | ((oldVal: T) => T)) {
    if (newValue instanceof Function) {
      subject.current.next(newValue(subject.current.getValue()));
    } else {
      subject.current.next(newValue);
    }
  } 

  return [getValue.current, setValue.current] as const;
}

