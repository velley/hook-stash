import './App.css';
import CounterBoundary from './component/demo-a';
import CircularDependencyDemo from './component/circular-demo';

const App = () => {
  return (
    <main className="app-shell">
      <header className="hero">
        <div className="brand-row">
          <span className="brand-mark">HS</span>
          <span className="eyebrow">hook-stash · DI preview</span>
        </div>
        <h1>普通 Hook，也能成为共享状态</h1>
        <p className="hero-copy">
          每张卡都是一个独立的 <code>createComponent</code> 边界。
          卡片内部的多个组件通过 <code>useInjector</code> 共享同一个原生
          <code> useState</code> Hook 返回值。
        </p>
        <div className="legend" aria-label="示例说明">
          <span><i className="dot dot-shared" />同一边界共享</span>
          <span><i className="dot dot-isolated" />不同边界隔离</span>
          <span><i className="dot dot-derived" />Provider 顺序依赖</span>
          <span><i className="dot dot-cycle" />调用期循环依赖</span>
        </div>
      </header>

      <section className="boundary-grid" aria-label="DI 状态共享示例">
        <CounterBoundary label="Boundary A" tone="violet" />
        <CounterBoundary label="Boundary B" tone="mint" />
      </section>

      <CircularDependencyDemo />

      <footer className="page-note">
        尝试只操作一侧：同侧两个 Consumer 和 Derived Provider 会同步更新，另一侧保持不变。
      </footer>
    </main>
  );
};

export default App;
