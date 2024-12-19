import { useContext, useEffect, useRef, useState } from "react";
import { BehaviorSubject, Subscription } from "rxjs";
import { EffectReturn, Stash } from "../../../domain/stash";
import { useLoad } from "../../common/useLoad";
import { __createEffectWatcher, __findEffectWatcher, EffectWatcher } from "./watcher";
import { useSymbol } from "../../common/useSymbol";
import { useDestroy } from "../../common/useDestroy";

export function useComputed<T>(inputFn: (symbol?: symbol) => T): Stash<T | null> {
  const subject   = useRef( new BehaviorSubject<T | null>(null));  
	const getValue  = useRef(getValueFunc);

  useDestroy(() => {
    subject.current?.complete();
  })
	
  function getValueFunc(symbol?: symbol) {
    const watcher = __findEffectWatcher(symbol);
    watcher?.registerStash(getValue.current);     
     
    return subject.current.getValue();  
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
  getValueFunc.watchEffect = function(callback: (value: T | null) => EffectReturn) {    
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
	
	const id = useSymbol();   
	const watcher = useRef<EffectWatcher<T | null>>();
	useLoad(() => {
		watcher.current = __createEffectWatcher(id, inputFn, subject.current) as EffectWatcher<T | null>;
		watcher.current.load();
	})

	useDestroy(() => {
		watcher.current?.unload();
	})

	return getValue.current;
}