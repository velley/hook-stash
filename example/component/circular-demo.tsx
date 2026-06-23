import React, { useState } from 'react';
import {
  createComponent,
  HttpIntercept,
  HTTP_INTERCEPT,
  ProviderHook,
  RequestOptions,
  useHttpClient,
  useInjector,
} from '../../packages';

interface ProfileResponse {
  method: string;
  url: string;
  authorization: string;
}

function useAuth() {
  const [, sendProfileRequest] = useHttpClient<ProfileResponse>('/profile');
  const [token, setToken] = useState('token-alpha');

  return {
    token,
    rotateToken: () => {
      setToken(current => current === 'token-alpha' ? 'token-beta' : 'token-alpha');
    },
    requestProfile: () => sendProfileRequest(),
  };
}

const useHttpIntercept: ProviderHook<HttpIntercept> = () => {
  const getAuth = useInjector(useAuth, { lazy: true });

  return {
    requestIntercept: async options => {
      const authorization = `Bearer ${getAuth().token}`;
      const response: ProfileResponse = {
        method: options.method ?? 'GET',
        url: options.url ?? '/profile',
        authorization,
      };

      // 使用 data URL 模拟接口响应，让示例可以真实经过 useHttpClient 的完整流程。
      return {
        ...options,
        url: `data:application/json,${encodeURIComponent(JSON.stringify(response))}`,
        method: options.method ?? 'GET',
        reqData: options.reqData ?? {},
        headers: {
          ...options.headers,
          Authorization: authorization,
        },
      } as RequestOptions;
    },
  };
};

useHttpIntercept.token = HTTP_INTERCEPT;

function CircularDependencyDemo() {
  const { requestProfile, rotateToken, token } = useInjector(useAuth);
  const [requestResult, setRequestResult] = useState('尚未发送请求');

  const handleRequest = () => {
    setRequestResult('请求中…');
    requestProfile()
      .then(response => {
        setRequestResult(
          `${response.method} ${response.url} · ${response.authorization}`
        );
      })
      .catch(error => {
        setRequestResult(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <section className="cycle-card" aria-labelledby="cycle-title">
      <div className="cycle-copy">
        <span className="boundary-kicker">Lazy provider registry</span>
        <h2 id="cycle-title">循环依赖，在调用时闭环</h2>
        <p>
          useHttpClient 在 useAuth 内直接调用，不作为 Provider；请求发生后，
          全局拦截器再通过 lazy getter 读取最新 token。
        </p>

        <div className="cycle-path" aria-label="循环依赖路径">
          <code>useAuth</code>
          <span>→</span>
          <code>useHttpClient()</code>
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
            onClick={handleRequest}
          >
            Send request
          </button>
        </div>
      </div>
    </section>
  );
}

export default createComponent(CircularDependencyDemo, [
  useHttpIntercept,
  useAuth,
]);
