import { useState } from 'react';
import { createComponent, useInjector } from '../../packages';

interface RequestOptions {
  url: string;
  headers: Record<string, string>;
}

function useAuth() {
  const getHttpClient = useInjector(useHttpClient, { lazy: true });
  const [token, setToken] = useState('token-alpha');

  return {
    token,
    rotateToken: () => {
      setToken(current => current === 'token-alpha' ? 'token-beta' : 'token-alpha');
    },
    requestProfile: () => getHttpClient().request('/profile'),
  };
}

function useHttpClient() {
  const getIntercept = useInjector(useHttpIntercept, { lazy: true });

  return {
    request: (url: string) => {
      const options = getIntercept().beforeRequest({ url, headers: {} });
      return `GET ${options.url} · ${options.headers.Authorization}`;
    },
  };
}

function useHttpIntercept() {
  const getAuth = useInjector(useAuth, { lazy: true });

  return {
    beforeRequest: (options: RequestOptions): RequestOptions => ({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${getAuth().token}`,
      },
    }),
  };
}

function CircularDependencyDemo() {
  const { requestProfile, rotateToken, token } = useInjector(useAuth);
  const [requestResult, setRequestResult] = useState('尚未发送请求');

  return (
    <section className="cycle-card" aria-labelledby="cycle-title">
      <div className="cycle-copy">
        <span className="boundary-kicker">Lazy provider registry</span>
        <h2 id="cycle-title">循环依赖，在调用时闭环</h2>
        <p>
          三个 Provider 在渲染时只保存 lazy getter，请求发生后再依次解析依赖。
        </p>

        <div className="cycle-path" aria-label="循环依赖路径">
          <code>useAuth</code>
          <span>→</span>
          <code>useHttpClient</code>
          <span>→</span>
          <code>useHttpIntercept</code>
          <span>↻</span>
        </div>
      </div>

      <div className="cycle-console">
        <div className="console-row">
          <span>current token</span>
          <strong data-testid="current-token">{token}</strong>
        </div>
        <div className="console-row console-row--result">
          <span>request result</span>
          <output data-testid="request-result">{requestResult}</output>
        </div>
        <div className="cycle-actions">
          <button type="button" onClick={rotateToken}>Rotate token</button>
          <button
            type="button"
            className="send-button"
            onClick={() => setRequestResult(requestProfile())}
          >
            Send request
          </button>
        </div>
      </div>
    </section>
  );
}

export default createComponent(CircularDependencyDemo, [
  useAuth,
  useHttpClient,
  useHttpIntercept,
]);
