import mongoose, { Document, Schema } from 'mongoose';

export interface Message extends Document {
  userId?: string; // 可选，匿名留言时为空
  username?: string; // 可选，匿名留言时为空
  personaCode: string; // 人格代码，如 'intj', 'enfp'
  content: string; // 留言内容
  isAnonymous: boolean; // 是否匿名
  isSystem: boolean; // 是否为系统内置留言（waibi宇宙开发者留言）
  createdAt: Date;
}

const messageSchema = new Schema<Message>({
  userId: { type: String, index: true, sparse: true },
  username: { type: String },
  personaCode: { type: String, index: true, required: true },
  content: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const MessageModel = mongoose.models.Message || mongoose.model<Message>('Message', messageSchema);
export default MessageModel;

