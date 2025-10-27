// lib/mbti.ts
export type Personality = {
    id: string;       // "1"~"16"
    name: string;     // "INTJ" ...
    description: string;
    image: string;
};

export const MBTI_TYPES: Personality[] = [
    { id: "1",  name: "INTJ", description: "分析型领袖，逻辑与远见", image: "/images/intj.jpg" },
    { id: "2",  name: "INFP", description: "理想主义者，追求内心的理想", image: "/images/infp.jpg" },
    { id: "3",  name: "ENFP", description: "充满活力，善于交际", image: "/images/enfp.jpg" },
    { id: "4",  name: "ESTJ", description: "务实型领导者，注重细节", image: "/images/estj.jpg" },
    { id: "5",  name: "ISTJ", description: "传统、踏实、责任感强", image: "/images/istj.jpg" },
    { id: "6",  name: "ENTJ", description: "具有领导力的战略家", image: "/images/entj.jpg" },
    { id: "7",  name: "ISFP", description: "艺术家型人格，追求美的世界", image: "/images/isfp.jpg" },
    { id: "8",  name: "ESFP", description: "爱好冒险、喜欢社交", image: "/images/esfp.jpg" },
    { id: "9",  name: "INFJ", description: "深思熟虑的理想主义者", image: "/images/infj.jpg" },
    { id: "10", name: "ENFJ", description: "有魅力的领导者，关心他人", image: "/images/enfj.jpg" },
    { id: "11", name: "ISTP", description: "理性型实干家", image: "/images/istp.jpg" },
    { id: "12", name: "ESTP", description: "行动型领导者，喜欢挑战", image: "/images/estp.jpg" },
    { id: "13", name: "ISFJ", description: "忠诚的守护者，注重责任", image: "/images/isfj.jpg" },
    { id: "14", name: "ESFJ", description: "社交型，善于合作", image: "/images/esfj.jpg" },
    { id: "15", name: "INTP", description: "理性分析者，探索新思路", image: "/images/intp.jpg" },
    { id: "16", name: "ENTP", description: "充满创意，喜欢挑战现状", image: "/images/entp.jpg" }
];

export const getPersonalityById = (id: string) =>
    MBTI_TYPES.find(p => p.id === id);

export const ALL_IDS = () => MBTI_TYPES.map(p => p.id);