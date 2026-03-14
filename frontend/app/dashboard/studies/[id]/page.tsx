import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileImage, FileText } from 'lucide-react';
import { DicomViewerSection } from '@/components/viewer/dicom-viewer-section';
import { AIAnalysisPanel } from '@/components/ai/ai-analysis-panel';
import type { Database } from '@/types/supabase';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAccessStudies, canUploadDicom } from '@/lib/utils';

type StudyPatient = {
  first_name: string;
  last_name: string;
  mrn: string | null;
  date_of_birth: string | null;
};

type StudyImage = {
  id: string;
  storage_path: string;
  instance_number: number | null;
  metadata: unknown;
};

type StudyDetail = {
  modality: string | null;
  body_part: string | null;
  status: string;
  patients: StudyPatient[] | null;
  images: StudyImage[] | null;
};

type AnalysisRow = Database['public']['Tables']['ai_analysis']['Row'];

export default async function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAccessStudies(role)) redirect('/dashboard');

  const { data: study } = await supabase
    .from('studies')
    .select(`
      *,
      patients ( first_name, last_name, mrn, date_of_birth ),
      images ( id, storage_path, instance_number, metadata )
    `)
    .eq('id', id)
    .single();
  if (!study) notFound();

  const { data: analyses } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('study_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const typedStudy = study as typeof study & StudyDetail;
  const patientsRaw = typedStudy.patients;
  const patient = !patientsRaw ? null : Array.isArray(patientsRaw) ? patientsRaw[0] ?? null : patientsRaw;
  const images = Array.isArray(typedStudy.images) ? typedStudy.images : typedStudy.images ?? [];

  return (
    <div className="p-6">
      <Link href="/dashboard/studies" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to studies
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {patient ? `${patient.first_name} ${patient.last_name}` : 'Study'}
          </h1>
          <p className="text-muted-foreground">
            {typedStudy.modality ?? '-'} / {typedStudy.body_part ?? '-'} / {typedStudy.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/studies/${id}/report`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Report
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Study info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Patient:</span> {patient ? `${patient.first_name} ${patient.last_name}` : '-'}</p>
              <p><span className="text-muted-foreground">MRN:</span> {patient?.mrn ?? '-'}</p>
              <p><span className="text-muted-foreground">Modality:</span> {typedStudy.modality ?? '-'}</p>
              <p><span className="text-muted-foreground">Body part:</span> {typedStudy.body_part ?? '-'}</p>
              <p><span className="text-muted-foreground">Status:</span> {typedStudy.status}</p>
              <p><span className="text-muted-foreground">Images:</span> {images.length}</p>
            </CardContent>
          </Card>

          <AIAnalysisPanel
            studyId={id}
            imageId={images[0]?.id ?? null}
            initialAnalyses={(analyses ?? []) as AnalysisRow[]}
          />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Image viewer
            </CardTitle>
            <CardContent>
              <DicomViewerSection studyId={id} images={images} showUpload={canUploadDicom(role)} />
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
