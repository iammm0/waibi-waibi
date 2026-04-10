/**
 * 数据库连接缓存工具（SQLite 版）
 */

import { connectToDatabase } from './db';

let cachedConnection: any = null;
let connectionPromise: Promise<any> | null = null;

export async function getCachedConnection() {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (connectionPromise) {
    cachedConnection = await connectionPromise;
    return cachedConnection;
  }

  connectionPromise = connectToDatabase();
  cachedConnection = await connectionPromise;
  connectionPromise = null;

  return cachedConnection;
}

export function clearConnectionCache() {
  cachedConnection = null;
  connectionPromise = null;
}
