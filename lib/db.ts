import mongoose from 'mongoose';

let hasLoggedConnected = false;
let hasLoggedReuse = false;

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[mongodb] MONGODB_URI 未设置，无法连接数据库');
    throw new Error('MONGODB_URI is not defined');
  }

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection.readyState;
  if (state === 1) {
    if (!hasLoggedReuse) {
      console.info('[mongodb] 复用现有连接 (readyState=1)');
      hasLoggedReuse = true;
    }
    return mongoose;
  }

  if (state === 2) {
    console.info('[mongodb] 等待正在进行的连接完成 (readyState=2)');
    return mongoose;
  }

  try {
    console.info('[mongodb] 正在连接数据库 ...');
    await mongoose.connect(uri);
    if (!hasLoggedConnected) {
      console.info('[mongodb] 数据库连接成功');
      hasLoggedConnected = true;
    }
    return mongoose;
  } catch (err) {
    console.error('[mongodb] 数据库连接失败:', err);
    throw err;
  }
}
