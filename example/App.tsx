import { useEffect, useState } from 'react'
import { createServiceComponent, useDebounceCallback, useUpdateEffect } from '../packages';
import './App.css';
import { DemoA } from './component/demo-a';
import { useIntercept } from './hooks/intercept';

function App() {
  const [count, setCount] = useState(0);
  const [num, setNum] = useState(10);
  
  // useUpdateEffect(() => {
  //   console.log('count change', count)
  // }, [count])

  // const hande = useDebounceCallback(() => {
  //   console.log('debounce')
  // }, [], 500)

  useUpdateEffect((changes) => {
    console.log(changes);
    console.log(num, count)
    return null
  }, [num, count])

  return (
    <div className="App">  
      <DemoA></DemoA>
      <div>
        <span onClick={_ => setCount(v => v+1)}>count:{count}</span> &nbsp;
        <span onClick={_ => setNum(v => v-1)}>num:{num}</span>
      </div>
      {/* <button onClick={_ => hande()}>防抖按钮</button> */}
    </div>
  )
}

export default createServiceComponent(App, [useIntercept]) 
