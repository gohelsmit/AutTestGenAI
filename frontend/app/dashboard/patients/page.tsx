import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PatientsTable } from '@/components/patients/patients-table';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAccessPatients, canAddPatient } from '@/lib/utils';

export default async function PatientsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAccessPatients(role)) redirect('/dashboard');

  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, mrn, first_name, last_name, date_of_birth, gender, created_at')
    .order('last_name');

  const list = patients ?? [];
  const isEmpty = list.length === 0;
  const hasError = !!patientsError?.message;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">
            {role === 'patient' ? 'Your patient record and imaging history.' : 'Manage patient records and imaging history.'}
          </p>
        </div>
        {canAddPatient(role) && (
          <Link href="/dashboard/patients/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add patient
            </Button>
          </Link>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{role === 'patient' ? 'Your record' : 'All patients'}</CardTitle>
        </CardHeader>
        <CardContent>
          {hasError ? (
            <p className="text-sm text-destructive">
              Could not load patients: {patientsError?.message}. Check your role and organization in the profile.
            </p>
          ) : isEmpty && role === 'patient' ? (
            <p className="text-sm text-muted-foreground">
              Your patient record is not linked yet. Ask your clinic to link your account to your patient record.
            </p>
          ) : isEmpty ? (
            <p className="text-sm text-muted-foreground">No patients yet. Add a patient to get started.</p>
          ) : (
            <PatientsTable patients={list} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
