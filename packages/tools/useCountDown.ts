
import { useState, useEffect } from 'react';

/**
 * @description 倒计时hook函数
 * @param endTime 结束时间
 * @param startTime 开始时间
 */
export function useCountDown(endTime: number, startTime?: number) {
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