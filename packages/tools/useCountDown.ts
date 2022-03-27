
import { useState, useEffect } from 'react';

export function useCountDown(endTime: number) {
  const [time, setTime] = useState({
    day: 0,
    hour: 0,
    minute: 0,
    second: 0
  });

  useEffect(() => {
    let times = (endTime - new Date().getTime()) / 1000;
    const timer = setInterval(() => {
      times -= 1;
      let day = Math.floor(times / 60 / 60 / 24);
      let hour = Math.floor(times / 60 / 60 % 24);
      let minute = Math.floor(times / 60 % 60);
      let second = Math.floor(times % 60);
      setTime({
        day: day,
        hour: hour,
        minute: minute,
        second: second
      })
    }, 1000)
    return (() => {
      clearInterval(timer);
    })
  }, [endTime])
  return { time }
}