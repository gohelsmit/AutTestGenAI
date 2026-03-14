import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ReportForm } from '@/components/reports/report-form';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAccessReports } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type StudyPatient = {
  first_name: string;
  last_name: string;
  mrn: string | null;
  date_of_birth: string | null;
};

type StudyReport = {
  id: string;
  content: string | null;
  findings: unknown;
  impression: string | null;
  status: string;
};

type StudyWithReport = {
  modality: string | null;
  body_part: string | null;
  patients: StudyPatient[] | null;
  reports: StudyReport[] | null;
};

export default async function StudyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studyId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAccessReports(role)) redirect('/dashboard');

  const { data: study, error: studyError } = await supabase
    .from('studies')
    .select(`
      *,
      patients ( first_name, last_name, mrn, date_of_birth ),
      reports ( id, content, findings, impression, status )
    `)
    .eq('id', studyId)
    .single();

  if (studyError ?? !study) {
    if (studyError?.code === 'PGRST116') notFound();
    return (
      <div className="p-6">
        <Link href="/dashboard/studies" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to studies
        </Link>
        <p className="text-destructive">
          Could not load study: {studyError?.message ?? 'Not found'}. Check your access to this study.
        </p>
      </div>
    );
  }

  const typedStudy = study as typeof study & StudyWithReport;
  const patientsRaw = typedStudy.patients;
  const patient = !patientsRaw ? null : Array.isArray(patientsRaw) ? patientsRaw[0] ?? null : patientsRaw;
  const reportsRaw = typedStudy.reports;
  const existingReport = !reportsRaw ? undefined : Array.isArray(reportsRaw) ? reportsRaw[0] : reportsRaw;

  return (
    <div className="p-6">
      <Link href={`/dashboard/studies/${studyId}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to study
      </Link>
      <h1 className="text-2xl font-bold">Report</h1>
      <p className="text-muted-foreground">
        {patient ? `${patient.first_name} ${patient.last_name}` : 'Study'} / {typedStudy.modality ?? '-'} {typedStudy.body_part ?? ''}
      </p>

      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle>Radiology report</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportForm
            studyId={studyId}
            patientName={patient ? `${patient.first_name} ${patient.last_name}` : ''}
            existingReport={existingReport}
          />
        </CardContent>
      </Card>
    </div>
  );
}
