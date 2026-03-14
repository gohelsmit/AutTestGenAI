'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

type ExistingReport = {
  id: string;
  content: string | null;
  findings: unknown;
  impression: string | null;
  status: string;
} | undefined;

export function ReportForm({
  studyId,
  patientName,
  existingReport,
}: {
  studyId: string;
  patientName: string;
  existingReport?: ExistingReport;
}) {
  const [content, setContent] = useState(existingReport?.content ?? '');
  const [impression, setImpression] = useState(existingReport?.impression ?? '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSave() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (existingReport) {
      const { error } = await supabase
        .from('reports')
        .update({ content, impression, updated_at: new Date().toISOString() })
        .eq('id', existingReport.id);
      if (error) {
        toast({
          title: 'Update failed',
          description: error.message + (error.code === '42501' ? ' You may not have permission to edit this report.' : ''),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      toast({ title: 'Report updated' });
    } else {
      let authorId: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.id) authorId = user.id;
      }
      const { error } = await supabase.from('reports').insert({
        study_id: studyId,
        author_id: authorId,
        content,
        impression,
        status: 'draft',
      });
      if (error) {
        toast({
          title: 'Save failed',
          description: error.message + (error.code === '42501' ? ' Check your role and access to this study.' : ''),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      toast({ title: 'Report created' });
    }
    setLoading(false);
    router.refresh();
  }

  async function handleSign() {
    setLoading(true);
    if (existingReport) {
      const { error } = await supabase
        .from('reports')
        .update({
          content,
          impression,
          status: 'signed',
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReport.id);
      if (error) {
        toast({
          title: 'Sign failed',
          description: error.message + (error.code === '42501' ? ' You may not have permission to sign this report.' : ''),
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      toast({ title: 'Report signed' });
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Patient: {patientName}</p>
      <div className="space-y-2">
        <Label htmlFor="content">Findings / Content</Label>
        <textarea
          id="content"
          className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter findings..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="impression">Impression</Label>
        <textarea
          id="impression"
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Conclusion / impression"
          value={impression}
          onChange={(e) => setImpression(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : existingReport ? 'Update' : 'Save draft'}
        </Button>
        <Button variant="outline" onClick={handleSign} disabled={loading}>
          Sign report
        </Button>
      </div>
    </div>
  );
}
