/**
 * 数据库连接缓存工具
 * 用于在 Next.js API 路由中优化数据库连接
 */

import { connectToDatabase } from './db';

// 全局连接缓存
let cachedConnection: typeof import('mongoose') | null = null;
let connectionPromise: Promise<typeof import('mongoose')> | null = null;

/**
 * 获取缓存的数据库连接
 * 在 Next.js 环境中，这个函数会复用连接，避免重复连接
 */
export async function getCachedConnection() {
  // 如果已经有缓存的连接，直接返回
  if (cachedConnection) {
    return cachedConnection;
  }

  // 如果正在连接，等待连接完成
  if (connectionPromise) {
    cachedConnection = await connectionPromise;
    return cachedConnection;
  }

  // 创建新连接
  connectionPromise = connectToDatabase();
  cachedConnection = await connectionPromise;
  connectionPromise = null; // 连接完成后清除 promise

  return cachedConnection;
}

/**
 * 清除连接缓存
 * 主要用于测试或需要重新连接时
 */
export function clearConnectionCache() {
  cachedConnection = null;
  connectionPromise = null;
}

