import { createSqliteModel } from '@/lib/sqlite-model';

export interface UserPrompt {
  _id?: string;
  userId: string;
  personaCode: string;
  text: string;
  createdAt: Date | string;
}

const UserPromptModel = createSqliteModel<UserPrompt>('user_prompts', {
  defaults: () => ({}),
});

export default UserPromptModel;
