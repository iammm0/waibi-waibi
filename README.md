# 歪比宇宙使用手册

> README.md 还能这么写？

## 0x00
```
┌─┐┌─┐┌─┐  waibi-waibi  ┌─┐┌─┐┌─┐
│W││A││!│  Hello / 歪比  │B││I││!│
└─┘└─┘└─┘  homepage only └─┘└─┘└─┘
```

## 0x01 · 如何唤醒巨兽
```
npm run dev
```
> 若成功: http://localhost:3000

## 0x02 · 组件花名册
```.dotenv
# 上游模型服务（OpenAI 兼容或你自己的服务）
LLM_BASE_URL=https://api.yourvendor.com/v1/chat/completions
LLM_API_KEY=sk-xxxxxxxxxxxxxxxx
LLM_MODEL=your-model-name

# （可选）人格提示词，服务端注入为 system message
PERSONA_PROMPT="我＝赵明俊。第一人称发言。\n先结论后结构再落地。\n理智与歪比并存。"
```
