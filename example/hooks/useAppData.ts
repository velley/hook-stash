import { useState } from "react";
import { useSignal } from "../../packages";


export function useAppData() {
  const [name, setName] = useSignal('demo');
  const [age, setAge] = useSignal(18);
  const changeAppData = (name: string, age: number) => {
    setName(name);
    setAge(age);
  }
  return {
    name,
    age,
    changeAppData
  }
}