import { useEffect, useRef, useState } from "react";
import { BehaviorSubject } from "rxjs";
import { EffectReturn, Signal } from "../../../domain/signal";
import { __createEffectWatcher, EffectWatcher } from "./watcher";
import { useSymbol } from "../../common/useSymbol";
import { trackSignal } from "./collector";

export function useComputed<T>(inputFn: (symbol?: symbol) => T): Signal<T | null> {
  const subject   = useRef( new BehaviorSubject<T | null>(null));  
	const getValue  = useRef(getValueFunc);  
	
  function getValueFunc(symbol?: symbol) {
    trackSignal(getValue.current, symbol);
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

  useEffect(() => {
    watcher.current = __createEffectWatcher(id, inputFn, subject.current) as EffectWatcher<T | null>;
		watcher.current.load();

    return () => watcher.current?.unload()
  }, [])	

	return getValue.current;
}
