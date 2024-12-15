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

  useWatchEffect(() => {
    console.log('watch child', props.count())
  })
  
  useEffect(() => {
    console.log('render Child')
  }, [])
  return (
    <div>接收到count: {props.count()}</div>
  )
}

export default createComponent(App, [useIntercept, usePagingSetting]) 

