import { useState } from 'react';
import { createComponent, useInjector } from '../../packages';

interface CounterBoundaryProps {
  label: string;
  tone: 'violet' | 'mint';
}

function useSharedCounter() {
  const [count, setCount] = useState(0);

  return {
    count,
    increment: () => setCount(value => value + 1),
    decrement: () => setCount(value => value - 1),
    reset: () => setCount(0),
  };
}

// Provider 数组中的后置 Hook 可以注入前置 Hook。
function useCounterSummary() {
  const { count } = useInjector(useSharedCounter);

  return {
    doubled: count * 2,
    parity: Math.abs(count) % 2 === 0 ? 'even' : 'odd',
  };
}

function CounterReader({ name }: { name: string }) {
  const { count } = useInjector(useSharedCounter);

  return (
    <div className="consumer-card">
      <span>{name}</span>
      <strong data-testid={`${name}-value`}>{count}</strong>
      <small>useInjector(useSharedCounter)</small>
    </div>
  );
}

function DerivedReader() {
  const { doubled, parity } = useInjector(useCounterSummary);

  return (
    <div className="derived-row">
      <div>
        <span className="derived-label">Derived Provider</span>
        <strong>double = {doubled}</strong>
      </div>
      <span className="parity-pill">{parity}</span>
    </div>
  );
}

function CounterControls() {
  const { decrement, increment, reset } = useInjector(useSharedCounter);

  return (
    <div className="controls">
      <button type="button" onClick={decrement} aria-label="减少计数">−</button>
      <button type="button" className="reset-button" onClick={reset}>Reset</button>
      <button type="button" onClick={increment} aria-label="增加计数">＋</button>
    </div>
  );
}

function CounterBoundary({ label, tone }: CounterBoundaryProps) {
  return (
    <article className={`boundary-card boundary-card--${tone}`}>
      <header className="boundary-header">
        <div>
          <span className="boundary-kicker">Provider scope</span>
          <h2>{label}</h2>
        </div>
        <span className="status-badge"><i /> isolated</span>
      </header>

      <div className="consumer-grid">
        <CounterReader name="Consumer A" />
        <CounterReader name="Consumer B" />
      </div>

      <DerivedReader />
      <CounterControls />

      <div className="provider-order">
        <code>useSharedCounter</code>
        <span>→</span>
        <code>useCounterSummary</code>
      </div>
    </article>
  );
}

export default createComponent(CounterBoundary, [
  useSharedCounter,
  useCounterSummary,
]);
