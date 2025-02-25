import React from 'react';
import './App.css';
import { useStash, render, useComputed } from '../packages';

const App = () => {  
  const [count, setCount] = useStash(0); 
  const level = useComputed(() => `${count()}级组件`);
  console.log('app render 只打印一次')

  return render(() => (
    <>            
      {/* <div>父组件：{count()}</div> */}
      <div>父组件：{level()}</div>
      <button onClick={() => setCount(v => v+1)}>+</button>
    </>
  ))
}

export default App;
