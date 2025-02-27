import React from "react";
import { createComponent, render, useInjector } from "../../packages";
import { useAppData } from "../hooks/useAppData";

// 子组件可以不用createComponent包裹，但可能会导致组件函数重复执行
export const DemoA = createComponent(() => {  
  const { name, age } = useInjector(useAppData);
  console.log('demoA render 打印')
  
  return render(() => (
    <div style={{ border: "1px solid #999", margin: '10px 0', width: 'fit-content', padding: "10px" }}>
      子组件：
      <div>name: {name()}</div>
      <div>age: {age()}</div>
    </div>
  ))  
}, [])

