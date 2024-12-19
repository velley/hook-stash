import React, { useContext, useEffect } from 'react';
import './App.css';
import { useLoad } from '../packages/common/useLoad';
import { createComponent, useStash, $, useInjector, useComputed, Render, useWatchEffect } from '../packages';

// 根组件调用createComponent函数，将hook函数作为provider传入
const App = () => {  
  const [count, setCount] = useStash(0); 

  return (
    <>
      <div>{new Date().getTime()}</div>
      <Render>
        {
          () => 
            <>            
              <div>父组件：{count()}</div>
              <button onClick={() => setCount(v => v+1)}>+</button>
            </> 
        }
      </Render>
    </>
    
  )
}

export default App;
