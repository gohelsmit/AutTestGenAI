import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAccessStudies, canCreateStudy } from '@/lib/utils';

type StudyPatient = {
  first_name: string;
  last_name: string;
  mrn?: string | null;
};

type StudyRow = {
  id: string;
  status: string;
  modality: string | null;
  body_part: string | null;
  description: string | null;
  created_at: string;
  patients: StudyPatient | StudyPatient[] | null;
};

function getPatientFromStudy(row: StudyRow): StudyPatient | null {
  const p = row.patients;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function StudiesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAccessStudies(role)) redirect('/dashboard');

  const { data: studies, error: studiesError } = await supabase
    .from('studies')
    .select(`
      id,
      status,
      modality,
      body_part,
      description,
      created_at,
      patients ( first_name, last_name, mrn )
    `)
    .order('created_at', { ascending: false });

  const hasError = !!studiesError?.message;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Studies</h1>
          <p className="text-muted-foreground">Imaging studies and workflow.</p>
        </div>
        {canCreateStudy(role) && (
          <Link href="/dashboard/studies/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New study
            </Button>
          </Link>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{role === 'patient' ? 'Your studies' : 'All studies'}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <p className="text-sm text-destructive">
              Could not load studies: {studiesError?.message}. Check your role and organization.
            </p>
          ) : studies && studies.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Patient</th>
                    <th className="px-4 py-3 text-left font-medium">Modality</th>
                    <th className="px-4 py-3 text-left font-medium">Body part</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(studies as StudyRow[]).map((s) => {
                    const patient = getPatientFromStudy(s);

                    return (
                      <tr key={s.id} className="border-t">
                        <td className="px-4 py-3 font-medium">
                          {patient ? `${patient.first_name} ${patient.last_name}` : '—'}
                        </td>
                        <td className="px-4 py-3">{s.modality ?? '-'}</td>
                        <td className="px-4 py-3">{s.body_part ?? '-'}</td>
                        <td className="px-4 py-3">{s.status}</td>
                        <td className="px-4 py-3">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/dashboard/studies/${s.id}`}>
                            <Button variant="ghost" size="sm">Open</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : role === 'patient' ? (
            <p className="text-sm text-muted-foreground">You have no studies yet.</p>
          ) : (
            <p className="text-sm text-muted-foreground">No studies yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
