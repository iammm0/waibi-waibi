import mongoose, { Document, Schema } from 'mongoose';

// 定义用户接口，继承 Document 来获得 MongoDB 文档的方法
interface User extends Document {
    userId: string;
    name: string;
    trainingData: { questionId: string; answer: string }[];
    createdAt: Date;
}

// 定义用户模型的 Schema
const userSchema = new Schema<User>({
    userId: { type: String, required: true, unique: true },
    name: String,
    trainingData: [
        {
            questionId: String,
            answer: String,
        },
    ],
    createdAt: { type: Date, default: Date.now },
});

// 创建并导出用户模型
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
