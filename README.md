# Waibi Universe (English README)

An MBTI-driven chat and training playground built with Next.js (app router). Users can:
- Browse 16 MBTI personas, each with a base prompt and user-contributed prompt fragments
- Chat with any persona (auth required), with per-persona API key selection
- Train persona behavior by submitting example pairs and adjusting parameters

This repository includes a simple JWT-based auth flow, MongoDB persistence, and a theming system ("waibi" aka dark vs rational aka light).

## Features

- 16 MBTI personas landing: `app/mbti/page.tsx`
- Persona training detail: `app/mbti/[id]/page.tsx`
- Chat with persona (select model client-side): `app/chat/page.tsx` → `components/persona-chat.tsx`
- Persona prompts loading (file-based + user-contributed): `prompts/*.json` + `/api/persona/[code]/prompt`
- Auth (register/login/refresh/me) and Bearer token protection
- MongoDB persistence for user-contributed prompts and per-user chat histories
- Per-persona LLM API key selection with global fallback

## Quick Start

1) Install deps and run dev
```
npm i
npm run dev
```
Visit: http://localhost:3000

2) Start MongoDB (Docker optional)
```
docker compose up -d
```
(or any local MongoDB at `mongodb://127.0.0.1:27017/waibi`)

## Environment Variables (.env.local)

```
# ==== LLM (OpenAI-compatible) ====
# Global upstream endpoint (shared by all personas)
LLM_BASE_URL=https://your-openai-compatible.example/v1/chat/completions
# Global fallback API key (used if persona-specific key is absent)
LLM_API_KEY=
# Global default model (can be overridden from the chat UI)
LLM_MODEL=gpt-4o

# Persona-specific API keys (optional; take precedence over global)
LLM_API_KEY_INTJ=
LLM_API_KEY_INTP=
LLM_API_KEY_INFJ=
LLM_API_KEY_INFP=
LLM_API_KEY_ISTJ=
LLM_API_KEY_ISFJ=
LLM_API_KEY_ISTP=
LLM_API_KEY_ISFP=
LLM_API_KEY_ENTJ=
LLM_API_KEY_ENTP=
LLM_API_KEY_ENFJ=
LLM_API_KEY_ENFP=
LLM_API_KEY_ESTJ=
LLM_API_KEY_ESFJ=
LLM_API_KEY_ESTP=
LLM_API_KEY_ESFP=

# ==== MongoDB ====
MONGODB_URI=mongodb://127.0.0.1:27017/waibi

# ==== JWT ====
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=30d

# ==== Persona external business endpoints (optional) ====
# If set, they can be surfaced to the frontend for future per-persona routing.
PERSONA_API_INTJ=
PERSONA_API_INTP=
PERSONA_API_INFJ=
PERSONA_API_INFP=
PERSONA_API_ISTJ=
PERSONA_API_ISFJ=
PERSONA_API_ISTP=
PERSONA_API_ISFP=
PERSONA_API_ENTJ=
PERSONA_API_ENTP=
PERSONA_API_ENFJ=
PERSONA_API_ENFP=
PERSONA_API_ESTJ=
PERSONA_API_ESFJ=
PERSONA_API_ESTP=
PERSONA_API_ESFP=
```

Notes:
- BASE_URL is global; each persona can have its own API key via `LLM_API_KEY_<CODE>`.
- The chat request body may include `model` to override `LLM_MODEL`.

## Directory Highlights

- `app/mbti/page.tsx`: MBTI grid landing
- `app/mbti/[id]/page.tsx`: Training detail for a selected persona (with UI-only progress simulation)
- `components/persona-chat.tsx`: Persona chat (select persona + select/enter model)
- `app/api/persona/[code]/chat`: Calls upstream LLM with persona system prompt + user message, persists interaction
- `app/api/persona/[code]/prompt`: Returns base prompt (from file) + contributed prompts
- `model/Interaction.ts`: Per-user, per-persona chat history storage
- `model/UserPrompt.ts`: User-contributed prompt storage
- `prompts/*.json`: Base system prompts per persona

## Auth

- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Refresh: `POST /api/auth/refresh`
- Me: `GET /api/auth/me`

Store `accessToken` and `refreshToken` in `localStorage`. The app already attaches `Authorization: Bearer <token>` for protected routes.

## Persona APIs

- `GET /api/persona/[code]/prompt` → `{ base, contributed, api? }`
- `POST /api/persona/[code]/contribute` (auth) → submit prompt fragment `{ text }`
- `GET /api/persona/[code]/history` (auth) → latest history for current user
- `POST /api/persona/[code]/chat` (auth) → `{ reply, interactionId }`

Codes are lowercase persona names (e.g., `intj`, `enfp`, ...).

## Theming

- Two modes: `waibi` (dark) and `rational` (light)
- The header includes a mode toggle; components adapt styles based on `useVibe()`.

## Development Tips

- If you modify prompt files under `prompts/`, restart dev if needed.
- For persona-specific API keys, add `LLM_API_KEY_<CODE>` in `.env.local` and restart.
- MongoDB must be reachable before auth or persona endpoints.

## License

MIT (or adapt as you need).
