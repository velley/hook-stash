import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Signal } from "../../../domain/signal";
import { useSymbol } from "../../common/useSymbol";
import { __createRenderWatcher, RenderWatcher } from "./watcher";

interface RenderProps<T> {
  target: Signal<T>;
  children: (value: T) => ReactNode;
  placeholder?: () => ReactNode;
}

export function Render(props: {children: (id?: symbol) => ReactNode}) {
  const { children } = props;
	const id = useSymbol();  
	const [, setTrigger] = useState(0);
	const handler = () => {
		setTrigger(v => v + 1)	
  }
  const watcherRef = useRef(__createRenderWatcher(id, handler)); 

	useEffect(() => {		
		watcherRef.current.load();
		return () => watcherRef.current.unload()
	}, [])
  
	return children(id)  
}

export function render(nodeFn: () => ReactNode) {
  return <Render>{nodeFn}</Render>
}

function SingleRender<T>(props: RenderProps<T>) {
  const { target, children, placeholder } = props;
  const value = target.useState();
  return (isNullOrUndefined(value) && placeholder) ? placeholder() : children(value);
}

function _singRender<T>(target: Signal<T>, map?: (value: T) => ReactNode, placeholder?: () => ReactNode) {
  const renderValue = (_value: T, _map?: (value: T) => ReactNode) => {
    const result = _map ? _map(_value) : _value;
    if (!isValidReactNode(result) && typeof result === "object" && result !== null) {
      console.warn("render方法无法直接渲染引用类型，已自动转化为json字符串", _value);
      return JSON.stringify(result) as string;
    } else {
      return result as ReactNode;
    }
  }

  return <SingleRender target={target} children={x => renderValue(x, map)} placeholder={placeholder} />;
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