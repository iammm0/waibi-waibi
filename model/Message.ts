import mongoose, { Document, Schema } from 'mongoose';

export interface Message extends Document {
  userId?: string; // 可选，匿名留言时为空
  username?: string; // 可选，匿名留言时为空
  personaCode: string; // 人格代码，如 'intj', 'enfp'
  content: string; // 留言/评论内容
  isAnonymous: boolean; // 是否匿名
  isSystem: boolean; // 是否为系统内置留言（已废弃，保留用于兼容）
  parentId?: string; // 父评论ID，如果为空则为顶级评论
  replyToUserId?: string; // 回复的用户ID（用于@功能）
  replyToUsername?: string; // 回复的用户名（用于@功能）
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>({
  userId: { type: String, index: true, sparse: true },
  username: { type: String },
  personaCode: { type: String, index: true, required: true },
  content: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  parentId: { type: String, index: true, sparse: true }, // 父评论ID，支持嵌套回复
  replyToUserId: { type: String, sparse: true },
  replyToUsername: { type: String },
}, { timestamps: true });

const MessageModel = mongoose.models.Message || mongoose.model<Message>('Message', messageSchema);
export default MessageModel;

