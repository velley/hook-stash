import React, { useEffect, useState } from 'react';
import './App.css';
import { useIntercept } from './hooks/intercept';
import { usePagingSetting } from './hooks/pagingSetting';
import { createComponent, useStash, $ } from '../packages';
import { useWatchEffect } from '../packages/core/stash/useWatchEffect';
import { useLoad } from '../packages/common/useLoad';
import { useComputed } from '../packages/core/stash/useComputed';
import { Stash } from '../domain/stash';

function App() {
  const [getCount, setCount] = useStash(0);
  const [name, setName] = useStash('张三');

  useLoad(() => {
    setTimeout(() => {
      setName('李四')
    }, 3000)
  }) 
  
  useWatchEffect(() => {
    console.log('watch NAME',  name())
  })  

  const res = useComputed(() => {
    return name() + '/computed/' + getCount()
  })

  useWatchEffect(() => {
    console.log('watch res', res())
  })

  useEffect(() => {
    console.log('render App')
  })

  return (
    <div className="App">  
      <button onClick={() => setCount(v => v + 1)}>+</button>
      <div>
        { $(getCount) }
      </div>      
      <Child count={getCount} />
    </div>
  )
}

function Child(props: { count: Stash<number> }) {
  const [level, setLevel] = useStash(100)  
  
  useEffect(() => {
    console.log('render Child')
  })

  const result = useComputed(() => {
    return props.count() + '-' + level()
  })

  useWatchEffect(() => {
    console.log('watch child result', result())
  })

  useWatchEffect(() => {
    console.log('watch level', level())
  })

  return (
    <>
      <div>接收到count: {$(props.count)}</div>
      <div>
        child level {$(level, v => <span style={{color:'red'}}>{v}</span>)}
        <button onClick={() => setLevel(v => v-1)}>降级</button>
      </div>
    </>    
  )
}

export default createComponent(App, [useIntercept, usePagingSetting]) 

