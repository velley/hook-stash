import React, { useEffect } from 'react';
import './App.css';
import { useIntercept } from './hooks/intercept';
import { usePagingSetting } from './hooks/pagingSetting';
import { useWatchEffect } from '../packages/core/stash/useWatchEffect';
import { useLoad } from '../packages/common/useLoad';
import { createComponent, useStash, $, useInjector } from '../packages';

// 根组件调用createComponent函数，将hook函数作为provider传入
const App = createComponent(() => {  
  const { setToken } = useInjector(useToken);

  useLoad(() => {
    setTimeout(() => {
      setToken('token123')
    }, 3000)
  })

  return <Child />
}, [useToken])

// 子组件调用useInjector函数，并传入useToken
function Child() {
  const { token } = useInjector(useToken)

  return (
    $(token, val => <div className="App">接收到token: {val}</div>)
  )
}

// 一个普通的useToken hook 函数，通过依赖注入便可跨组件共享状态+逻辑
function useToken() {
  const [token, setToken] = useStash<string| null>(null);  
  return { token, setToken }
}



export default App

