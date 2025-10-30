import mongoose, { Document, Schema } from 'mongoose';

export interface TrainingSample extends Document {
  userId: string;
  personaCode: string; // e.g., intj
  input: string;
  response: string;
  scenario?: string;
  createdAt: Date;
}

const trainingSampleSchema = new Schema<TrainingSample>({
  userId: { type: String, index: true, required: true },
  personaCode: { type: String, index: true, required: true },
  input: { type: String, required: true },
  response: { type: String, required: true },
  scenario: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const TrainingSampleModel = mongoose.models.TrainingSample || mongoose.model<TrainingSample>('TrainingSample', trainingSampleSchema);
export default TrainingSampleModel;


