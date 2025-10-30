import mongoose, { Document, Schema } from 'mongoose';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Interaction extends Document {
  userId: string;
  personaCode: string; // e.g., intj, enfp
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>({
  role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const interactionSchema = new Schema<Interaction>({
  userId: { type: String, index: true, required: true },
  personaCode: { type: String, index: true, required: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

const InteractionModel = mongoose.models.Interaction || mongoose.model<Interaction>('Interaction', interactionSchema);
export default InteractionModel;
