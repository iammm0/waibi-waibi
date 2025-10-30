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
  createdAt: { type: Date, default: Date.now },
});

// 创建并导出用户模型
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
