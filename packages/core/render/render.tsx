import React, { ReactNode, useEffect } from "react";
import { Stash } from "../../../domain/stash";

interface RenderProps<T> {
  target: Stash<T>;
  children: (value: T) => ReactNode;
}

function _render<T>(target: Stash<T>, map?: (value: T) => ReactNode) {
  const renderValue = (_value: T, _map?: (value: T) => ReactNode) => {
    const result = _map ? _map(_value) : _value;
    if (!React.isValidElement(result) && typeof result === "object" && result !== null) {
      console.warn("render方法无法直接渲染引用类型，已自动转化为json字符串", _value);
      return JSON.stringify(result) as string;
    } else {
      return result as ReactNode;
    }
  }

  return <Render target={target} children={x => renderValue(x, map)} />;
}

export const $ = _render;
export function Render<T>(props: RenderProps<T>) {
  const { target, children } = props;
  const [value, setWatchValue] = React.useState(target());
 
  target.watchEffect(setWatchValue);

  return children(value);
}