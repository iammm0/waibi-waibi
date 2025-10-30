import { NextRequest, NextResponse } from 'next/server';
import { loadPersonaPrompt } from '@/lib/persona-prompts';
import { connectToDatabase } from '@/lib/db';
import UserPrompt from '@/model/UserPrompt';
import { getPersonaApiEndpoint } from '@/lib/persona-config';

export async function GET(_req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase();
  const base = loadPersonaPrompt(code) || { system: [] };
  const api = getPersonaApiEndpoint(code);
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ base, contributed: [], api });
  }
  const contributed = await UserPrompt.find({ personaCode: code }).sort({ createdAt: 1 }).lean();
  return NextResponse.json({ base, contributed: contributed.map(c => c.text), api });
}
