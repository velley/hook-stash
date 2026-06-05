# hook-stash

`hook-stash` 是一个面向 React 的 Hooks 工具库，目标是把常见的状态管理、组件依赖注入、生命周期处理和异步请求等能力，封装成更易复用的 Hook 方案。

它更像一个“React Hooks 工具箱”：你可以在项目里按需组合使用这些能力，而不是为每个场景重复编写样板代码。

## 它能解决什么问题

在 React 开发中，我们经常会遇到这些重复场景：

- 组件间共享逻辑时，需要重复封装和传递状态
- 组件内部要管理可观察的状态，但又不希望每次变更都触发完整重渲染
- 需要更轻量的依赖注入方式来组织 Hooks 之间的依赖关系
- 需要统一处理挂载、卸载、首次执行等生命周期逻辑
- 需要把请求、拦截器和自定义请求适配能力封装到 Hook 中

`hook-stash` 就是为了把这些模式沉淀成可复用的 Hook 组合。

## 核心能力

### 1. 可观察状态：`useSignal`

基于 `BehaviorSubject` 实现的可观察状态方案，适合在 Hook 内部替代部分 `useState` 场景。

特点：

- 提供读取与写入分离的状态访问方式
- 状态变更不一定触发组件重新执行
- 支持 `useState()`、`watchEffect()` 等使用方式

### 2. Hook 依赖注入：`createComponent` / `useInjector`

库内提供了一套 Hook 注入机制，帮助你把某个 Hook 的返回值作为“依赖”向子组件或下游逻辑传递。

特点：

- 用 Hook 作为 provider
- 在组件树中按上下文获取依赖
- 支持跨层级查找依赖
- 适合组织复杂的 Hook 复合逻辑

### 3. 生命周期辅助 Hook

内置了一些常用的生命周期封装：

- `useReady`：首次执行一次
- `useMounted`：挂载时执行
- `useDestroy`：卸载时执行
- `useRefState`：返回“引用式”的对象状态更新方式
- `useSymbol`：生成组件级唯一标识

### 4. HTTP 请求 Hook：`useHttp`

提供基于 fetch 的请求封装，并支持：

- 请求自动化处理
- 请求/响应拦截
- 自定义请求实现注入
- 状态管理：`ready / pending / success / failed`

> 注：代码中 `useHttp` 已标记为 deprecated，建议优先使用新的 `useHttpClient` 方案（如项目中已有对应实现）。

## 适合哪些场景

`hook-stash` 适合：

- 想把业务逻辑拆成更清晰的 Hook 模块
- 想用 Hook 管理状态流转，而不是只依赖传统组件 state
- 想在 React 项目里尝试更灵活的依赖注入式 Hook 组织方式
- 想统一封装请求、生命周期和共享状态逻辑

## 示例

### 使用 `useSignal`

```ts
import { useSignal } from 'hook-stash';

const [count, setCount] = useSignal(0);

console.log(count());
setCount(v => v + 1);
```

### 封装复用 Hook

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

## 项目结构概览

- `packages/common`：通用 Hook
- `packages/core/signal`：信号/可观察状态相关实现
- `packages/core/di`：Hook 依赖注入相关实现
- `packages/http`：HTTP 请求相关 Hook
- `example`：示例代码

## 为什么使用 hook-stash

如果你的项目中已经开始大量抽取自定义 Hook，那么 `hook-stash` 可以帮助你进一步把这些 Hook 组织成一个更完整的“逻辑层”：

- 逻辑更易复用
- 状态更新更灵活
- 依赖关系更清晰
- 代码更容易按职责拆分

## 许可证

MIT
