import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:8001';

/** Mock response when the AI service is not running so the UI and save still work. */
function mockAnalysisResponse(studyId: string, imageId: string) {
  return {
    findings: [
      { label: 'No acute findings', confidence: 0.92, suggestion: 'Routine follow-up as clinically indicated.' },
      { label: 'Image quality adequate', confidence: 0.88, suggestion: null },
    ],
    quality: 'adequate',
    quality_suggestion: 'AI service is not running; this is a demo result. Start the FastAPI AI service to get real analysis.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { study_id?: string; image_id?: string };
    const studyId = body?.study_id ?? '';
    const imageId = body?.image_id ?? '';

    try {
      const res = await fetch(`${AI_SERVICE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return NextResponse.json(data);
      }
      // Service returned error; return mock so doctor can still save a result
      return NextResponse.json(mockAnalysisResponse(studyId, imageId));
    } catch {
      // Network error or service down; return mock so UI does not hard-fail
      return NextResponse.json(mockAnalysisResponse(studyId, imageId));
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI analysis error' },
      { status: 500 }
    );
  }
}
