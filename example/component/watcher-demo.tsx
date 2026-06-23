import { render, useComputed, useSignal } from '../../packages';

export default function WatcherDemo() {
  const [usePrimary, setUsePrimary] = useSignal(true);
  const [primary, setPrimary] = useSignal(1);
  const [secondary, setSecondary] = useSignal(100);
  const selected = useComputed(() => usePrimary() ? primary() : secondary());
  const computedValue = selected.useState();

  return (
    <section className="watcher-card" aria-label="Signal watcher demo">
      <div className="watcher-copy">
        <span className="boundary-kicker">Scoped dependency collection</span>
        <h2>Dynamic signal dependencies</h2>
        <p>
          Toggle the active branch, then change A or B. Both consumers only
          follow the signal read by their latest callback.
        </p>
      </div>

      <div className="watcher-console">
        <div className="watcher-values">
          <div>
            <span>render(callback)</span>
            {render(() => (
              <strong data-testid="render-selected">
                {usePrimary() ? primary() : secondary()}
              </strong>
            ))}
          </div>
          <div>
            <span>useComputed</span>
            <strong data-testid="computed-selected">
              {computedValue ?? 'pending'}
            </strong>
          </div>
        </div>

        <div className="watcher-source" data-testid="active-source">
          Active dependency: {usePrimary.useState() ? 'A' : 'B'}
        </div>

        <div className="watcher-actions">
          <button type="button" onClick={() => setUsePrimary(value => !value)}>
            Toggle A / B
          </button>
          <button type="button" onClick={() => setPrimary(value => value + 1)}>
            Increment A
          </button>
          <button type="button" onClick={() => setSecondary(value => value + 1)}>
            Increment B
          </button>
        </div>
      </div>
    </section>
  );
}
