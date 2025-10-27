import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'json2csv'; // 导入 json2csv 的 parse 函数
import User from '@/model/User';  // 引入用户模型

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query; // 从 query 中获取 userId

    if (req.method === 'GET') {  // 处理 GET 请求
        try {
            // 查找用户的训练数据
            const user = await User.findOne({ userId });
            if (!user) {
                return res.status(404).send('用户未找到');
            }

            // 使用 json2csv 将训练数据转换为 CSV 格式
            const csv = parse(user.trainingData);

            // 设置响应头并触发文件下载
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${userId}-training.csv`);
            res.send(csv); // 发送 CSV 数据到客户端
        } catch (error) {
            console.error('导出失败:', error);
            return res.status(500).send('导出失败');
        }
    } else {
        res.status(405).send('Method Not Allowed'); // 不允许的方法
    }
}
