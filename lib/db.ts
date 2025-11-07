import mongoose from 'mongoose';

// 连接状态管理
let hasLoggedConnected = false;
let hasLoggedReuse = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

// 优化的连接选项
const connectionOptions: mongoose.ConnectOptions = {
  // 连接池配置
  maxPoolSize: 50, // 最大连接池大小（默认 100，本地开发可以设置小一些）
  minPoolSize: 5, // 最小连接池大小，保持最小连接数
  maxIdleTimeMS: 30000, // 连接空闲时间（30秒）
  
  // 超时配置
  serverSelectionTimeoutMS: 5000, // 服务器选择超时（5秒）
  connectTimeoutMS: 10000, // 连接超时（10秒）
  socketTimeoutMS: 45000, // Socket 超时（45秒）
  
  // 缓冲配置
  bufferCommands: true, // 启用命令缓冲
  bufferMaxEntries: 0, // 无限制缓冲（0 表示无限制）
  
  // 心跳配置
  heartbeatFrequencyMS: 10000, // 心跳频率（10秒）
  
  // 其他优化选项
  retryWrites: true, // 启用重试写入
  retryReads: true, // 启用重试读取
  
  // 本地开发优化
  ...(process.env.NODE_ENV === 'development' && {
    // 开发环境可以禁用一些检查以提升速度
    autoIndex: true, // 自动创建索引（开发环境启用）
    autoCreate: true, // 自动创建集合
  }),
};

/**
 * 获取数据库连接
 * 使用单例模式确保连接复用
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[mongodb] MONGODB_URI 未设置，无法连接数据库');
    throw new Error('MONGODB_URI is not defined');
  }

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection.readyState;
  
  // 如果已经连接，直接返回
  if (state === 1) {
    if (!hasLoggedReuse) {
      console.info('[mongodb] 复用现有连接池 (readyState=1)');
      hasLoggedReuse = true;
    }
    return mongoose;
  }

  // 如果正在连接，等待现有连接完成
  if (state === 2) {
    if (connectionPromise) {
      console.info('[mongodb] 等待正在进行的连接完成 (readyState=2)');
      return connectionPromise;
    }
  }

  // 创建新的连接（如果还没有连接或连接已断开）
  if (!connectionPromise || state === 0) {
    connectionPromise = (async () => {
      try {
        // 如果连接已断开，先关闭旧连接
        if (state === 0 && mongoose.connection.readyState !== 0) {
          await mongoose.connection.close();
        }

        console.info('[mongodb] 正在连接数据库（配置连接池）...');
        await mongoose.connect(uri, connectionOptions);
        
        if (!hasLoggedConnected) {
          console.info('[mongodb] 数据库连接成功');
          console.info(`[mongodb] 连接池配置: maxPoolSize=${connectionOptions.maxPoolSize}, minPoolSize=${connectionOptions.minPoolSize}`);
          hasLoggedConnected = true;
        }
        
        // 监听连接事件
        setupConnectionListeners();
        
        return mongoose;
      } catch (err) {
        connectionPromise = null; // 重置连接 promise
        console.error('[mongodb] 数据库连接失败:', err);
        throw err;
      }
    })();
  }

  return connectionPromise;
}

/**
 * 设置连接事件监听器
 */
function setupConnectionListeners() {
  // 只在首次设置时添加监听器
  if (mongoose.connection.listeners('connected').length === 0) {
    mongoose.connection.on('connected', () => {
      console.info('[mongodb] 连接已建立');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[mongodb] 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[mongodb] 连接已断开');
      connectionPromise = null; // 重置连接 promise
    });

    mongoose.connection.on('reconnected', () => {
      console.info('[mongodb] 连接已重新建立');
    });

    // 监听连接池状态
    mongoose.connection.on('fullsetup', () => {
      console.info('[mongodb] 连接池已完全设置');
    });
  }
}

/**
 * 关闭数据库连接
 * 主要用于测试或应用关闭时
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    connectionPromise = null;
    console.info('[mongodb] 数据库连接已关闭');
  }
}

/**
 * 获取连接池状态信息
 */
export function getConnectionPoolInfo() {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  return {
    readyState: state,
    stateName: states[state] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    maxPoolSize: connectionOptions.maxPoolSize,
    minPoolSize: connectionOptions.minPoolSize,
  };
}
