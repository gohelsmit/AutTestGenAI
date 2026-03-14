import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAccessReports } from '@/lib/utils';

type ReportPatient = {
  first_name: string;
  last_name: string;
};

type ReportStudy = {
  id: string;
  modality: string | null;
  body_part: string | null;
  patients: ReportPatient | ReportPatient[] | null;
};

type ReportRow = {
  id: string;
  status: string;
  impression: string | null;
  created_at: string;
  studies: ReportStudy | ReportStudy[] | null;
};

function getStudyFromReport(r: ReportRow): ReportStudy | null {
  const s = r.studies;
  if (!s) return null;
  return Array.isArray(s) ? s[0] ?? null : s;
}

function getPatientFromStudy(s: ReportStudy): ReportPatient | null {
  const p = s.patients;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAccessReports(role)) redirect('/dashboard');

  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select(`
      id,
      status,
      impression,
      created_at,
      studies ( id, modality, body_part, patients ( first_name, last_name ) )
    `)
    .order('created_at', { ascending: false });

  const hasError = !!reportsError?.message;
  const isPatient = role === 'patient';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted-foreground">
        {isPatient ? 'Your radiology reports.' : 'Radiology reports and impressions.'}
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{isPatient ? 'Your reports' : 'All reports'}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <p className="text-sm text-destructive">
              Could not load reports: {reportsError?.message}. Check your role and organization.
            </p>
          ) : reports && reports.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Patient</th>
                    <th className="px-4 py-3 text-left font-medium">Study</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(reports as ReportRow[]).map((r) => {
                    const study = getStudyFromReport(r);
                    const patient = study ? getPatientFromStudy(study) : null;

                    return (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-3 font-medium">
                          {patient ? `${patient.first_name} ${patient.last_name}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {study ? `${study.modality ?? '-'} / ${study.body_part ?? '-'}` : '-'}
                        </td>
                        <td className="px-4 py-3">{r.status}</td>
                        <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          {study ? (
                            <Link href={`/dashboard/studies/${study.id}/report`}>
                              <Button variant="ghost" size="sm">Open</Button>
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : isPatient ? (
            <p className="text-sm text-muted-foreground">You have no reports yet.</p>
          ) : (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
