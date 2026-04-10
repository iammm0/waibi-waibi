import { createSqliteModel } from '@/lib/sqlite-model';

interface PersonaInstance {
  _id?: string;
  userId: string;
  name: string;
  description?: string;
  personaCode?: string;
  systemPrompt?: string;
  trainingSamples: {
    input: string;
    response: string;
    scenario?: string;
  }[];
  modelParams: {
    temperature: number;
    topP: number;
    topK: number;
    maxTokens: number;
    epochs: number;
    learningRate: number;
  };
  isTrained: boolean;
  trainingStatus?: 'idle' | 'training' | 'completed' | 'error';
  avatarUrl?: string;
  tags?: string[];
  isPublic?: boolean;
  isTrainingSetPublic?: boolean;
  sourceInstanceId?: string;
  sourceUserId?: string;
  isForked?: boolean;
  isInvalid?: boolean;
  modifiedAt?: Date | string | null;
  developmentLevel?: number;
  originalUserId?: string;
  originalUserName?: string;
  developerUserId?: string;
  developerUserName?: string;
  forkChain?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

const PersonaInstanceModel = createSqliteModel<PersonaInstance>('persona_instances', {
  defaults: () => ({
    trainingSamples: [],
    modelParams: {
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      maxTokens: 200,
      epochs: 3,
      learningRate: 0.001,
    },
    isTrained: false,
    trainingStatus: 'idle',
    tags: [],
    isPublic: false,
    isTrainingSetPublic: true,
    isForked: false,
    isInvalid: false,
    developmentLevel: 1,
    forkChain: [],
  }),
});

export default PersonaInstanceModel;
