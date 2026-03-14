import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAccessPatients, canCreateStudy } from '@/lib/utils';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAccessPatients(role)) redirect('/dashboard');

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  if (!patient) notFound();

  const { data: studies } = await supabase
    .from('studies')
    .select('id, status, modality, body_part, created_at')
    .eq('patient_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-6">
      <Link href="/dashboard/patients" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>
      <h1 className="text-2xl font-bold">
        {patient.first_name} {patient.last_name}
      </h1>
      <p className="text-muted-foreground">
        MRN: {patient.mrn ?? '—'} · DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Gender:</span> {patient.gender ?? '—'}</p>
            <p><span className="text-muted-foreground">Email:</span> {patient.email ?? '—'}</p>
            <p><span className="text-muted-foreground">Phone:</span> {patient.phone ?? '—'}</p>
            <p><span className="text-muted-foreground">Address:</span> {patient.address ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Imaging history
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studies && studies.length > 0 ? (
              <ul className="space-y-2">
                {studies.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded border p-2">
                    <span className="text-sm">{s.modality ?? 'Study'} · {s.body_part ?? '—'} · {s.status}</span>
                    <Link href={`/dashboard/studies/${s.id}`}>
                      <Button variant="ghost" size="sm">Open</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No studies yet.</p>
            )}
            {canCreateStudy(role) && (
              <Link href={`/dashboard/studies/new?patient_id=${id}`} className="mt-4 block">
                <Button variant="outline" size="sm">New study</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
