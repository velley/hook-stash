import { useEffect, useState } from "react";

/**
 * @description 保存状态的历史变化记录
 * @param state 状态变量
 * @returns state历史值，最新值在末尾
 */
export function useHistoryState<T>(state: T) {
  const [logs, setLogs] = useState<T[]>([]);

  useEffect(() => {
    setLogs(logs => logs.concat([state]))
  }, [state])

  return logs
}