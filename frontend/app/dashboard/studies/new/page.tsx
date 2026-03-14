import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StudyForm } from '@/components/studies/study-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canCreateStudy } from '@/lib/utils';

export default async function NewStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ patient_id?: string }>;
}) {
  const { patient_id } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canCreateStudy(role)) redirect('/dashboard/studies');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">New study</h1>
      <p className="text-muted-foreground">Create an imaging study and attach DICOM images.</p>
      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Study details</CardTitle>
          <CardDescription>Modality, body part, and patient.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudyForm defaultPatientId={patient_id ?? undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
