import mongoose, { Document, Schema } from 'mongoose';

export interface UserPrompt extends Document {
  userId: string;
  personaCode: string; // e.g., intj
  text: string;
  createdAt: Date;
}

const userPromptSchema = new Schema<UserPrompt>({
  userId: { type: String, index: true, required: true },
  personaCode: { type: String, index: true, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const UserPromptModel = mongoose.models.UserPrompt || mongoose.model<UserPrompt>('UserPrompt', userPromptSchema);
export default UserPromptModel;
