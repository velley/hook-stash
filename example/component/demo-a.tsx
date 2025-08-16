import React from "react";
import { createComponent, render, useInjector, useSignal } from "../../packages";
import { useAppData } from "../hooks/useAppData";

// 子组件可以不用createComponent包裹，但可能会导致组件函数重复执行
export const DemoA = () => {  
  const { name, age } = useInjector(useAppData);
  console.log('demoA render 打印')
  
  return render(() => (
    <div style={{ border: "1px solid #999", margin: '10px 0', width: 'fit-content', padding: "10px" }}>
      子组件：
      <div>name: {name()}</div>
      <div>age: {age()}</div>
    </div>
  ))  
}

export const RenderDemo = () => {
  const [name, setName] = useSignal('张三');
  const [gender, setGender] = useSignal(0);

  const genderLabel = () => {
    const val = gender();
    switch (val) {
      default:
        return '未知';
      case 0:
        return '女';
      case 1:
        return '男';
    }
  };

  return render(() => (
    <div>
      <p>姓名：{name()}</p>
      <p>性别：{genderLabel()}</p>

      <div className="form">
        <input
          placeholder="更改姓名"
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => setGender(1)}></button>
      </div>
    </div>
  ));
};