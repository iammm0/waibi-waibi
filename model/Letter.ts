import mongoose, { Document, Schema } from 'mongoose';

export interface Letter extends Document {
  letterId: string; // 信件ID（唯一）
  title: string; // 信件标题
  content: string; // 信件内容
  author?: string; // 作者（可选，默认"歪比宇宙"）
  category?: string; // 分类（可选）
  tags?: string[]; // 标签
  isPublished: boolean; // 是否发布
  viewCount: number; // 查看次数
  priority: number; // 优先级（数字越大越优先）
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date; // 发布时间
}

const letterSchema = new Schema<Letter>({
  letterId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: '歪比宇宙' },
  category: { type: String },
  tags: { type: [String], default: [] },
  isPublished: { type: Boolean, default: true, index: true },
  viewCount: { type: Number, default: 0 },
  priority: { type: Number, default: 0, index: true },
  publishedAt: { type: Date },
}, { timestamps: true });

const LetterModel = mongoose.models.Letter || mongoose.model<Letter>('Letter', letterSchema);
export default LetterModel;

