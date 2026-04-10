import { createSqliteModel } from '@/lib/sqlite-model';

interface User {
  _id?: string;
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
  bio?: string;
  birthday?: Date | string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: string;
  occupation?: string;
  company?: string;
  interests?: string[];
  website?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    weibo?: string;
    douban?: string;
    bilibili?: string;
    custom?: { name: string; url: string }[];
  };
  education?: {
    school?: string;
    major?: string;
    degree?: string;
    graduationYear?: number;
  }[];
  skills?: string[];
  tags?: string[];
  signature?: string;
  mbtiType?: string;
  languages?: string[];
  about?: string;
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
  subscription?: {
    active: boolean;
    plan?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    price?: number;
    testMode?: boolean;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

const UserModel = createSqliteModel<User>('users', {
  defaults: () => ({
    trainingData: [],
    modelParams: {
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      maxTokens: 200,
      epochs: 5,
      learningRate: 0.001,
    },
    profileVisibility: {
      email: 'private',
      phone: 'private',
      username: 'public',
      avatarUrl: 'public',
      name: 'public',
      bio: 'private',
      birthday: 'private',
      gender: 'private',
      location: 'private',
      occupation: 'private',
      company: 'private',
      interests: 'private',
      website: 'private',
      socialLinks: 'private',
      education: 'private',
      skills: 'private',
      tags: 'private',
      signature: 'private',
      mbtiType: 'private',
      languages: 'private',
      about: 'private',
    },
    subscription: {
      active: false,
      price: 20,
      testMode: false,
    },
    interests: [],
    skills: [],
    tags: [],
    languages: [],
  }),
});

export default UserModel;
