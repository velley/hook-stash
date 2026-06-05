import { useSignal } from "../../packages";

export function useAppData() {
  const [name, setName] = useSignal('demo');
  const [age, setAge] = useSignal(18);
  const [city, setCity] = useSignal('Shanghai');

  const changeName = (nextName: string) => {
    setName(nextName);
  };

  const increaseAge = () => {
    setAge((value) => value + 1);
  };

  const changeCity = (nextCity: string) => {
    setCity(nextCity);
  };

  const changeAppData = (nextName: string, nextAge: number, nextCity?: string) => {
    setName(nextName);
    setAge(nextAge);
    if (nextCity !== undefined) {
      setCity(nextCity);
    }
  };

  return {
    name,
    age,
    city,
    changeName,
    increaseAge,
    changeCity,
    changeAppData
  };
}
