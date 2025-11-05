/**
 * 自动刷新令牌的工具函数
 * 如果访问令牌过期，自动使用刷新令牌获取新的访问令牌
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  // 如果没有token，直接发送请求
  if (!token) {
    return fetch(url, options);
  }

  // 第一次尝试
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  
  let response = await fetch(url, {
    ...options,
    headers,
  });

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
          
          // 保存新的访问令牌
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', newAccessToken);
          }

          // 使用新的令牌重试请求
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // 刷新令牌也过期了，清除本地存储
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      } catch (error) {
        console.error('刷新令牌失败:', error);
        // 清除本地存储
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    } else {
      // 没有刷新令牌，清除访问令牌
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }
  }

  return response;
}

