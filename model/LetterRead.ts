import mongoose, { Document, Schema } from 'mongoose';

export interface LetterRead extends Document {
  userId: string; // 用户ID
  letterId: string; // 信件ID
  readAt: Date; // 阅读时间
  createdAt: Date;
  updatedAt: Date;
}

const letterReadSchema = new Schema<LetterRead>({
  userId: { type: String, required: true, index: true },
  letterId: { type: String, required: true, index: true },
  readAt: { type: Date, default: Date.now },
}, { timestamps: true });

// 创建复合索引，确保每个用户对每个信件只有一条记录
letterReadSchema.index({ userId: 1, letterId: 1 }, { unique: true });

const LetterReadModel = mongoose.models.LetterRead || mongoose.model<LetterRead>('LetterRead', letterReadSchema);
export default LetterReadModel;

