import type { NextRequest } from "next/server";
import {getPersonaPrompt} from "@/lib/persona";

const UPSTREAM_URL = process.env.LLM_BASE_URL ?? "https://jeniya.cn/v1/chat/completions";
const API_KEY = process.env.LLM_API_KEY ?? "sk-i6nNLAKBAVe84cBjPS0YOKUi0KjlCSnkB5IDtXyratNejonb";
const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return new Response("Missing LLM_API_KEY", { status: 500 });
    }

    try {
        const body = await req.json();
        const userMessages = (body?.messages ?? []) as Array<{ role: "user" | "assistant"; content: string }>;

        const messages = [
            { role: "system", content: getPersonaPrompt() },
            ...userMessages,
        ];

        // 构造“OpenAI 兼容”请求体；如你的服务字段不同，在这里改
        const upstreamRes = await fetch(UPSTREAM_URL, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                temperature: 0.8,
                stream: false, // 非流式；如要流式返回，设 true 并改前端
            }),
        });

        if (!upstreamRes.ok) {
            const text = await upstreamRes.text();
            return new Response(text || "Upstream error", { status: upstreamRes.status });
        }

        const json = await upstreamRes.json();

        // 兼容大多数 OpenAI 格式
        // 有的服务商是 json.choices[0].message.content
        const reply =
            json?.choices?.[0]?.message?.content ??
            json?.output_text ??
            json?.reply ??
            "";

        return Response.json({ reply });
    } catch (e: any) {
        return new Response(e?.message || "Bad Request", { status: 400 });
    }
}