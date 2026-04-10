import { closeSqlite, getSqliteInfo, initializeSqlite } from './sqlite-model';

let hasLoggedConnected = false;

/**
 * 兼容旧接口：初始化 SQLite 连接。
 */
export async function connectToDatabase(): Promise<any> {
  try {
    const db = initializeSqlite();
    if (!hasLoggedConnected) {
      const info = getSqliteInfo();
      console.info(`[sqlite] 数据库初始化成功: ${info.file}`);
      hasLoggedConnected = true;
    }
    return db;
  } catch (err) {
    console.error('[sqlite] 数据库初始化失败:', err);
    throw err;
  }
}

/**
 * 关闭数据库连接（主要用于测试）
 */
export async function closeDatabaseConnection(): Promise<void> {
  closeSqlite();
  hasLoggedConnected = false;
  console.info('[sqlite] 数据库连接已关闭');
}

/**
 * 保留旧方法名，返回 SQLite 连接信息
 */
export function getConnectionPoolInfo() {
  const info = getSqliteInfo();
  return {
    readyState: info.connected ? 1 : 0,
    stateName: info.connected ? 'connected' : 'disconnected',
    engine: 'sqlite',
    file: info.file,
  };
}
