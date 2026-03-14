'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database, Json } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, AlertCircle } from 'lucide-react';

type AnalysisRow = Database['public']['Tables']['ai_analysis']['Row'];

type Finding = {
  label: string;
  confidence: number;
  region?: number[] | null;
  suggestion?: string | null;
};

type AnalyzeResponse = {
  findings: Finding[];
  quality?: string | null;
  quality_suggestion?: string | null;
};

function normalizeFindings(value: Json): Finding[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const label = typeof record.label === 'string' ? record.label : 'unknown';
    const confidence = typeof record.confidence === 'number' ? record.confidence : 0;
    const region = Array.isArray(record.region)
      ? record.region.filter((point): point is number => typeof point === 'number')
      : null;
    const suggestion = typeof record.suggestion === 'string' ? record.suggestion : null;

    return [{ label, confidence, region, suggestion }];
  });
}

export function AIAnalysisPanel({
  studyId,
  imageId,
  initialAnalyses,
}: {
  studyId: string;
  imageId: string | null;
  initialAnalyses: AnalysisRow[];
}) {
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalyzeResponse | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<AnalysisRow[]>(initialAnalyses);
  const { toast } = useToast();
  const supabase = createClient();

  async function handleRunAnalysis() {
    if (!imageId) {
      toast({ title: 'No image available', description: 'Upload at least one DICOM file before running AI analysis.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_id: studyId, image_id: imageId }),
      });
      const data = (await response.json()) as AnalyzeResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'AI analysis failed');
      }

      setCurrentResult(data);

      const maxConfidence = data.findings.length > 0
        ? Math.max(...data.findings.map((finding) => finding.confidence))
        : null;

      const { data: inserted, error } = await supabase
        .from('ai_analysis')
        .insert({
          study_id: studyId,
          image_id: imageId,
          model_name: 'nextgen-mock-v1',
          findings: data.findings,
          confidence: maxConfidence,
        })
        .select('*')
        .single();

      if (error) {
        toast({
          title: 'AI result received',
          description: `Analysis ran successfully, but saving to Supabase failed: ${error.message}`,
          variant: 'destructive',
        });
      } else if (inserted) {
        setSavedAnalyses((previous) => [inserted, ...previous]);
        toast({ title: 'AI analysis completed' });
      }
    } catch (error) {
      toast({
        title: 'AI analysis failed',
        description: error instanceof Error ? error.message : 'Unexpected AI service error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const latestSavedAnalysis = savedAnalyses[0] ?? null;
  const latestSavedFindings = latestSavedAnalysis ? normalizeFindings(latestSavedAnalysis.findings) : [];

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Analysis
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Run the connected FastAPI service against the current study and store the result in Supabase.
          </p>
        </div>
        <Button onClick={handleRunAnalysis} disabled={loading || !imageId}>
          {loading ? 'Running...' : 'Run analysis'}
        </Button>
      </div>

      {!imageId ? (
        <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Upload at least one DICOM file before running analysis.
        </div>
      ) : null}

      {currentResult ? (
        <div className="space-y-3 rounded-md border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">Latest response</p>
            <p className="text-sm text-muted-foreground">
              Quality: {currentResult.quality ?? 'unknown'}
              {currentResult.quality_suggestion ? ` — ${currentResult.quality_suggestion}` : ''}
            </p>
          </div>
          {currentResult.findings.length > 0 ? (
            <ul className="space-y-2">
              {currentResult.findings.map((finding, index) => (
                <li key={`${finding.label}-${index}`} className="rounded-md border bg-background p-3 text-sm">
                  <div className="font-medium">{finding.label}</div>
                  <div className="text-muted-foreground">Confidence: {(finding.confidence * 100).toFixed(1)}%</div>
                  {finding.suggestion ? <div className="mt-1">{finding.suggestion}</div> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No findings returned.</p>
          )}
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Saved analyses</p>
          <p className="text-sm text-muted-foreground">
            {savedAnalyses.length > 0 ? `${savedAnalyses.length} saved result(s) for this study.` : 'No saved AI analyses yet.'}
          </p>
        </div>

        {latestSavedAnalysis ? (
          <div className="rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">{latestSavedAnalysis.model_name ?? 'AI model'}</span>
              <span className="text-muted-foreground">{new Date(latestSavedAnalysis.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Confidence: {latestSavedAnalysis.confidence !== null ? `${(latestSavedAnalysis.confidence * 100).toFixed(1)}%` : 'n/a'}
            </div>
            {latestSavedFindings.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {latestSavedFindings.map((finding, index) => (
                  <li key={`${latestSavedAnalysis.id}-${index}`} className="rounded-md bg-muted/30 p-3 text-sm">
                    <div className="font-medium">{finding.label}</div>
                    <div className="text-muted-foreground">Confidence: {(finding.confidence * 100).toFixed(1)}%</div>
                    {finding.suggestion ? <div className="mt-1">{finding.suggestion}</div> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
