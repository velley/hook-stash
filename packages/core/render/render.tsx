import React, { ReactNode, useEffect, useState } from "react";
import { Stash } from "../../../domain/stash";
import { useSymbol } from "../../common/useSymbol";
import { __createRenderWatcher } from "./watcher";

interface RenderProps<T> {
  target: Stash<T>;
  children: (value: T) => ReactNode;
}

export function Render(props: {children: () => ReactNode}) {
	const id = useSymbol();

	const [trigger, setTrigger] = useState(0);
	const handler = () => {
		setTrigger(v => v + 1)	
  }

	const watcher = __createRenderWatcher(id, handler);

	useEffect(() => {		
		watcher.load();
		return () => watcher.unload()
	}, [trigger])
  
	return props.children()  
}

export function render(nodeFn: () => ReactNode) {
  return <Render>{nodeFn}</Render>
}

function SingleRender<T>(props: RenderProps<T>) {
  const { target, children } = props;
  const value = target.useState();
  return isNullOrUndefined(value) ? <></> : children(value);
}

function _singRender<T>(target: Stash<T>, map?: (value: T) => ReactNode) {
  const renderValue = (_value: T, _map?: (value: T) => ReactNode) => {
    const result = _map ? _map(_value) : _value;
    if (!isValidReactNode(result) && typeof result === "object" && result !== null) {
      console.warn("render方法无法直接渲染引用类型，已自动转化为json字符串", _value);
      return JSON.stringify(result) as string;
    } else {
      return result as ReactNode;
    }
  }

  return <SingleRender target={target} children={x => renderValue(x, map)} />;
}

export const $ = _singRender;

// 判断输入值是否为合法的ReactNode
function isValidReactNode(value: any): value is ReactNode {
  if(Array.isArray(value)) {
    return value.every(React.isValidElement);
  }
  return React.isValidElement(value);
}

function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}