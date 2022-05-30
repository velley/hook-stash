import { useEffect, useRef, useState } from 'react'
import { FormGroupModel } from '../domain/form';
import { createServiceComponent, usePrevious, useServiceHook, useUpdateEffect } from '../packages';
import { useWatchEffect } from '../packages/common/useWatchEffect';
import { FormControl } from '../packages/form/formControl';
import { FormGroup } from '../packages/form/formGroup';
import './App.css';
import { DemoA } from './component/demo-a';
import { useIntercept } from './hooks/intercept';
import { usePagingSetting } from './hooks/pagingSetting';
import { useCount } from './hooks/useCount';

function App() {
  // const [count, setCount] = useState(0);
  
  // console.log('prev', prev)
  // useEffect(() => {
  //   console.log('count - prev', count, prev);
  // }, [count])

  const {setCount, count} = useServiceHook(useCount);

  useEffect(() => {
    setTimeout(() => setCount(4), 2000)
  }, [])

  const form = useRef<FormGroupModel>();

  useEffect(() => {
    console.log('form', form.current);
    setTimeout(() => {
      // form.current.patchValue({name: '3x'})
      form.current.controls['name'].setValue('3x')
    }, 2000)  
  }, [])

  return (
    <div className="App">  
      app count is {count}
      <DemoA ></DemoA>
      <FormGroup onCreated={group => form.current = group}>
        <FormControl name='name' format={v => v.target.value}>
          <input type="text" onChange={e => console.log('change', e, form)} />
        </FormControl>
      </FormGroup>
    </div>
  )
}

export default createServiceComponent(App, [useIntercept, usePagingSetting, useCount]) 
