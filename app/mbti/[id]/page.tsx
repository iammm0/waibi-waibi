'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';

interface TrainingContent {
    id: string;
    question: string;
    options: string[];
}

interface Personality {
    name: string;
    id: string;
    description: string;
}

async function fetchQuestions() {
    const res = await fetch("/api/questions");
    if (!res.ok) {
        throw new Error("Failed to fetch questions");
    }
    return await res.json();
}

export default function MbtiDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [questions, setQuestions] = useState<TrainingContent[]>([]);
    const [personality, setPersonality] = useState<Personality | null>(null);

    useEffect(() => {
        async function getData() {
            try {
                const fetchedQuestions = await fetchQuestions();
                const fetchedPersonality: Personality = {
                    id,
                    name: `人格类型 ${id}`,
                    description: `这是 ${id} 的描述`,
                };

                setQuestions(fetchedQuestions);
                setPersonality(fetchedPersonality);
            } catch (error) {
                console.error(error);
            }
        }

        getData();
    }, [id]);

    if (!personality || questions.length === 0) {
        return <div>加载中...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold">{personality.name} 训练页面</h1>
            <p>{personality.description}</p>
            <div className="space-y-4 mt-4">
                {questions.map((question) => (
                    <div key={question.id} className="border p-4 rounded-lg shadow-md">
                        <div className="text-lg font-medium">{question.question}</div>
                        <div className="mt-2 space-y-2">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    className="w-full p-2 border rounded-md hover:bg-gray-200"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
