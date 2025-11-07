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
    // 丰富的个人信息字段
    bio?: string; // 个人简介
    birthday?: Date; // 生日
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'; // 性别
    location?: string; // 所在地
    occupation?: string; // 职业
    company?: string; // 公司
    interests?: string[]; // 兴趣爱好
    website?: string; // 个人网站
    socialLinks?: { // 社交媒体链接
        github?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
        weibo?: string;
        douban?: string;
        bilibili?: string;
        custom?: { name: string; url: string }[]; // 自定义链接
    };
    education?: { // 教育背景
        school?: string;
        major?: string;
        degree?: string;
        graduationYear?: number;
    }[];
    skills?: string[]; // 技能
    tags?: string[]; // 个人标签
    signature?: string; // 个性签名
    mbtiType?: string; // MBTI类型
    languages?: string[]; // 语言
    about?: string; // 关于我(详细介绍)
    // 公开/私密状态控制
    profileVisibility: {
        email?: 'public' | 'private';
        phone?: 'public' | 'private';
        username?: 'public' | 'private';
        avatarUrl?: 'public' | 'private';
        name?: 'public' | 'private';
        bio?: 'public' | 'private';
        birthday?: 'public' | 'private';
        gender?: 'public' | 'private';
        location?: 'public' | 'private';
        occupation?: 'public' | 'private';
        company?: 'public' | 'private';
        interests?: 'public' | 'private';
        website?: 'public' | 'private';
        socialLinks?: 'public' | 'private';
        education?: 'public' | 'private';
        skills?: 'public' | 'private';
        tags?: 'public' | 'private';
        signature?: 'public' | 'private';
        mbtiType?: 'public' | 'private';
        languages?: 'public' | 'private';
        about?: 'public' | 'private';
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
  // 丰富的个人信息字段
  bio: String,
  birthday: Date,
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  location: String,
  occupation: String,
  company: String,
  interests: [String],
  website: String,
  socialLinks: {
    github: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    weibo: String,
    douban: String,
    bilibili: String,
    custom: [{ name: String, url: String }],
  },
  education: [{
    school: String,
    major: String,
    degree: String,
    graduationYear: Number,
  }],
  skills: [String],
  tags: [String],
  signature: String,
  mbtiType: String,
  languages: [String],
  about: String,
  profileVisibility: {
    email: { type: String, enum: ['public', 'private'], default: 'private' },
    phone: { type: String, enum: ['public', 'private'], default: 'private' },
    username: { type: String, enum: ['public', 'private'], default: 'public' },
    avatarUrl: { type: String, enum: ['public', 'private'], default: 'public' },
    name: { type: String, enum: ['public', 'private'], default: 'public' },
    bio: { type: String, enum: ['public', 'private'], default: 'private' },
    birthday: { type: String, enum: ['public', 'private'], default: 'private' },
    gender: { type: String, enum: ['public', 'private'], default: 'private' },
    location: { type: String, enum: ['public', 'private'], default: 'private' },
    occupation: { type: String, enum: ['public', 'private'], default: 'private' },
    company: { type: String, enum: ['public', 'private'], default: 'private' },
    interests: { type: String, enum: ['public', 'private'], default: 'private' },
    website: { type: String, enum: ['public', 'private'], default: 'private' },
    socialLinks: { type: String, enum: ['public', 'private'], default: 'private' },
    education: { type: String, enum: ['public', 'private'], default: 'private' },
    skills: { type: String, enum: ['public', 'private'], default: 'private' },
    tags: { type: String, enum: ['public', 'private'], default: 'private' },
    signature: { type: String, enum: ['public', 'private'], default: 'private' },
    mbtiType: { type: String, enum: ['public', 'private'], default: 'private' },
    languages: { type: String, enum: ['public', 'private'], default: 'private' },
    about: { type: String, enum: ['public', 'private'], default: 'private' },
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
