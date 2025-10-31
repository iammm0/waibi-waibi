// components/mbti-training-client.tsx
'use client';  // 确保这是客户端组件

import { useState } from "react";

// 定义题目类型
export type TrainingContent = { id: string; question: string; options: string[] };

import { ModelParams } from '@/types/model';
export function MbtiTrainingClient({ personality, questions, modelParams }: { personality: { name: string; id: string; description: string }; questions: TrainingContent[]; modelParams: ModelParams }) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [index, setIndex] = useState(0);

    const currentQuestion = questions[index];

    const chooseAnswer = (questionId: string, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const next = () => setIndex((prev) => Math.min(prev + 1, questions.length - 1));
    const prev = () => setIndex((prev) => Math.max(prev - 1, 0));

    const submitTraining = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
            alert("请先登录后再提交训练数据");
            return;
        }
        const response = await fetch(`/api/training/${personality.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                answers: Object.keys(answers).map((questionId) => ({
                    questionId,
                    answer: answers[questionId],
                })),
                modelParams
            }),
        });

        if (response.ok) {
            alert("训练数据已保存");
        } else if (response.status === 401) {
            alert("登录已过期，请重新登录");
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert(errorData?.message || "提交失败");
        }
    };

    return (
        <div>
            <div>{currentQuestion?.question}</div>
            {currentQuestion?.options.map((opt) => (
                <button key={opt} onClick={() => chooseAnswer(currentQuestion.id, opt)}>
                    {opt}
                </button>
            ))}

            <div>
                <button onClick={prev} disabled={index === 0}>上一题</button>
                <button onClick={next} disabled={index === questions.length - 1}>下一题</button>
                <button onClick={submitTraining}>提交训练</button>
            </div>
        </div>
    );
}
