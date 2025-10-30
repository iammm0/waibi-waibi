import fs from 'fs';
import path from 'path';

const cache = new Map<string, any>();

export function getPersonaCodeFromName(name: string): string {
  return name.toLowerCase();
}

export function loadPersonaPrompt(code: string): any | null {
  if (cache.has(code)) return cache.get(code);
  try {
    const filePath = path.join(process.cwd(), 'prompts', `${code}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    cache.set(code, json);
    return json;
  } catch {
    return null;
  }
}
