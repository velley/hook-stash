import React, { useEffect } from "react";
import { Stash } from "../stash/useStash";

interface RenderProps<T> {
  watch: Stash<T>;
  children: (value: T) => JSX.Element;
}

export function Render<T>(props: RenderProps<T>) {
  const { watch, children } = props;
  const [value, setWatchValue] = React.useState(watch());

  useEffect(() => {
    const { unsubscribe } = watch(setWatchValue);
    return unsubscribe;
  }, [watch]);

  return children(value);
}

export function _render<T>(watch: Stash<T>) {
  const renderValue = (value: T) => {
    if(typeof value === "object" && value !== null) {
      console.warn("render方法无法直接渲染对象值，已自动转化为json字符串，建议使用<Render/>组件替代", value);
      return JSON.stringify(value) as string;
    } else {
      return value as string;
    }
  }

  return <Render watch={watch} children={x => <>{renderValue(x)}</>} />;
}

export const $ = _render;