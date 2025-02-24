import React, { useContext, useEffect } from 'react';
import './App.css';
import { useStash, Render } from '../packages';

const App = () => {  
  const [count, setCount] = useStash(0); 

  return (
    <Render>
      {
        () => 
          <>            
            <div>父组件：{count()}</div>
            <button onClick={() => setCount(v => v+1)}>+</button>
          </> 
      }
    </Render>    
  )
}

export default App;
