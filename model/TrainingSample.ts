import { createSqliteModel } from '@/lib/sqlite-model';

export interface TrainingSample {
  _id?: string;
  userId: string;
  personaCode: string;
  input: string;
  response: string;
  scenario?: string;
  createdAt: Date | string;
}

const TrainingSampleModel = createSqliteModel<TrainingSample>('training_samples', {
  defaults: () => ({}),
});

export default TrainingSampleModel;
