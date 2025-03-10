import React from 'react';
import './App.css';
import { useSignal, render, useComputed, createComponent, useInjector } from '../packages';
import { useAppData } from './hooks/useAppData';
import { DemoA } from './component/demo-a';

const App = createComponent(
   () => {  
    const [count, setCount] = useSignal(0); 
    const level = useComputed(() => `${count()}级应用`);
    console.log('app render 打印')

    const { changeAppData } = useInjector(useAppData);
  
    return (
      <>    
        {
          render(() => (
            <div>
              <span>父组件：{level()}</span>
              <button onClick={() => setCount(v => v+1)}>+</button>
            </div>
          ))
        }      
        <DemoA key={1} />
        <button onClick={() => changeAppData(level() || '', count())}>更改app data</button>
      </>
    )
  },
  [
    useAppData
  ]
)

export default App;
