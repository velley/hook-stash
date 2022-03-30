import { useEffect, useState } from 'react'
import { createServiceComponent, usePrevious, useUpdateEffect } from '../packages';
import { useWatchEffect } from '../packages/common/useWatchEffect';
import './App.css';
import { DemoA } from './component/demo-a';
import { useIntercept } from './hooks/intercept';

function App() {
  const [count, setCount] = useState(0);
  const [num, setNum] = useState(0)
  const prev = usePrevious(count);
  
  // console.log('prev', prev)
  // useEffect(() => {
  //   console.log('count - prev', count, prev);
  // }, [count])
  useWatchEffect((prevs) => {
    console.log(prevs)
  }, [count, num])

  return (
    <div className="App">  
      <button onClick={_ => setCount(v => v+1)}>count change</button>
      <button onClick={_ => setNum(v => v+1)}>num change</button>
      <p>{count}</p>
      <p>{num}</p>
    </div>
  )
}

export default createServiceComponent(App, [useIntercept]) 
