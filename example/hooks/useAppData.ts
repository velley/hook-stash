import { useState } from "react";
import { useStash } from "../../packages";


export function useAppData() {
  const [name, setName] = useStash('demo');
  const [age, setAge] = useStash(18);
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