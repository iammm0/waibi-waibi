import { NextApiRequest, NextApiResponse } from 'next';
import User from "@/model/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;
    const { answers } = req.body; // 用户提交的答案

    if (req.method === 'POST') {
        try {
            let user = await User.findOne({ userId });
            if (!user) {
                user = new User({ userId, name: `User-${userId}` });
            }

            // 保存用户的训练数据
            answers.forEach((answer: { questionId: string; answer: string; }) => {
                user.trainingData.push(answer);
            });

            await user.save();
            return res.status(200).send('训练数据已保存');
        } catch (error) {
            return res.status(500).send('保存失败');
        }
    }

    res.status(405).end(); // Method Not Allowed
}
