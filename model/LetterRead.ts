import { createSqliteModel } from '@/lib/sqlite-model';

export interface LetterRead {
  _id?: string;
  userId: string;
  letterId: string;
  readAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const LetterReadModel = createSqliteModel<LetterRead>('letter_reads', {
  defaults: () => ({
    readAt: new Date().toISOString(),
  }),
});

export default LetterReadModel;
