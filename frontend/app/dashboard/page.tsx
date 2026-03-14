import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Users, FileText, AlertCircle } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type StudyPatient = {
  first_name: string;
  last_name: string;
};

type RecentStudy = {
  id: string;
  status: string;
  created_at: string;
  patients: StudyPatient | StudyPatient[] | null;
};

function getPatientFromStudy(s: RecentStudy): StudyPatient | null {
  const p = s.patients;
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  const isPatient = role === 'patient';

  const { data: studies } = await supabase
    .from('studies')
    .select('id, status, created_at, patients(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5);
  const { count: patientsCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });
  const { count: studiesCount } = await supabase
    .from('studies')
    .select('*', { count: 'exact', head: true });
  const { count: reportsCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  const stats = isPatient
    ? [
        { label: 'My record', value: patientsCount ?? 0, icon: Users, href: '/dashboard/patients' },
        { label: 'My studies', value: studiesCount ?? 0, icon: FolderOpen, href: '/dashboard/studies' },
        { label: 'My reports', value: reportsCount ?? 0, icon: FileText, href: '/dashboard/reports' },
      ]
    : [
        { label: 'Patients', value: patientsCount ?? 0, icon: Users, href: '/dashboard/patients' },
        { label: 'Studies', value: studiesCount ?? 0, icon: FolderOpen, href: '/dashboard/studies' },
        { label: 'Reports', value: reportsCount ?? 0, icon: FileText, href: '/dashboard/reports' },
      ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">
        {isPatient ? 'Your imaging studies and reports.' : 'Overview of your imaging platform.'}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isPatient ? 'Your recent studies' : 'Recent studies'}</CardTitle>
          </CardHeader>
          <CardContent>
            {studies && studies.length > 0 ? (
              <ul className="space-y-3">
                {(studies as RecentStudy[]).map((s) => {
                  const patient = getPatientFromStudy(s);

                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <span className="font-medium">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">{s.status}</span>
                      </div>
                      <Link href={`/dashboard/studies/${s.id}`}>
                        <Button variant="ghost" size="sm">
                          Open
                        </Button>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isPatient ? 'You have no studies yet.' : 'No studies yet. Create a patient first, then add a study.'}
              </p>
            )}
            <Link href="/dashboard/studies" className="mt-4 block">
              <Button variant="outline" size="sm">
                View all studies
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              AI alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI diagnostic suggestions and quality alerts will appear here when
              you run analysis on studies.
            </p>
            <Link href="/dashboard/studies" className="mt-4 block">
              <Button variant="outline" size="sm">
                Go to studies
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
