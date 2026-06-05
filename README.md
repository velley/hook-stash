# hook-stash

[![npm version](https://img.shields.io/npm/v/hook-stash.svg)](https://www.npmjs.com/package/hook-stash)
[![license](https://img.shields.io/npm/l/hook-stash.svg)](LICENSE)
[![react](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://react.dev/)
[![rxjs](https://img.shields.io/badge/rxjs-7.x-d91404.svg)](https://rxjs.dev/)

`hook-stash` 是一个围绕 **React 依赖注入（DI）** 和 **状态共享** 构建的 Hooks 工具库。它的核心目标，是把常见业务逻辑以可复用、可组合、可注入的方式组织起来，形成更清晰的组件与逻辑边界。

它不是一个单纯的状态库，而是一个更偏“**Hook 级架构层**”的方案：

- 用 DI 组织 Hook 间的依赖关系
- 用可共享的响应式状态连接业务模块
- 用统一的方式封装请求、分页和生命周期逻辑

## 目录

- [项目定位](#项目定位)
- [为什么选择 hook-stash](#为什么选择-hook-stash)
- [核心能力](#核心能力)
- [与 Zustand / MobX / Redux 的关系](#与-zustand--mobx--redux-的关系)
- [安装](#安装)
- [快速开始](#快速开始)
- [注意事项](#注意事项)
- [API 概览](#api-概览)
- [项目结构](#项目结构)
- [依赖](#依赖)
- [许可证](#许可证)

## 项目定位

在 React 开发中，很多业务逻辑天然是“跨组件、跨层级、可复用”的：

- 页面中的多个模块需要共享同一份状态
- 某些 Hook 需要依赖其他 Hook 的输出
- 请求、拦截器、分页、生命周期等能力需要统一编排
- 你希望逻辑拆分更细，但又不想引入过重的全局状态管理范式

`hook-stash` 的核心就是围绕这些问题，提供一套更贴近 React Hooks 思维的组织方式。

## 为什么选择 hook-stash

如果你已经在使用 React Hooks，`hook-stash` 可以帮助你进一步把业务逻辑拆成“可注入的能力单元”：

- **DI 化组织逻辑**：通过 `createComponent` 和 `useInjector` 建立 Hook 依赖注入关系
- **状态共享更自然**：通过 `useSignal` 让状态成为可共享、可观察的数据源
- **逻辑和状态一起封装**：把数据、方法、副作用放在同一个 Hook 里复用
- **更适合 Hooks 体系**：不强迫你切换到 reducer/action/store 的写法

## 核心能力

### 1. 依赖注入（DI）

`createComponent` + `useInjector` 是 `hook-stash` 最核心的能力。

你可以把某个 Hook 的返回值视为一个 provider，再由子组件或下游 Hook 注入使用。

适合场景：

- 将复杂业务拆成多个独立 Hook
- 在组件层统一提供依赖
- 在子组件或下游 Hook 中按需获取逻辑能力
- 将状态、方法、派生值封装在同一个逻辑模块中

### 2. 状态共享

`useSignal` 提供了一种基于 `BehaviorSubject` 的可观察状态方案。

适合场景：

- 需要共享但不一定触发整棵组件树重渲染的状态
- 需要在 Hook 中使用响应式数据流
- 希望比 `useState` 更灵活地控制状态读取和更新

### 3. 面向业务的逻辑编排

`hook-stash` 不只是“状态管理”，它更适合做业务逻辑编排：

- Hook 之间可以互相依赖
- 状态与方法可以一起注入
- 页面级逻辑可以拆分成多个可复用模块
- 请求、分页、生命周期可统一纳入同一套组织方式

## 与 Zustand / MobX / Redux 的关系

`hook-stash` 可以在**很多业务场景中平替** Zustand / MobX / Redux，尤其适合：

- 中小型 React 项目
- 更偏 Hook 组合式的状态组织方式
- 希望把“状态 + 逻辑 + 副作用”一起封装在 Hook 里的场景

它和传统状态库的区别，可以简单理解为：

| 维度 | hook-stash | Zustand | MobX | Redux |
| --- | --- | --- | --- | --- |
| 核心定位 | Hook 级 DI + 状态共享 + 逻辑编排 | 轻量全局 store | 响应式可观察状态 | 单向数据流 + action/reducer |
| 组织方式 | 以 Hook 为中心 | 以 store 为中心 | 以 observable 为中心 | 以 store/action/reducer 为中心 |
| 状态与逻辑关系 | 状态、方法、副作用可一起封装 | 主要围绕 store | 主要围绕响应式对象 | 主要围绕状态流转 |
| 适合场景 | Hook 化业务逻辑封装、注入、共享 | 轻量全局状态管理 | 复杂响应式状态 | 大型项目、严格状态流转 |
| 学习成本 | 低到中 | 低 | 中 | 中到高 |
| 风格特点 | 更贴近 React Hooks 与函数式组件 | 简洁直接 | 自动追踪较强 | 约束更强、规范清晰 |

### 简单结论

- 如果你想要**一个纯状态管理库**，Zustand / MobX / Redux 仍然更直接
- 如果你想把**状态管理和业务逻辑封装成 Hook 复用**，`hook-stash` 会更顺手
- 如果你的项目已经大量采用 React Hooks，那么 `hook-stash` 很适合作为“逻辑编排层”

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
  createComponent,
  useInjector,
  useSignal,
  useHttpClient,
  usePaging,
  useMounted,
  useDestroy,
  useReady
} from 'hook-stash';
```

### 定义一个可共享的业务 Hook

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

### 在组件中注入使用

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

### 状态共享示例

```ts
const [count, setCount] = useSignal(0);

console.log(count());
setCount(v => v + 1);
```

## 注意事项

- `useSignal` 返回的是可调用函数，而不是普通状态值，读取时需要使用 `count()` 这类方式
- `createComponent` 适合组织依赖型 Hook；如果只是普通组件状态管理，未必需要它
- `useHttp` 已标记为弃用，建议优先使用 `useHttpClient`
- 项目依赖 `react` 和 `rxjs`，使用前请确保版本兼容
- 如果你只需要非常简单的全局 state，可能不必引入完整的 DI 组织方式

## API 概览

### 核心能力

- `createComponent`
- `useInjector`
- `useSignal`
- `useComputed`
- `useWatchEffect`
- `render`

### 请求与数据流

- `useHttpClient`
- `useHttp`
- `usePaging`

### 通用辅助 Hook

- `useRefState`
- `useReady`
- `useDestroy`
- `useMounted`
- `useSymbol`

## 项目结构

- `packages/core/di`：依赖注入相关能力
- `packages/core/signal`：响应式状态与共享数据能力
- `packages/http`：请求与分页能力
- `packages/common`：通用工具 Hook
- `example`：示例代码

## 依赖

本库基于：

- React 18
- RxJS 7

## 许可证

MIT
