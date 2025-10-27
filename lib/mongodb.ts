// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name';

if (!MONGODB_URI) {
    throw new Error('请在环境变量中设置 MongoDB URI');
}

let cached = global._mongo; // 避免多次连接 MongoDB

if (!cached) {
    cached = global._mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        // 如果已经有连接，直接返回
        return cached.conn;
    }

    if (!cached.promise) {
        // 连接选项已经更新，移除不必要的选项
        cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
            return mongooseInstance;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
