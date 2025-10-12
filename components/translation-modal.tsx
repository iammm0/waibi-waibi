// TranslationModal.tsx
import React from 'react';

// 定义组件的 props 类型
interface TranslationModalProps {
    sentence: string | null;
    translation: string | null;
    onClose: () => void;
}

const TranslationModal: React.FC<TranslationModalProps> = ({ sentence, translation, onClose }) => {
    // 如果没有句子或翻译，返回 null
    if (!sentence || !translation) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                <h2 className="text-xl mb-4">翻译</h2>
                <p className="mb-2">
                    <strong>原文:</strong> {sentence}
                </p>
                <p>
                    <strong>翻译:</strong> {translation}
                </p>
                <button
                    className="mt-4 text-red-500"
                    onClick={onClose} // 调用关闭函数
                >
                    关闭
                </button>
            </div>
        </div>
    );
};

export default TranslationModal;