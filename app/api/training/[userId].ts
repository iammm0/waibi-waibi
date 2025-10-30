import { NextApiRequest, NextApiResponse } from 'next';
import User from "@/model/User";
import { connectToDatabase } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload) return res.status(401).send('未授权');
    try {
        await connectToDatabase();
    } catch (e) {
        console.error('[api][training] 无法连接到数据库:', e);
        return res.status(500).send('数据库连接失败');
    }
    const { userId } = req.query;
    const { answers, modelParams } = req.body; // 用户提交的答案和模型参数

    if (req.method === 'POST') {
        try {
            let user = await User.findOne({ userId });
            if (!user) {
                user = new User({ userId, name: `User-${userId}` });
            }

            // 保存用户的训练数据
            // 保存用户的训练数据
            answers.forEach((answer: { questionId: string; answer: string; }) => {
                user.trainingData.push(answer);
            });

            // 保存模型参数（如果提供）
            if (modelParams) {
                user.modelParams = modelParams;
            }

            await user.save();
            return res.status(200).send('训练数据已保存');
        } catch (error) {
            console.error('[api][training] 保存失败:', error);
            return res.status(500).send('保存失败');
        }
    }

    res.status(405).end(); // Method Not Allowed
}
