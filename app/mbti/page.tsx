// pages/mbti/page.tsx
import PersonalityCard from "@/components/personality-card";

export default function MbtiPage() {
    // 将MBTI类型按组别划分
    const ntGroup = [
        { id: "1", name: "INTJ", description: "分析型领袖，逻辑与远见", image: "/images/intj.jpg" },
        { id: "2", name: "INTP", description: "理性分析者，探索新思路", image: "/images/intp.jpg" },
        { id: "6", name: "ENTJ", description: "具有领导力的战略家", image: "/images/entj.jpg" },
        { id: "16", name: "ENTP", description: "充满创意，喜欢挑战现状", image: "/images/entp.jpg" },
    ];

    const nfGroup = [
        { id: "9", name: "INFJ", description: "深思熟虑的理想主义者", image: "/images/infj.jpg" },
        { id: "2", name: "INFP", description: "理想主义者，追求内心的理想", image: "/images/infp.jpg" },
        { id: "10", name: "ENFJ", description: "有魅力的领导者，关心他人", image: "/images/enfj.jpg" },
        { id: "3", name: "ENFP", description: "充满活力，善于交际", image: "/images/enfp.jpg" },
    ];

    const sjGroup = [
        { id: "5", name: "ISTJ", description: "传统、踏实、责任感强", image: "/images/istj.jpg" },
        { id: "13", name: "ISFJ", description: "忠诚的守护者，注重责任", image: "/images/isfj.jpg" },
        { id: "4", name: "ESTJ", description: "务实型领导者，注重细节", image: "/images/estj.jpg" },
        { id: "14", name: "ESFJ", description: "社交型，善于合作", image: "/images/esfj.jpg" },
    ];

    const spGroup = [
        { id: "11", name: "ISTP", description: "理性型实干家", image: "/images/istp.jpg" },
        { id: "7", name: "ISFP", description: "艺术家型人格，追求美的世界", image: "/images/isfp.jpg" },
        { id: "12", name: "ESTP", description: "行动型领导者，喜欢挑战", image: "/images/estp.jpg" },
        { id: "8", name: "ESFP", description: "爱好冒险、喜欢社交", image: "/images/esfp.jpg" },
    ];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">选择你的人格类型</h1>

            {/* NT组 */}
            <h2 className="text-2xl font-semibold text-center mb-6">NT 组</h2>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
                {ntGroup.map((type) => (
                    <PersonalityCard key={type.id} {...type} containOnMobile focus="top" />
                ))}
            </div>

            {/* NF组 */}
            <h2 className="text-2xl font-semibold text-center mb-6">NF 组</h2>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
                {nfGroup.map((type) => (
                    <PersonalityCard key={type.id} {...type} containOnMobile focus="top" />
                ))}
            </div>

            {/* SJ组 */}
            <h2 className="text-2xl font-semibold text-center mb-6">SJ 组</h2>
            <div className="flex flex-wrap justify-center gap-6 mb-12">
                {sjGroup.map((type) => (
                    <PersonalityCard key={type.id} {...type} containOnMobile focus="top" />
                ))}
            </div>

            {/* SP组 */}
            <h2 className="text-2xl font-semibold text-center mb-6">SP 组</h2>
            <div className="flex flex-wrap justify-center gap-6">
                {spGroup.map((type) => (
                    <PersonalityCard key={type.id} {...type} containOnMobile focus="top" />
                ))}
            </div>
        </div>
    );
}
