const CODE_LIST = [
  'intj','infj','istj','isfj','intp','infp','istp','isfp',
  'entj','enfj','estj','esfj','entp','enfp','estp','esfp'
];

export function getPersonaApiEndpoint(code: string): string | undefined {
  const key = `PERSONA_API_${code.toUpperCase()}`;
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
}

export function getAllPersonaApiConfig(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of CODE_LIST) {
    const v = getPersonaApiEndpoint(c);
    if (v) out[c] = v;
  }
  return out;
}
