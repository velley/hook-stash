# hook-stash

English | [简体中文](./README.md)

[![npm version](https://img.shields.io/npm/v/hook-stash.svg)](https://www.npmjs.com/package/hook-stash)
[![license](https://img.shields.io/npm/l/hook-stash.svg)](LICENSE)
[![react](https://img.shields.io/badge/react-18.x-61dafb.svg)](https://react.dev/)
[![rxjs](https://img.shields.io/badge/rxjs-7.x-d91404.svg)](https://rxjs.dev/)

> A Hooks toolkit for React focused on dependency injection, shared state, and fine-grained rendering.

`hook-stash` is a Hooks toolkit built around **dependency injection (DI)**, **shared state**, and **fine-grained rendering** in React. Its goal is to organize business logic in a reusable, composable, and injectable way, so that components and logic boundaries stay clearer as applications grow.

It is not just another state library. Instead, it works more like a **Hook-level architecture layer** for React applications:

- Use DI to organize dependencies between Hooks
- Use shared reactive state to connect business modules
- Use `render` to drive dependency-tracked partial rendering
- Use a unified way to compose requests, pagination, and lifecycle logic

## Table of Contents

- [Positioning](#positioning)
- [Why hook-stash](#why-hook-stash)
- [Core capabilities](#core-capabilities)
- [Compared with Zustand / MobX / Redux](#compared-with-zustand--mobx--redux)
- [Installation](#installation)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Why `render` matters](#why-render-matters)
- [Notes](#notes)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Dependencies](#dependencies)
- [License](#license)

## Positioning

In React applications, a lot of business logic is naturally cross-component, cross-layer, and reusable:

- Multiple modules on the page need to share the same state
- Some Hooks depend on the output of other Hooks
- After state changes, you want only the view fragments that actually depend on it to update
- Requests, interceptors, pagination, and lifecycle behaviors need to be composed consistently
- You want smaller logic units, but do not want to adopt a heavy global state pattern

`hook-stash` is designed around exactly these problems, with an approach that stays close to the way React Hooks are already used.

## Why hook-stash

If your application already uses React Hooks heavily, `hook-stash` helps you move one step further by turning business logic into **injectable capability units**:

- **Organize logic with DI**: use `createComponent` and `useInjector` to define Hook dependency relationships
- **Share state naturally**: use `useSignal` to expose shared and observable state
- **Control rendering more precisely**: use `render` to track which signals are actually read by a view and update only that rendering block
- **Package logic and state together**: data, methods, and side effects can live in the same Hook
- **Stay in the Hooks mindset**: no need to shift everything into reducer/action/store patterns

## Core capabilities

### 1. Dependency injection (DI)

`createComponent` + `useInjector` is the core of `hook-stash`.

You can treat the return value of a Hook as a provider, and then inject it into child components or downstream Hooks.

Good for scenarios like:

- Breaking complex business logic into smaller Hooks
- Providing dependencies at the component boundary
- Getting business capabilities on demand in child components or downstream Hooks
- Packaging state, methods, and derived values in a single logic module

### 2. Shared state

`useSignal` provides an observable state model based on `BehaviorSubject`.

Good for scenarios like:

- Sharing state without forcing the entire component tree to rerender
- Using reactive data flow inside Hooks
- Getting more control over reading and updating state than plain `useState`

### 3. Fine-grained rendering

`render` is one of the biggest differences between `hook-stash` and ordinary “shared state Hook” solutions.

During rendering, it tracks which signals are actually read in the current view block. When those signals change, only that rendering block is re-executed.

This means:

- You can split component logic and rendering logic more clearly
- Updating a signal does not necessarily require re-running the whole component function
- It becomes easier to optimize partial rendering in complex pages

### 4. Business-oriented logic composition

`hook-stash` is not only about state management. It is better understood as a business logic composition tool:

- Hooks can depend on each other
- State and methods can be injected together
- Page-level logic can be split into reusable modules
- Requests, pagination, and lifecycle behaviors can all fit into the same organizational model

## Compared with Zustand / MobX / Redux

In many business scenarios, `hook-stash` can serve as an alternative to Zustand, MobX, or Redux, especially when:

- You are working on a small or medium-sized React project
- You prefer organizing state around Hook composition
- You want to package **state + logic + side effects** inside reusable Hooks

A simple comparison:

| Dimension | hook-stash | Zustand | MobX | Redux |
| --- | --- | --- | --- | --- |
| Core role | Hook-level DI + shared state + rendering orchestration | Lightweight global store | Reactive observable state | One-way data flow + action/reducer |
| Organization style | Hook-centered | Store-centered | Observable-centered | Store/action/reducer-centered |
| State and logic relation | State, methods, and side effects can be packaged together | Mostly around store | Mostly around reactive objects | Mostly around state transitions |
| Rendering strategy | Can use `render` for dependency-tracked partial rerendering | Usually relies on selectors | Strong automatic tracking | Usually relies on selectors / connect |
| Best fit | Hook-based business logic composition, injection, and sharing | Lightweight global state | Complex reactive state | Large projects with strict state flow |
| Learning cost | Low to medium | Low | Medium | Medium to high |
| Style | Closer to React Hooks and function components | Simple and direct | Strong reactivity model | Strong constraints and conventions |

### Quick conclusion

- If you only want a **pure state management library**, Zustand / MobX / Redux may be more direct
- If you want to package **state management and business logic together into reusable Hooks**, `hook-stash` feels more natural
- If you also want **DI + partial render tracking** on top of shared state, `hook-stash` has a stronger advantage

> “Alternative” here does not mean complete feature equivalence. It means `hook-stash` can replace those libraries in many business scenarios, depending on the architecture you want.

## Installation

```bash
npm install hook-stash react rxjs
```

Or:

```bash
yarn add hook-stash react rxjs
```

## Quick start

### Import

```ts
import {
  createComponent,
  render,
  useInjector,
  useSignal
} from 'hook-stash';
```

### Define an injectable and shared business Hook

```ts
import { useSignal } from 'hook-stash';

export function useAppData() {
  const [name, setName] = useSignal('demo');
  const [age, setAge] = useSignal(18);
  const [city, setCity] = useSignal('Shanghai');

  return {
    name,
    age,
    city,
    changeName: (nextName: string) => setName(nextName),
    increaseAge: () => setAge((value) => value + 1),
    changeCity: (nextCity: string) => setCity(nextCity),
  };
}
```

### Inject business capabilities into components with DI

```tsx
import React from 'react';
import { createComponent, render, useInjector } from 'hook-stash';
import { useAppData } from './useAppData';

const ProfileName = () => {
  const { name } = useInjector(useAppData);
  return render(() => <div>name: {name()}</div>);
};

const ProfileAge = () => {
  const { age } = useInjector(useAppData);
  return render(() => <div>age: {age()}</div>);
};

const ProfileEditor = () => {
  const { changeName, increaseAge } = useInjector(useAppData);

  return (
    <div>
      <button onClick={() => changeName('alice')}>change name</button>
      <button onClick={increaseAge}>age + 1</button>
    </div>
  );
};

const ProfilePage = () => {
  return (
    <div>
      <ProfileName />
      <ProfileAge />
      <ProfileEditor />
    </div>
  );
};

export default createComponent(ProfilePage, [useAppData]);
```

This example shows three important ideas:

- `useAppData` is injected once as a provider
- Multiple child components share the same state source
- Each child component only subscribes to the signals it actually reads through `render`

## How it works

The core of `hook-stash` can be understood as three layers working together:

### 1. DI layer: organize logic dependencies

With `createComponent`, you declare a set of provider Hooks at the component boundary. Their return values are attached to the current component context and can later be retrieved with `useInjector` by child components or downstream Hooks.

This makes it possible to:

- Avoid passing business capabilities through many layers of props
- Organize Hooks more like reusable services
- Split a page into modules based on business responsibility

### 2. Signal layer: hold shared state

`useSignal` is built on top of `BehaviorSubject` and returns a pair of “read function + update function”.

So instead of returning a plain value, it returns a reactive state accessor.

That means signals:

- Can be shared across components
- Can be tracked independently by different rendering blocks
- Can be exposed as part of a DI provider result

### 3. Render layer: track view dependencies

When `render(() => ...)` runs, it records which signals are read in that render block. Those signals are registered in a render watcher. When they change, only that render block is triggered again.

That is why the key value of `hook-stash` is not just “shared state”, but the combination of:

- **shared state + DI + partial render tracking**

## Why `render` matters

If you only use `useSignal`, you get a shared and observable signal. But what makes that signal participate in fine-grained view updates is `render`.

### Why not just write `name()` directly in JSX?

You can, but `render(() => ...)` matters because:

- It records which signals are read during the render function
- When those signals change, only that render callback is re-executed
- This separates “component execution” from “view updates” more clearly

### Recommended pattern

```tsx
const UserCard = () => {
  const { name, age } = useInjector(useAppData);

  return render(() => (
    <div>
      <span>{name()}</span>
      <span>{age()}</span>
    </div>
  ));
};
```

### What `$` is for

Besides `render`, the library also provides `$` as a shortcut for rendering a single signal:

```tsx
import { $ } from 'hook-stash';

const UserLine = () => {
  const { name, age } = useInjector(useAppData);

  return (
    <div>
      <span>{$(name)}</span>
      <span>{$(age, (value) => `${value} years old`)}</span>
    </div>
  );
};
```

It works well for simple value rendering, while `render(() => ...)` is usually clearer for view blocks that depend on multiple signals.

## Notes

- `useSignal` returns callable accessors, not plain state values, so you read values with `count()`-style calls
- `render` is best used for view fragments that truly depend on signals, so that dependency tracking is meaningful
- `createComponent` is especially useful for dependency-oriented Hook composition; you may not need it for simple local component state
- Provider Hooks in `createComponent` are scoped in array order: later Hooks may inject earlier Hooks, while reverse or circular dependencies throw an error
- `useHttp` is deprecated; prefer `useHttpClient`
- The project depends on `react` and `rxjs`, so make sure your versions are compatible
- If you only need very simple global state, you may not need the full DI-based organization model

## API overview

### Core capabilities

- `createComponent`
- `useInjector`
- `useSignal`
- `render`
- `$`
- `useComputed`
- `useWatchEffect`

### Request and data flow

- `useHttpClient`
- `useHttp`
- `usePaging`

### Utility Hooks

- `useRefState`
- `useReady`
- `useDestroy`
- `useMounted`
- `useSymbol`

## Project structure

- `packages/core/di`: dependency injection
- `packages/core/signal`: reactive state and shared data
- `packages/core/render`: render dependency tracking and partial rendering
- `packages/http`: request and pagination utilities
- `packages/common`: shared utility Hooks
- `example`: demo code

## Dependencies

This library is built on:

- React 18
- RxJS 7

## License

MIT
