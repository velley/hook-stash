# hook-stash

[English](./README.en.md) | 简体中文

[![npm version](https://img.shields.io/npm/v/hook-stash.svg)](https://www.npmjs.com/package/hook-stash)
[![license](https://img.shields.io/npm/l/hook-stash.svg)](LICENSE)
[![react](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://react.dev/)
[![rxjs](https://img.shields.io/badge/rxjs-7.x-d91404.svg)](https://rxjs.dev/)

> 面向复杂 React 业务模块的 Hook 依赖注入与作用域共享工具。

`hook-stash` 允许你把一个普通 Hook 的返回值作为 Provider，在组件树的指定边界内共享。

它的重点不是替代 React 的 `useState`、`useEffect` 或 Context，而是减少围绕业务 Hook 手工创建 Context、Provider 和消费 Hook 的重复工作，让认证、用户资料、编辑器会话等业务能力能够按作用域组合。

```tsx
const Page = createComponent(PageView, [useAuth, useProfile]);

function ProfileName() {
  const profile = useInjector(useProfile);
  return <span>{profile.name}</span>;
}
```

## 目录

- [适合解决什么问题](#适合解决什么问题)
- [是否应该使用](#是否应该使用)
- [安装](#安装)
- [快速开始](#快速开始)
- [Provider 依赖与作用域](#provider-依赖与作用域)
- [循环依赖与 lazy 注入](#循环依赖与-lazy-注入)
- [Signal 与局部渲染](#signal-与局部渲染)
- [HTTP 请求 Hook](#http-请求-hook)
- [与其他方案的关系](#与其他方案的关系)
- [核心约束](#核心约束)
- [API 概览](#api-概览)
- [设计概要](#设计概要)
- [项目结构](#项目结构)

## 适合解决什么问题

React 原生能力足以实现依赖注入和状态共享，但当业务 Hook 数量增加时，通常需要反复编写 Context、Provider、类型和消费函数。

`hook-stash` 主要处理以下场景：

- 多个深层组件需要共享同一个业务 Hook 实例
- Provider Hook 需要使用其他 Provider Hook 提供的能力
- 同一种业务模块需要在不同组件子树中创建相互隔离的实例
- 希望把状态、方法和副作用封装在 Hook 内，而不是拆成全局 store
- 部分高频状态需要通过 Signal 做局部渲染或派生计算

这个库最重要的能力是 **Hook DI 与作用域管理**。Signal、HTTP 请求和分页 Hook 是可以独立使用的辅助能力，并不要求先注册为 Provider。

## 是否应该使用

`hook-stash` 不是常规 React 项目的必选依赖。

适合考虑引入：

- 项目中已经存在大量业务型 Hook，并且经常需要跨层级共享
- 手写 Context Provider 的数量开始影响维护效率
- 页面、弹窗或工作区需要同一业务模块的多个隔离实例
- 业务能力之间存在明确的依赖关系，希望在组件边界统一装配

通常不需要引入：

- 只有少量组件状态或一两个简单 Context
- 主要需求是服务端数据缓存、失效和重试，此时更适合 TanStack Query 等工具
- 需要严格的全局状态流、时间旅行或成熟的调试生态，此时 Redux 等方案更完整
- 团队更重视 React 原生模型的透明度，不希望增加额外抽象

建议先从一个具有明确边界的业务模块开始使用，而不是一次性替换整个项目的状态方案。

## 安装

```bash
npm install hook-stash rxjs
```

项目需要使用 React 18 和 RxJS 7。

## 快速开始

下面的例子只使用 React 原生 `useState`。这正是 `hook-stash` 的核心用途：共享一个普通 Hook 的返回值，而不是强制切换状态模型。

### 1. 定义 Provider Hook

```tsx
import { useState } from 'react';

function useCounter() {
  const [count, setCount] = useState(0);

  return {
    count,
    increment: () => setCount(value => value + 1),
    reset: () => setCount(0),
  };
}
```

### 2. 在子组件中注入

```tsx
import { useInjector } from 'hook-stash';

function CounterValue() {
  const { count } = useInjector(useCounter);
  return <strong>{count}</strong>;
}

function CounterActions() {
  const { increment, reset } = useInjector(useCounter);

  return (
    <div>
      <button onClick={increment}>+1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 3. 创建作用域边界

```tsx
import { createComponent } from 'hook-stash';

function CounterPanel() {
  return (
    <section>
      <CounterValue />
      <CounterActions />
    </section>
  );
}

export default createComponent(CounterPanel, [useCounter]);
```

`CounterValue` 和 `CounterActions` 得到的是同一个 `useCounter` 实例。每挂载一个 `CounterPanel`，都会创建一份独立状态。

## Provider 依赖与作用域

### Provider 之间的依赖

Provider Hook 可以注入已经位于外层的 Provider：

```tsx
function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  return { userId, setUserId };
}

function useProfile() {
  const auth = useInjector(useAuth);

  return {
    userId: auth.userId,
    canLoadProfile: auth.userId !== null,
  };
}

const ProfilePage = createComponent(ProfileView, [useAuth, useProfile]);
```

Provider 按数组顺序由外向内嵌套。因此在立即注入模式下，后面的 Provider 可以依赖前面的 Provider：

```text
useAuth → useProfile → ProfileView
```

### 嵌套组件边界

注入器会沿组件树向父级查找，因此子级 `createComponent` 可以同时访问自己的 Provider 和祖先边界中的 Provider：

```tsx
const App = createComponent(AppView, [useAuth]);
const ProfileSection = createComponent(ProfileView, [useProfile]);
```

当 `ProfileSection` 渲染在 `App` 内部时，其后代可以注入 `useProfile`，也可以继续注入根边界的 `useAuth`。

如果子级注册了相同的 Provider，则优先使用距离当前组件最近的实例，从而形成自然的作用域覆盖。

## 循环依赖与 lazy 注入

有些业务 Provider 只能在真正调用方法时闭环。例如：

```text
useSession → useApiService → useRequestHeaders → useSession
```

这类依赖不能在 Provider 渲染期间全部立即解析。可以使用 `{ lazy: true }` 获取一个延迟 getter：

```tsx
function useSession() {
  const getApiService = useInjector(useApiService, { lazy: true });
  const [token, setToken] = useState('token-alpha');

  return {
    token,
    setToken,
    refresh: () => getApiService().post('/session/refresh'),
  };
}

function useApiService() {
  const getRequestHeaders = useInjector(useRequestHeaders, { lazy: true });

  return {
    post: (url: string) => fetch(url, {
      method: 'POST',
      headers: getRequestHeaders().getHeaders(),
    }),
  };
}

function useRequestHeaders() {
  const getSession = useInjector(useSession, { lazy: true });

  return {
    getHeaders: () => ({
      Authorization: `Bearer ${getSession().token}`,
    }),
  };
}

const App = createComponent(AppView, [
  useSession,
  useApiService,
  useRequestHeaders,
]);
```

lazy getter 只能在所有 Provider 已提交之后读取，例如事件回调、异步方法或 `useEffect`。不要在 Provider 或组件渲染期间立即执行它：

```tsx
const getSession = useInjector(useSession, { lazy: true });

// 正确：在调用期解析
const handleClick = () => console.log(getSession().token);

// 错误：Provider 可能尚未完成提交
const token = getSession().token;
```

lazy 注入解决的是初始化时序问题，并不意味着所有循环依赖都是合理设计。如果两个模块始终互相了解大量实现细节，仍应考虑提取更小的公共能力。

## Signal 与局部渲染

Signal 是可选能力，不是使用 DI 的前置条件。普通 `useState`、`useReducer` 和其他 Hook 都可以作为 Provider 的内部实现。

### useSignal

`useSignal` 返回读取函数和更新函数：

```tsx
const [count, setCount] = useSignal(0);

count();
setCount(1);
setCount(value => value + 1);
```

Signal 读取函数还提供：

- `signal.useState()`：在组件中订阅并获取当前值
- `signal.watchEffect(callback)`：在 effect 中监听变化
- `signal.observable`：访问对应的 RxJS Observable

### render

`render(() => ...)` 会同步收集回调中读取的 Signal，并在依赖变化后只更新这一渲染片段：

```tsx
function CounterValue() {
  const { count } = useInjector(useSignalCounter);

  return render(() => (
    <strong>{count()}</strong>
  ));
}
```

动态分支会在每次回调执行后重新收集依赖：

```tsx
return render(() => (
  <span>{usePrimary() ? primary() : secondary()}</span>
));
```

切换到 `secondary` 后，后续渲染将跟随新的依赖分支。

对于简单的单 Signal 渲染，可以使用 `$`：

```tsx
<span>{$(count)}</span>
<span>{$(count, value => `count: ${value}`)}</span>
```

### useComputed 与 useWatchEffect

```tsx
const double = useComputed(() => count() * 2);

useWatchEffect(() => {
  console.log('count changed:', count());
});
```

`useComputed` 会追踪计算回调读取的 Signal，并在动态依赖发生变化时重新绑定。

对于普通表单和低频状态，优先使用 React 原生 state。只有在确实需要共享 Observable、派生计算或局部渲染时再使用 Signal。

## HTTP 请求 Hook

`useHttpClient` 是一个可以直接在组件或其他 Hook 中调用的请求 Hook，不需要先通过 `createComponent` 注册，也不需要使用 `useInjector` 获取。

```tsx
interface User {
  name: string;
}

function UserPanel() {
  const [user, requestUser, requestState, requestError] =
    useHttpClient<User>('/api/user');

  const data = user.useState();
  const state = requestState.useState();
  const error = requestError.useState();

  return (
    <section>
      <button onClick={() => requestUser({ id: 1 })}>
        Load user
      </button>
      <div>state: {state}</div>
      {data && <div>{data.name}</div>}
      {error && <div>{error.message}</div>}
    </section>
  );
}
```

每次调用 `useHttpClient` 都拥有独立的响应数据、请求状态和错误状态。这些状态通常只服务于当前请求实例，不建议为了复用请求能力而将 `useHttpClient` 本身注册成 Provider；否则多个调用方共享同一组请求状态，容易出现响应覆盖、loading 状态互相干扰等问题。

请求拦截器、自定义 requester 等基础设施可以按需通过 DI 提供，但一次请求产生的 `response / state / error` 应默认保留在调用它的组件或 Hook 内部。

## 与其他方案的关系

这些方案解决的问题并不完全相同：

| 方案 | 主要用途 | 更适合的场景 |
| --- | --- | --- |
| React state / Context | React 原生局部状态与跨层共享 | 状态简单、依赖关系少、重视透明度 |
| hook-stash | Hook DI、作用域共享、业务能力组合 | Provider 较多、需要多实例隔离或 Hook 间依赖 |
| Zustand / Jotai | 轻量客户端 store | 需要直接、独立于组件树的共享状态 |
| Redux | 可预测的全局状态流 | 大型团队、严格约束、调试与中间件需求 |
| TanStack Query | 服务端状态管理 | 请求缓存、失效、重试和并发请求 |

`hook-stash` 可以和这些工具同时使用。例如 Provider Hook 内部可以调用 TanStack Query，也可以注入一个 Zustand store。它不要求业务状态全部迁移到自己的 Signal 模型。

## 核心约束

- Provider 必须是合法的 React Hook，并遵守 Hooks Rules
- Provider Hook 必须返回非 `null`、非数组的 object 对象
- `createComponent(Component, providers)` 中 Provider 的顺序表示立即依赖顺序
- 普通注入只能读取当前或祖先作用域中已经建立的 Provider
- `{ lazy: true }` 返回 getter，只能在 Provider 提交后的调用期执行
- `{ optional: true }` 可在 Provider 不存在时返回 `null`
- Signal 是可调用读取函数，读取值需要使用 `count()`，而不是直接渲染函数本身
- `render` 应用于真正需要 Signal 依赖追踪的局部视图，不建议包裹所有 JSX
- 循环依赖应保持在调用期；如果初始化阶段必须互相读取，应该重新划分模块职责

## API 概览

### DI

#### `createComponent(Component, providers)`

为组件创建 Provider 作用域。每个 Provider Hook 在独立的 React 组件中执行。

#### `useInjector(provider, options?)`

注入当前或祖先作用域中的 Provider。

```ts
const service = useInjector(useService);
const service = useInjector(useService, { optional: true });
const getService = useInjector(useService, { lazy: true });
const getService = useInjector(useService, { lazy: true, optional: true });
```

可用选项：

- `lazy`：返回延迟解析 getter
- `optional`：未找到 Provider 时返回 `null`
- `skipOne`：跳过当前注入层，从父级继续查找

### Signal 与渲染

- `useSignal(initialValue)`
- `useComputed(compute)`
- `useWatchEffect(callback)`
- `render(callback)`
- `$(signal, map?, placeholder?)`

### HTTP 请求与分页

- `useHttpClient`：直接在组件或其他 Hook 中调用，每次调用维护独立请求状态
- `usePaging`
- `useHttp`：已弃用，建议使用 `useHttpClient`

### 通用 Hook

- `useRefState`
- `useReady`
- `useDestroy`
- `useMounted`

## 设计概要

### Provider 层

`createComponent` 将每个 Provider Hook 固定在独立组件中执行，使其生命周期遵循 React 组件规则。Provider 返回值通过嵌套 Context 向下暴露，注入时沿父级作用域查找。

### Lazy Registry

每个 `createComponent` 边界维护一个 Provider registry。Provider 完成提交后才会写入可供 lazy getter 读取的实例，避免中断渲染或未提交状态污染依赖关系。

### Signal Collector

Signal 依赖只在 `render`、`useComputed` 或 `useWatchEffect` 回调同步执行期间收集。收集状态使用栈管理，并在回调结束或抛出异常时立即清理，不依赖跨组件的全局活动 watcher。

## 项目结构

- `packages/core/di`：Provider、注入器和 lazy registry
- `packages/core/signal`：Signal、Computed 与依赖收集
- `packages/core/render`：Signal 局部渲染
- `packages/http`：可直接使用的请求与分页 Hook
- `packages/common`：通用 Hook
- `example`：DI、循环依赖与动态 Signal 示例

## 许可证

MIT
