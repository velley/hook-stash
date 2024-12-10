import React, { useEffect, useState } from 'react';
import './App.css';
import { useIntercept } from './hooks/intercept';
import { usePagingSetting } from './hooks/pagingSetting';

import { createComponent, useStash, $ } from '../packages';

function App() {
  const [getCount, setCount] = useStash(0);
  console.log('render App')

  return (
    <div className="App">  
      <button onClick={() => setCount(v => v + 1)}>+</button>
      <div>
        { $(getCount) }
      </div>      
    </div>
  )
}

function Child(props: { count: number }) {
  
  useEffect(() => {
    console.log('render Child')
  }, [])
  return (
    <div>接收到count: {props.count}</div>
  )
}

export default createComponent(App, [useIntercept, usePagingSetting]) 

