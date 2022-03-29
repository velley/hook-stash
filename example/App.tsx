import { useState } from 'react'
import { createServiceComponent, useUpdateEffect } from '../packages';
import './App.css';
import { DemoA } from './component/demo-a';
import { useIntercept } from './hooks/intercept';

function App() {
  const [count, setCount] = useState(0);
  
  useUpdateEffect(() => {
    console.log('count change', count)
  }, [count])

  return (
    <div className="App">  
      <DemoA></DemoA>
    </div>
  )
}

export default createServiceComponent(App, [useIntercept]) 
