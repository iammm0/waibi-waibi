import { createSqliteModel } from '@/lib/sqlite-model';

export interface Letter {
  _id?: string;
  letterId: string;
  title: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  isPublished: boolean;
  viewCount: number;
  priority: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string;
}

const LetterModel = createSqliteModel<Letter>('letters', {
  defaults: () => ({
    author: '歪比宇宙',
    tags: [],
    isPublished: true,
    viewCount: 0,
    priority: 0,
  }),
});

export default LetterModel;
