import './App.css';
import { useSignal, render, useComputed } from '../packages';
import { RenderDemo } from './component/demo-a';

const App = () => {  
  const [count, setCount] = useSignal(0); 
  const [name, setName] = useSignal('john');
  const level = useComputed(() => `${count()}级应用`); 

  return render(() =>
    <>    
      <div>
        <span>父组件：{level()}</span>
        <span>名称：{ count() > 5  && name()}</span>
        <input type="text" onChange={e => setName(e.target.value)} />
        <button onClick={() => setCount(v => v+1)}>+</button>
        <button onClick={() => setCount(v => v-1)}>-</button>
        {new Date().getTime()}
        { count() > 5 && <Child /> }
        <RenderDemo />
      </div>     
    </>
  )
}

export default App;


const Child = () => {
  const [age, setAge] = useSignal(18);

  return render(() => (
    <div onClick={() => setAge(v => v + 1)}>
      年龄： {age()}
    </div>
  ))
}