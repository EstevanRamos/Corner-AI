// REFERENCE ONLY - Logic is currently handled client-side in useOpponentAnalysis.ts

/*
import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '../../../../services/geminiService';
import { PROMPTS, buildUserPrompt } from '../../../../lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const video = formData.get('video') as File;
    const reportType = formData.get('reportType') as string;
    const context = formData.get('context') as string; // JSON string

    if (!video) return NextResponse.json({ error: 'Missing video' }, { status: 400 });

    const templateId = reportType === 'quick' ? 'OPPONENT_BREAKDOWN_QUICK' : 'OPPONENT_BREAKDOWN_FULL';
    const template = PROMPTS[templateId];
    
    // ... logic to call Gemini ...
    
    return NextResponse.json({ success: true, report: '...' });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
*/
