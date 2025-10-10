// lib/persona.ts
export function getPersonaPrompt(): string {
    // 读取到你的提示词（你自己维护）
    const prompt = process.env.PERSONA_PROMPT?.trim();
    if (!prompt) {
        // 空时给个占位，避免请求失败
        return "You are Zhao Mingjun (赵明俊). Stay consistent with the persona.";
    }
    return prompt;
}