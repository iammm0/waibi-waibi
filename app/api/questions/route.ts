// app/api/questions/route.ts

export async function GET(req: Request) {
    const questions = [
        {
            id: "1",
            question: "当面对一个复杂问题时，你通常会如何处理？",
            options: ["分析并解决", "寻求他人意见", "感性地决策"],
        },
        {
            id: "2",
            question: "你认为团队中应该由谁来主导？",
            options: ["理性分析者", "富有创意的人", "自信的领导者"],
        },
        {
            id: "3",
            question: "你如何看待挑战自我并提升自己的机会？",
            options: ["它是我的使命", "我享受其中的成长", "我比较喜欢安定"],
        },
        {
            id: "4",
            question: "你如何处理人际关系中的冲突？",
            options: ["寻求和谐与理解", "冷静分析，找到解决方案", "尽量避免冲突"],
        },
    ];

    return new Response(JSON.stringify(questions), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
