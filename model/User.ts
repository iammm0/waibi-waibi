import mongoose, { Document, Schema } from 'mongoose';

// 定义用户接口，继承 Document 来获得 MongoDB 文档的方法
interface User extends Document {
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    username?: string;
    avatarUrl?: string;
    passwordHash?: string;
    trainingData: { questionId: string; answer: string }[];
    modelParams: {
        temperature: number;
        topP: number;
        topK: number;
        maxTokens: number;
        epochs: number;
        learningRate: number;
    };
    // 公开/私密状态控制
    profileVisibility: {
        email?: 'public' | 'private';
        phone?: 'public' | 'private';
        username?: 'public' | 'private';
        avatarUrl?: 'public' | 'private';
        name?: 'public' | 'private';
    };
    // 订阅信息
    subscription?: {
        active: boolean;
        plan?: string;
        startDate?: Date;
        endDate?: Date;
        price?: number;
        testMode?: boolean; // 是否为测试模式
    };
    createdAt: Date;
}

// 定义用户模型的 Schema
const userSchema = new Schema<User>({
    userId: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, index: true, sparse: true },
    phone: { type: String, index: true, sparse: true },
    username: { type: String, index: true, sparse: true },
    avatarUrl: String,
    passwordHash: String,
    trainingData: [
    {
      questionId: String,
      answer: String,
    },
  ],
  modelParams: {
    temperature: { type: Number, default: 0.7 },
    topP: { type: Number, default: 0.9 },
    topK: { type: Number, default: 50 },
    maxTokens: { type: Number, default: 200 },
    epochs: { type: Number, default: 5 },
    learningRate: { type: Number, default: 0.001 }
  },
  profileVisibility: {
    email: { type: String, enum: ['public', 'private'], default: 'private' },
    phone: { type: String, enum: ['public', 'private'], default: 'private' },
    username: { type: String, enum: ['public', 'private'], default: 'public' },
    avatarUrl: { type: String, enum: ['public', 'private'], default: 'public' },
    name: { type: String, enum: ['public', 'private'], default: 'public' },
  },
  subscription: {
    active: { type: Boolean, default: false },
    plan: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    price: { type: Number, default: 20 },
    testMode: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

// 创建并导出用户模型
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
