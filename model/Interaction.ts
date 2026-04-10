import { createSqliteModel } from '@/lib/sqlite-model';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: Date | string;
}

export interface Interaction {
  _id?: string;
  userId: string;
  personaCode: string;
  messages: Message[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

const InteractionModel = createSqliteModel<Interaction>('interactions', {
  defaults: () => ({
    messages: [],
  }),
});

export default InteractionModel;
