# hook-stash

[![npm version](https://img.shields.io/npm/v/hook-stash.svg)](https://www.npmjs.com/package/hook-stash)
[![license](https://img.shields.io/npm/l/hook-stash.svg)](LICENSE)
[![react](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://react.dev/)
[![rxjs](https://img.shields.io/badge/rxjs-7.x-d91404.svg)](https://rxjs.dev/)

`hook-stash` 是一个基于 React Hooks 的工具库，目标是把常见的业务逻辑能力沉淀成可复用的 Hook 组合。

它更像一个“Hooks 工具箱”，帮助你在 React 项目里更优雅地组织：

- 状态管理
- 组件间依赖注入
- 生命周期处理
- 响应式数据流
- HTTP 请求封装
- 分页请求逻辑

## 目录

- [项目定位](#项目定位)
- [核心特性](#核心特性)
- [与 Zustand / MobX / Redux 的关系](#与-zustand--mobx--redux-的关系)
- [安装](#安装)
- [快速开始](#快速开始)
- [注意事项](#注意事项)
- [API 概览](#api-概览)
- [项目结构](#项目结构)
- [依赖](#依赖)
- [许可证](#许可证)

## 项目定位

在 React 开发中，很多逻辑会反复出现：

- 需要在多个组件之间共享一段逻辑
- 需要避免把状态和请求逻辑散落在组件内部
- 需要更灵活地组织 Hook 之间的依赖关系
- 需要把请求、拦截器、分页、生命周期等能力统一封装

`hook-stash` 的重点不是替代 React，而是让你用更小的粒度去拆分和复用业务逻辑。

## 核心特性

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

## 与 Zustand / MobX / Redux 的关系

`hook-stash` 可以在**部分场景中平替** Zustand / MobX / Redux，尤其适合：

- 中小型 React 项目
- 更偏 Hook 组合式的状态组织方式
- 希望把“状态 + 逻辑 + 副作用”一起封装在 Hook 里的场景

它和传统状态库的区别，可以简单理解为：

| 维度 | hook-stash | Zustand | MobX | Redux |
| --- | --- | --- | --- | --- |
| 核心理念 | Hook 组合 + 响应式状态 + 依赖注入 | 轻量全局 store | 响应式可观察状态 | 单向数据流 + action/reducer |
| 上手方式 | 更贴近 React Hooks | 很轻量 | 偏响应式思维 | 规范更强，样板较多 |
| 组织方式 | 以 Hook 为中心 | 以 store 为中心 | 以 observable 为中心 | 以 store/action/reducer 为中心 |
| 适合场景 | Hook 化业务逻辑封装、复用、注入 | 轻量全局状态管理 | 复杂响应式状态 | 大型项目、严格状态流转 |
| 学习成本 | 低到中 | 低 | 中 | 中到高 |
| 工程风格 | 更灵活、更贴近函数式组件 | 简洁直接 | 响应式能力强 | 约束更强、可维护性高 |

### 简单结论

- 如果你想要**一个纯状态管理库**，Zustand / MobX / Redux 仍然更直接
- 如果你想把**状态管理和业务逻辑封装成 Hook 复用**，`hook-stash` 会更顺手
- 如果你的项目已经大量采用 React Hooks，那么 `hook-stash` 很适合作为“状态与逻辑编排层”

> 说明：这里的“平替”指的是在很多业务场景下可替代使用，而不是在所有能力边界上完全等价。

## 安装

```bash
npm install hook-stash react rxjs
```

或：

```bash
yarn add hook-stash react rxjs
```

## 快速开始

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

### 请求封装

```ts
import { useHttpClient } from 'hook-stash';

function Demo() {
  const [, request, state] = useHttpClient('/api/user');

  const load = async () => {
    const data = await request({ id: 1 });
    console.log(data);
  };

  return (
    <button onClick={load} disabled={state() === 'pending'}>
      Load
    </button>
  );
}
```

## 注意事项

- `useHttp` 已标记为弃用，建议优先使用 `useHttpClient`
- `useSignal` 返回的是可调用函数而不是普通状态值，读取时需要使用 `count()` 这类方式
- `createComponent` 适合组织依赖型 Hook；如果只是普通组件状态管理，未必需要它
- 项目依赖 `react` 和 `rxjs`，使用前请确保版本兼容

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
