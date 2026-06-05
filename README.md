# hook-stash

`hook-stash` 是一个基于 React Hooks 的工具库，目标是把常见的业务逻辑能力沉淀成可复用的 Hook 组合。

它更像一个“Hooks 工具箱”，帮助你在 React 项目里更优雅地组织：

- 状态管理
- 组件间依赖注入
- 生命周期处理
- 响应式数据流
- HTTP 请求封装
- 分页请求逻辑

## 为什么要用 hook-stash

在 React 开发中，很多逻辑会反复出现：

- 需要在多个组件之间共享一段逻辑
- 需要避免把状态和请求逻辑散落在组件内部
- 需要更灵活地组织 Hook 之间的依赖关系
- 需要把请求、拦截器、分页、生命周期等能力统一封装

`hook-stash` 的重点不是替代 React，而是让你用更小的粒度去拆分和复用业务逻辑。

## 核心用途

### 1. 可观察状态管理

`useSignal` 提供了一种基于 `BehaviorSubject` 的可观察状态方案。

适合场景：

- 需要共享但不一定触发整棵组件树重渲染的状态
- 需要在 Hook 中使用响应式数据流
- 希望比 `useState` 更灵活地控制状态读取和更新

### 2. Hook 依赖注入

`createComponent` + `useInjector` 让 Hook 之间可以通过注入方式组织依赖。

适合场景：

- 将复杂业务拆成多个独立 Hook
- 在组件层统一提供依赖
- 在子组件或下游 Hook 中按需获取逻辑能力

### 3. 生命周期与通用辅助 Hook

内置了一批常用辅助 Hook：

- `useReady`：首次执行一次
- `useMounted`：组件挂载时执行
- `useDestroy`：组件卸载时执行
- `useRefState`：对象状态的局部合并更新
- `useSymbol`：生成组件级唯一标识

### 4. 请求与分页封装

库中提供了请求相关 Hook：

- `useHttpClient`：推荐使用的请求 Hook
- `usePaging`：分页请求封装
- `useHttp`：旧版请求方案，已标记为 deprecated

它们适合：

- 统一管理请求状态
- 注入请求拦截器
- 封装分页加载、翻页、刷新等逻辑

## 安装

```bash
npm install hook-stash react rxjs
```

或：

```bash
yarn add hook-stash react rxjs
```

## 使用示例

### 导入

```ts
import {
  useSignal,
  useHttpClient,
  usePaging,
  createComponent,
  useInjector,
  useMounted,
  useDestroy,
  useReady
} from 'hook-stash';
```

### `useSignal`

```ts
const [count, setCount] = useSignal(0);

console.log(count());
setCount(v => v + 1);
```

### 自定义业务 Hook

```ts
import { useSignal } from 'hook-stash';

export function useAppData() {
  const [name, setName] = useSignal('demo');
  const [age, setAge] = useSignal(18);

  return {
    name,
    age,
    changeAppData: (nextName: string, nextAge: number) => {
      setName(nextName);
      setAge(nextAge);
    }
  };
}
```

### Hook 注入

```tsx
import React from 'react';
import { createComponent, useInjector } from 'hook-stash';
import { useAppData } from './useAppData';

const App = () => {
  const { name, age } = useInjector(useAppData);

  return <div>{name()} - {age()}</div>;
};

export default createComponent(App, [useAppData]);
```

## API 概览

### 核心 Hook

- `useSignal`
- `useComputed`
- `useWatchEffect`
- `createComponent`
- `useInjector`
- `render`

### 通用 Hook

- `useRefState`
- `useReady`
- `useDestroy`
- `useMounted`
- `useSymbol`

### 请求相关 Hook

- `useHttpClient`
- `useHttp`
- `usePaging`

## 适合谁

如果你的项目中已经有很多自定义 Hook，并且希望：

- 更好地复用逻辑
- 更清晰地管理状态与依赖
- 更统一地组织请求和分页能力

那么 `hook-stash` 会比较适合。

## 项目结构

- `packages/common`：通用工具 Hook
- `packages/core/signal`：响应式状态相关能力
- `packages/core/di`：依赖注入相关能力
- `packages/http`：请求与分页能力
- `example`：示例代码

## 依赖

本库基于：

- React 18
- RxJS 7

## 许可证

MIT
