/**
 * 自动刷新令牌的工具函数
 * 如果访问令牌过期，自动使用刷新令牌获取新的访问令牌
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // 如果没有token，直接发送请求
  if (!token) {
    console.warn('[fetchWithAuth] 没有访问令牌，直接发送请求');
    return fetch(url, options);
  }

  // 第一次尝试
  // 创建新的 headers 对象，确保 Authorization 正确设置
  const headers = new Headers();
  // 复制原始 headers（除了 Authorization）
  if (options.headers) {
    const originalHeaders = new Headers(options.headers);
    for (const [key, value] of originalHeaders.entries()) {
      if (key.toLowerCase() !== 'authorization') {
        headers.set(key, value);
      }
    }
  }
  // 设置 Authorization header
  headers.set('Authorization', `Bearer ${token}`);

  console.log(`[fetchWithAuth] 发送请求到 ${url}，使用令牌: ${token.substring(0, 20)}...`);
  console.log(`[fetchWithAuth] Authorization header: ${headers.get('Authorization') ? `${headers.get('Authorization')!.substring(0, 30)}...` : 'null'}`);

  let response = await fetch(url, {
    method: options.method,
    headers: headers,
    body: options.body,
    // 复制其他选项
    cache: options.cache,
    credentials: options.credentials,
    integrity: options.integrity,
    keepalive: options.keepalive,
    mode: options.mode,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
    signal: options.signal,
    window: options.window,
  });

  console.log(`[fetchWithAuth] 第一次请求 ${url} 返回状态: ${response.status}`);

  // 如果返回401，尝试使用刷新令牌
  if (response.status === 401) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (refreshToken) {
      try {
        // 尝试刷新访问令牌
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.accessToken;

          console.log('[fetchWithAuth] 刷新令牌成功，新令牌:', newAccessToken ? `${newAccessToken.substring(0, 20)}...` : 'null');

          if (!newAccessToken) {
            // 刷新响应成功但没有返回新的访问令牌
            console.error('[fetchWithAuth] 刷新令牌响应成功但没有返回新的访问令牌');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
            return new Response(JSON.stringify({ message: '刷新令牌失败：未返回新的访问令牌', code: 'TOKEN_REFRESH_INVALID' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 保存新的访问令牌
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', newAccessToken);
            console.log('[fetchWithAuth] 新访问令牌已保存到 localStorage');
          }

          // 使用新的令牌重试请求
          // 创建一个全新的 headers 对象，确保使用新的 Authorization
          const retryHeaders = new Headers();
          // 复制原始 headers（除了 Authorization）
          if (options.headers) {
            const originalHeaders = new Headers(options.headers);
            for (const [key, value] of originalHeaders.entries()) {
              if (key.toLowerCase() !== 'authorization') {
                retryHeaders.set(key, value);
              }
            }
          }
          // 设置新的 Authorization header
          retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

          // 构建重试请求选项
          const retryOptions: RequestInit = {
            method: options.method,
            headers: retryHeaders,
            body: options.body,
            // 复制其他选项
            cache: options.cache,
            credentials: options.credentials,
            integrity: options.integrity,
            keepalive: options.keepalive,
            mode: options.mode,
            redirect: options.redirect,
            referrer: options.referrer,
            referrerPolicy: options.referrerPolicy,
            signal: options.signal,
            window: options.window,
          };

          console.log(`[fetchWithAuth] 重试请求配置:`, {
            method: retryOptions.method,
            hasBody: !!retryOptions.body,
            authorizationHeader: retryHeaders.get('Authorization') ? `${retryHeaders.get('Authorization')!.substring(0, 30)}...` : 'null',
            url
          });

          console.log(`[fetchWithAuth] 使用新令牌重试请求 ${url}`);
          response = await fetch(url, retryOptions);
          console.log(`[fetchWithAuth] 重试请求返回状态: ${response.status}`);

          // 如果重试成功，记录成功日志
          if (response.ok) {
            console.log('[fetchWithAuth] 重试请求成功！');
          }

          // 如果重试后仍然返回401，说明新令牌也无效，清除并返回错误
          if (response.status === 401) {
            console.error('[fetchWithAuth] 重试后仍然返回 401，新令牌无效');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
            return new Response(JSON.stringify({ message: '登录已过期，请重新登录', code: 'TOKEN_INVALID_AFTER_REFRESH' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } else {
          // 刷新令牌也过期了，清除本地存储
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          // 返回一个带有明确错误信息的响应
          return new Response(JSON.stringify({ message: '登录已过期，请重新登录', code: 'TOKEN_REFRESH_FAILED' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('刷新令牌失败:', error);
        // 清除本地存储
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        // 返回一个带有明确错误信息的响应
        return new Response(JSON.stringify({ message: '刷新令牌失败，请重新登录', code: 'TOKEN_REFRESH_ERROR' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // 没有刷新令牌，清除访问令牌
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      // 返回一个带有明确错误信息的响应
      return new Response(JSON.stringify({ message: '未登录，请先登录', code: 'NO_TOKEN' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return response;
}

