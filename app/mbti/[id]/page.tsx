'use client';

import {useState, useEffect, use} from 'react';
import Modal from "@/components/Modal";

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

// 获取问题的函数
async function fetchQuestions() {
    const res = await fetch("/api/questions");
    if (!res.ok) {
        throw new Error("Failed to fetch questions");
    }
    return await res.json();
}

export default function MbtiDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);  // 解包 params.id

    const [questions, setQuestions] = useState<TrainingContent[]>([]);
    const [personality, setPersonality] = useState<Personality | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({}); // 用来记录用户选择的选项
    const [expanded, setExpanded] = useState<Set<string>>(new Set()); // 用来控制哪些问题展开
    const [isModalOpen, setIsModalOpen] = useState(false);  // 控制弹窗显示状态

    // 获取问题和人格信息
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

    // 处理选择选项
    const handleOptionClick = (questionId: string, selectedOption: string) => {
        setSelectedOptions((prevState) => ({
            ...prevState,
            [questionId]: selectedOption,
        }));
    };

    // 切换问题展开/折叠
    const toggleExpand = (questionId: string) => {
        setExpanded((prevExpanded) => {
            const newExpanded = new Set(prevExpanded);
            if (newExpanded.has(questionId)) {
                newExpanded.delete(questionId);  // 如果已经展开，点击后收起
            } else {
                newExpanded.add(questionId);  // 如果没有展开，点击后展开
            }
            return newExpanded;
        });
    };

    // 打开弹窗
    const handleSubmit = () => {
        setIsModalOpen(true);  // 显示弹窗
    };

    // 关闭弹窗
    const closeModal = () => {
        setIsModalOpen(false);  // 隐藏弹窗
    };

    if (!personality || questions.length === 0) {
        return <div>加载中...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold">{personality.name} 训练页面</h1>
            <p>{personality.description}</p>

            {/* 问题展示 */}
            <div className="space-y-4 mt-4">
                {questions.map((question) => (
                    <div key={question.id} className="border p-4 rounded-lg shadow-md">
                        <div
                            className="text-lg font-medium cursor-pointer"
                            onClick={() => toggleExpand(question.id)} // 点击问题时切换展开状态
                        >
                            {question.question}
                        </div>

                        {expanded.has(question.id) && ( // 判断当前问题是否展开
                            <div className="mt-2 space-y-2">
                                {question.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleOptionClick(question.id, option)} // 选择选项时记录答案
                                        className={`w-full p-2 border rounded-md hover:bg-gray-200 ${
                                            selectedOptions[question.id] === option
                                                ? 'bg-blue-100'
                                                : ''
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-center mt-8">
                <button
                    onClick={handleSubmit}
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                    提交训练集
                </button>
            </div>


            {/* 弹窗组件 */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="训练集提交"
                message="您的训练集已成功提交！"
            />

        </div>
    );
}
