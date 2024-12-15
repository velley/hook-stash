import React, { ReactNode, useEffect } from "react";
import { Stash } from "../../../domain/stash";

interface RenderProps<T> {
  watch: Stash<T>;
  children: (value: T) => ReactNode;
}

function _render<T>(watch: Stash<T>, map?: (value: T) => ReactNode) {
  const renderValue = (_value: T, _map?: (value: T) => ReactNode) => {
    const result = _map ? _map(_value) : _value;
    if (!React.isValidElement(result) && typeof result === "object" && result !== null) {
      console.warn("render方法无法直接渲染引用类型，已自动转化为json字符串，建议使用<Render/>组件替代", _value);
      return JSON.stringify(result) as string;
    } else {
      return result as ReactNode;
    }
  }

  return <Render watch={watch} children={x => renderValue(x, map)} />;
}

export const $ = _render;
export function Render<T>(props: RenderProps<T>) {
  const { watch, children } = props;
  const [value, setWatchValue] = React.useState(watch());

  useEffect(() => {
    const { unsubscribe } = watch(setWatchValue);
    return unsubscribe;
  }, [watch]);

  return children(value);
}